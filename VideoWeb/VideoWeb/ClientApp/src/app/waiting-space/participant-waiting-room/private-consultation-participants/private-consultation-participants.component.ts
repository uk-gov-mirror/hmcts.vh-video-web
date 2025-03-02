import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConsultationAnswer,
    LinkType,
    ParticipantResponse,
    ParticipantStatus,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';
import { ActivatedRoute } from '@angular/router';
import { HearingRole } from '../../models/hearing-role-model';
import { TranslateService } from '@ngx-translate/core';
import { ParticipantListItem } from '../participant-list-item';

@Component({
    selector: 'app-private-consultation-participants',
    templateUrl: './private-consultation-participants.component.html',
    styleUrls: ['./private-consultation-participants.component.scss']
})
export class PrivateConsultationParticipantsComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    @Input() roomLabel: string;
    participantCallStatuses = {};

    constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected route: ActivatedRoute,
        protected translateService: TranslateService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService);
        this.loggerPrefix = '[PrivateConsultationParticipantsComponent] - ';
    }

    ngOnInit(): void {
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.setupSubscribers();
        this.setupInviteStatusSubscribers();
    }

    ngOnDestroy() {
        this.executeTeardown();
    }

    setupInviteStatusSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Subscribing to ConsultationRequestResponseMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getConsultationRequestResponseMessage().subscribe(message => {
                if (message.roomLabel === this.roomLabel && message.conferenceId === this.conference.id) {
                    this.participantCallStatuses[message.requestedFor] = message.answer;
                    setTimeout(() => {
                        if (this.participantCallStatuses[message.requestedFor] === message.answer) {
                            this.participantCallStatuses[message.requestedFor] = null;
                        }
                    }, 10000);
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to RequestedConsultationMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getRequestedConsultationMessage().subscribe(message => {
                // Set 'Calling...'
                // No need to timeout here the text because when the notification times out it will send another event.
                if (message.roomLabel === this.roomLabel && message.conferenceId === this.conference.id) {
                    this.participantCallStatuses[message.requestedFor] = 'Calling';
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to ParticipantStatusMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                // If the participant state changes reset the state.
                this.participantCallStatuses[message.participantId] = null;
            })
        );
    }

    get endpointInRoom(): boolean {
        return this.conference.endpoints.some(x => this.isParticipantInCurrentRoom(x));
    }

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        return (
            !this.isParticipantInCurrentRoom(endpoint) &&
            this.isParticipantAvailable(endpoint) &&
            !this.endpointInRoom &&
            this.participantEndpoints.some(x => x.id === endpoint.id)
        );
    }

    getRowClasses(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return '';
    }

    isJohInCurrentRoom(participant: ParticipantResponse): boolean {
        return (
            this.isParticipantInCurrentRoom(participant) &&
            (participant.hearing_role === HearingRole.PANEL_MEMBER ||
                participant.hearing_role === HearingRole.WINGER ||
                participant.hearing_role === HearingRole.JUDGE)
        );
    }

    getPrivateConsultationParticipants(): ParticipantListItem[] {
        if (this.roomLabel?.toLowerCase().includes('judgejohconsultationroom')) {
            return this.participantsInConsultation;
        } else {
            return this.participantsInConsultation
                .filter(p => p.hearing_role !== HearingRole.WITNESS && p.hearing_role !== HearingRole.OBSERVER)
                .filter(p => p.hearing_role !== HearingRole.INTERPRETER)
                .map(p => {
                    const interpreterLink = p.linked_participants.find(x => x.link_type === LinkType.Interpreter);
                    const participant: ParticipantListItem = { ...p };
                    if (p.linked_participants && interpreterLink) {
                        participant.interpreter = this.participantsInConsultation.find(x => x.id === interpreterLink.linked_id);
                    }
                    return participant;
                });
        }
    }

    getParticipantStatus(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return '';
        }
        if (this.participantCallStatuses[participant.id] === 'Calling') {
            return this.translateService.instant('private-consultation-participants.calling');
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Rejected) {
            return this.translateService.instant('private-consultation-participants.declined');
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Failed) {
            return this.translateService.instant('private-consultation-participants.failed');
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.None) {
            return this.translateService.instant('private-consultation-participants.no-answer');
        }
        if (
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Transferring ||
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Accepted
        ) {
            return this.translateService.instant('private-consultation-participants.transferring');
        }
        if (participant.current_room?.label) {
            return (
                this.consultationService.consultationNameToString(participant.current_room?.label, true) +
                (participant.current_room?.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }

        if (!this.isParticipantAvailable(participant)) {
            return this.translateService.instant('private-consultation-participants.not-available');
        }
    }

    isParticipantAvailable(participant: any): boolean {
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(participant.status) >= 0;
    }

    participantNameClass(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return this.isParticipantAvailable(participant) ? 'white' : '';
    }

    isParticipantInCurrentRoom(participant: any): boolean {
        return participant.current_room?.label === this.roomLabel;
    }

    getParticipantStatusClasses(participant: ParticipantResponse): string {
        if (this.participantCallStatuses[participant.id] === 'Calling') {
            return 'yellow';
        }
        if (
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Transferring ||
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Accepted
        ) {
            return 'yellow';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Rejected) {
            return 'red';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Failed) {
            return 'red';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.None) {
            return 'red';
        }
        if (participant.status === ParticipantStatus.InConsultation && !this.isParticipantInCurrentRoom(participant)) {
            return 'outline';
        }
        return 'white';
    }

    setupSubscribers(): void {
        this.addSharedEventHubSubcribers();
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        return !this.isParticipantInCurrentRoom(participant) && participant.status === ParticipantStatus.Available;
    }

    trackParticipant(index: number, item: ParticipantListItem) {
        return item.status;
    }
}
