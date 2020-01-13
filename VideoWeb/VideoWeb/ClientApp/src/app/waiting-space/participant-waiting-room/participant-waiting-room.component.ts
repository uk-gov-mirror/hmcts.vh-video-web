import { Component, NgZone, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import {
  ConferenceResponse, ConferenceStatus, ParticipantResponse, ParticipantStatus,
  TokenResponse,
  ConsultationAnswer
} from 'src/app/services/clients/api-client';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ErrorService } from 'src/app/services/error.service';
import { ClockService as ClockService } from 'src/app/services/clock.service';
import { Hearing } from '../../shared/models/hearing';
import { UserMediaService } from 'src/app/services/user-media.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Subscription } from 'rxjs';
declare var PexRTC: any;
declare var HeartbeatFactory: any;


@Component({
  selector: 'app-participant-waiting-room',
  templateUrl: './participant-waiting-room.component.html',
  styleUrls: ['./participant-waiting-room.component.scss']
})
export class ParticipantWaitingRoomComponent implements OnInit, OnDestroy {

  private maxBandwidth = 768;

  loadingData: boolean;
  conferencesSubscription: Subscription;
  hearing: Hearing;
  participant: ParticipantResponse;
  conference: ConferenceResponse;
  token: TokenResponse;
  pexipAPI: any;
  stream: MediaStream;
  connected: boolean;
  outgoingStream: MediaStream;

  currentTime: Date;
  hearingStartingAnnounced: boolean;
  currentPlayCount: number;
  hearingAlertSound: HTMLAudioElement;

  showVideo: boolean;
  showConsultationControls: boolean;
  selfViewOpen: boolean;
  isAdminConsultation: boolean;
  
  subscription: Subscription;
  errorCount: number;

  CALL_TIMEOUT = 31000; // 31 seconds
  callbackTimeout: NodeJS.Timer;
  heartbeat: any;

  constructor(
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private adalService: AdalService,
    private errorService: ErrorService,
    private clockService: ClockService,
    private userMediaService: UserMediaService,
    private logger: Logger,
    private consultationService: ConsultationService,
    private router: Router
  ) {
    this.isAdminConsultation = false;
    this.loadingData = true;
    this.showVideo = false;
    this.showConsultationControls = false;
    this.selfViewOpen = false;
  }

  ngOnInit() {
    this.errorCount = 0;
    this.logger.debug('Loading participant waiting room');
    this.connected = false;
    this.initHearingAlert();
    this.getConference();
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    clearTimeout(this.callbackTimeout);
    this.conferencesSubscription.unsubscribe();
    if (this.heartbeat) {
      this.heartbeat.kill();
    }
    this.disconnect();
  }

  disconnect() {
    if (this.pexipAPI) {
      this.logger.info('disconnecting from pexip node');
      this.pexipAPI.disconnect();
    }
    this.stream = null;
    this.outgoingStream = null;
    this.connected = false;
    this.showVideo = false;
  }

  initHearingAlert() {
    this.hearingStartingAnnounced = false;
    this.currentPlayCount = 1;

    this.hearingAlertSound = new Audio();
    this.hearingAlertSound.src = '/assets/audio/hearing_starting_soon.mp3';
    this.hearingAlertSound.load();
    const self = this;
    this.hearingAlertSound.addEventListener('ended', function () {
      self.currentPlayCount++;
      if (self.currentPlayCount <= 3) {
        this.play();
      }
    }, false);
  }

  subscribeToClock(): void {
    this.subscription = this.clockService.getClock().subscribe((time) => {
      this.currentTime = time;
      this.checkIfHearingIsClosed();
      this.checkIfHearingIsStarting();
    });
  }

  checkIfHearingIsStarting(): void {
    if (this.hearing.isStarting() && !this.hearingStartingAnnounced) {
      this.announceHearingIsAboutToStart();
    }
  }

  checkIfHearingIsClosed(): void {
    if (this.hearing.isPastClosedTime()) {
      this.subscription.unsubscribe();
      this.router.navigate([PageUrls.ParticipantHearingList]);
    }
  }

  announceHearingIsAboutToStart(): void {
    const self = this;
    this.hearingAlertSound.play()
      .catch(function (reason) {
        self.logger.error('Failed to announce hearing starting', reason);
      });
    this.hearingStartingAnnounced = true;
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.conferencesSubscription = this.videoWebService.getConferenceById(conferenceId)
      .subscribe(async (data: ConferenceResponse) => {
        this.errorCount = 0;
        this.loadingData = false;
        this.hearing = new Hearing(data);
        this.conference = this.hearing.getConference();
        this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
        this.logger.info(`Participant waiting room : Conference Id: ${conferenceId} and participantId: ${this.participant.id},
          participant name : ${this.videoWebService.getObfuscatedName(this.participant.first_name + ' ' + this.participant.last_name)}`);
        this.getJwtoken();
      },
        (error) => {
          this.logger.error(`There was an error getting a conference ${conferenceId}`, error);
          this.loadingData = false;
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
        });
  }

  getJwtoken(): void {
    this.logger.debug('retrieving jwtoken');
    this.videoWebService.getJwToken(this.participant.id).subscribe(async (token: TokenResponse) => {
      this.logger.debug('retrieved jwtoken for heartbeat');
      this.token = token;
      this.subscribeToClock();
      this.setupSubscribers();
      await this.setupPexipClient();
      this.call();
    },
      (error) => {
        this.logger.error(`There was an error getting a jwtoken for ${this.participant.id}`, error);
        this.errorService.handleApiError(error);
      });
  }

  getConferenceStatusText(): string {
    if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
      if (this.hearing.isStarting()) {
        return 'is about to begin';
      } else if (this.hearing.isDelayed()) {
        return 'is delayed';
      } else {
        return '';
      }
    } else if (this.hearing.isSuspended()) {
      return 'is suspended';
    } else if (this.hearing.isPaused()) {
      return 'is paused';
    } else if (this.hearing.isClosed()) {
      return 'is closed';
    }
    return 'is in session';
  }

  private setupSubscribers() {
    this.eventService.start();

    this.logger.debug('Subscribing to conference status changes...');
    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleConferenceStatusChange(message);
        this.updateShowVideo();
      });
    });

    this.logger.debug('Subscribing to participant status changes...');
    this.eventService.getParticipantStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleParticipantStatusChange(message);
        this.updateShowVideo();
      });
    });

    this.logger.debug('Subscribing to admin consultation messages...');
    this.eventService.getAdminConsultationMessage().subscribe(message => {
      this.ngZone.run(() => {
        if (message.answer && message.answer === ConsultationAnswer.Accepted) {
          this.isAdminConsultation = true;
        }
      });
    });
  }

  handleParticipantStatusChange(message: ParticipantStatusMessage): any {
    const participant = this.hearing.getConference().participants.find(p => p.id === message.participantId);
    participant.status = message.status;
    this.logger.info(`Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Participant status : ${participant.status}`);
    if (message.status !== ParticipantStatus.InConsultation) {
      this.isAdminConsultation = false;
    }
  }

  handleConferenceStatusChange(message: ConferenceStatusMessage) {
    this.hearing.getConference().status = message.status;
    this.logger.info(`Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Conference status : ${message.status}`);
    if (message.status === ConferenceStatus.Closed) {
      this.getConferenceClosedTime(this.hearing.id);
    }
  }

  async setupPexipClient() {
    this.logger.debug('Setting up pexip client...');
    const self = this;
    this.pexipAPI = new PexRTC();

    const preferredCam = await this.userMediaService.getPreferredCamera();
    if (preferredCam) {
      this.pexipAPI.video_source = preferredCam.deviceId;
      self.logger.info(`Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Using preferred camera: ${preferredCam.label}`);
      // self.logger.info(`Using preferred camera: ${preferredCam.label}`);
    }

    const preferredMic = await this.userMediaService.getPreferredMicrophone();
    if (preferredMic) {
      this.pexipAPI.audio_source = preferredMic.deviceId;
      self.logger.info(`Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Using preferred microphone: ${preferredMic.label}`);
      // self.logger.info(`Using preferred microphone: ${preferredMic.label}`);
    }

      this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      self.logger.info('running pexip setup');
      this.connect('0000', null);
      self.outgoingStream = stream;
        //if (outStream) {
        //    console.warn('################### this.pexipAPI.onSetup  Stream1 ######### ');
        //    console.warn(outStream);
        //    console.warn('################### this.pexipAPI.onSetup  Stream2 ######### ');
        //    const selfvideo = document.getElementById('outgoingFeedVideo') as any;
        //    if (selfvideo) {
        //        self.assignStream(selfvideo, outStream);
        //    } else {
        //        console.warn('################### this.pexipAPI.onSetup ########### Else element is missing for outgoing feed');
        //    }
        //} else {
        //    console.warn('################### this.pexipAPI.onSetup ############## No stream');
        //}

    };

      this.pexipAPI.onConnect = function (stream) {
      self.errorCount = 0;
      self.connected = true;
      //self.updateShowVideo();
      self.logger.info('successfully connected to call');
          self.stream = stream;
          const incomingFeedElement = document.getElementById('incomingFeed') as any;
          const incomingFeedPrivateElement = document.getElementById('incomingFeedPrivate') as any;
          if (stream) {
            //this. = true;f
            self.updateShowVideo();
            console.warn('################### this.pexipAPI.onConnect  Stream1 ######### ');
              console.warn(stream);
            console.warn('################### this.pexipAPI.onConnect  Stream2 ######### ');

            if (incomingFeedElement) {
                self.assignStream(incomingFeedElement, stream);
            } else {
                console.warn('################### this.pexipAPI.onConnect ########### Else element is missing for outgoing feed');
            }

              //if (incomingFeedPrivateElement) {
              //    self.assignStream(incomingFeedPrivateElement, stream);
              //} 
        } else {
            console.warn('################### this.pexipAPI.onConnect ############## No stream');
        }

      const baseUrl = self.conference.pexip_node_uri.replace('sip.', '');
      const url = `https://${baseUrl}/virtual-court/api/v1/hearing/${self.conference.id}`;
      self.logger.debug(`heartbeat uri: ${url}`);
      const bearerToken = `Bearer ${self.token.token}`;
      self.heartbeat = new HeartbeatFactory(self.pexipAPI, url, self.conference.id, self.participant.id, bearerToken);
    };

    this.pexipAPI.onError = function (reason) {
      self.errorCount++;
      self.connected = false;
      self.heartbeat.kill();
      self.updateShowVideo();
      self.logger.error(`Error from pexip. Reason : ${reason}`, reason);
      if (self.errorCount > 3) {
        self.errorService.goToServiceError();
      }
    };

    this.pexipAPI.onDisconnect = function (reason) {
      self.connected = false;
      self.heartbeat.kill();
      self.updateShowVideo();
      self.logger.warn(`Disconnected from pexip. Reason : ${reason}`);
      if (!self.hearing.isPastClosedTime()) {
        self.callbackTimeout = setTimeout(() => {
          self.call();
        }, self.CALL_TIMEOUT);
      }
    };

    this.pexipAPI.onParticipantCreate = function (participant) {
      self.logger.debug(`Participant added : ${participant}`);
    };

    this.pexipAPI.onParticipantDelete = function (participant) {
      self.logger.debug(`Participant removed : ${participant}`);
    };
  }

  call() {
    const pexipNode = this.hearing.getConference().pexip_node_uri;
    const conferenceAlias = this.hearing.getConference().participant_uri;
    const displayName = this.participant.tiled_display_name;
    this.logger.debug(`Calling ${pexipNode} - ${conferenceAlias} as ${displayName}`);
    this.pexipAPI.makeCall(pexipNode, conferenceAlias, displayName, this.maxBandwidth);
  }

  updateShowVideo(): void {
    if (!this.connected) {
      this.logger.debug('Not showing video because not connecting to node');
      this.showVideo = false;
      this.showConsultationControls = false;
      return;
    }

    if (this.hearing.isInSession()) {
      this.logger.debug('Showing video because hearing is in session');
      this.showVideo = true;
      this.showConsultationControls = false;
      return;
    }

    if (this.participant.status === ParticipantStatus.InConsultation) {
      this.logger.debug('Showing video because hearing is in session');
      this.showVideo = true;
      this.showConsultationControls = !this.isAdminConsultation;
      return;
    }

    this.logger.debug('Not showing video because hearing is not in session and user is not in consultation');
    this.showVideo = false;
    this.showConsultationControls = false;
  }

  async onConsultationCancelled() {
    // this.logger.debug(`Participant ${this.participant.id} Attempting to leave conference: ${this.conference.id}`);
    this.logger.info(`Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}. Participant ${this.participant.id} attempting to leave conference: ${this.conference.id}`);
    try {
      await this.consultationService.leaveConsultation(this.conference, this.participant).toPromise();
    } catch (error) {
      this.logger.error('Failed to leave private consultation', error);
    }
  }

  toggleView(): boolean {
    return this.selfViewOpen = !this.selfViewOpen;
  }

  getConferenceClosedTime(conferenceId: string): void {
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe(async (data: ConferenceResponse) => {
        this.hearing = new Hearing(data);
        this.conference = this.hearing.getConference();
        this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
        this.logger.info(`Participant waiting room : Conference with id ${conferenceId} closed | Participant Id : ${this.participant.id}, ${this.participant.display_name}.`);
      },
        (error) => {
          this.logger.error(`There was an error getting a conference ${conferenceId}`, error);
        });
    }

    assignStream(videoElement, stream) {
        if (typeof (MediaStream) !== 'undefined' && stream instanceof MediaStream) {
            videoElement.srcObject = stream;
        } else {
            videoElement.src = stream;
        }
    }
}
