import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ParticipantResponse,
    ParticipantStatus,
    Role,
    UpdateParticipantDisplayNameRequest,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingRole } from '../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';

@Component({
    selector: 'app-judge-participant-status-list',
    templateUrl: './judge-participant-status-list.component.html',
    styleUrls: ['./judge-participant-status-list.component.scss']
})
export class JudgeParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    representativeParticipants: ParticipantResponse[];
    litigantInPerson: boolean;
    individualParticipants: ParticipantResponse[];
    showChangeJudgeDisplayName = false;
    newJudgeDisplayName: string;

    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];
    wingers: ParticipantResponse[];
    isUserJudge: boolean;

    hearing: Hearing;

    constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected route: ActivatedRoute,
        protected translateService: TranslateService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService);
    }

    ngOnInit() {
        this.hearing = new Hearing(this.conference);
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.addSharedEventHubSubcribers();
    }

    ngOnDestroy() {
        this.executeTeardown();
    }

    initParticipants() {
        super.initParticipants();
        this.filterRepresentatives();
        this.isUserJudge = this.loggedInUser.role === Role.Judge;
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.None) {
            return this.translateService.instant('judge-participant-status-list.not-signed-in');
        }
        if (participant.status === ParticipantStatus.Available || participant.status === ParticipantStatus.InHearing) {
            return this.translateService.instant('judge-participant-status-list.connected');
        }
        return this.translateService.instant('participant-status.' + participant.status.toString().toLowerCase());
    }

    getEndpointStatus(endpoint: VideoEndpointResponse): string {
        return this.translateService.instant('endpoint-status.' + endpoint.status.toString().toLowerCase());
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.None) {
            return this.camelToSnake(ParticipantStatus.NotSignedIn.toString());
        } else {
            return this.camelToSnake(participant.status.toString());
        }
    }

    getEndpointStatusCss(endpoint: VideoEndpointResponse): string {
        return this.camelToSnake(endpoint.status.toString());
    }

    private filterRepresentatives(): void {
        this.representativeParticipants = this.conference.participants.filter(
            x => x.role === Role.Representative && x.hearing_role !== HearingRole.OBSERVER
        );
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(
            x => x.role === Role.Individual && x.hearing_role !== HearingRole.OBSERVER
        );
    }

    changeJudgeNameShow() {
        this.showChangeJudgeDisplayName = true;
        this.newJudgeDisplayName = this.judge.display_name;
    }

    onEnterJudgeDisplayName(value: string) {
        this.newJudgeDisplayName = value;
    }

    async saveJudgeDisplayName() {
        this.judge.display_name = this.newJudgeDisplayName;
        this.showChangeJudgeDisplayName = false;
        await this.updateParticipant();
    }

    cancelJudgeDisplayName() {
        this.showChangeJudgeDisplayName = false;
    }

    private async updateParticipant() {
        const updateParticipantRequest = new UpdateParticipantDisplayNameRequest({
            fullname: this.judge.name,
            display_name: this.judge.display_name,
            representee: this.judge.representee,
            first_name: this.judge.first_name,
            last_name: this.judge.last_name
        });

        try {
            this.logger.debug(`[JudgeParticipantStatusList] - Attempting to update judge`, {
                judge: this.judge.id,
                displayName: this.judge.display_name
            });
            await this.videoWebService.updateParticipantDetails(this.conference.id, this.judge.id, updateParticipantRequest);
        } catch (error) {
            this.logger.error(`[JudgeParticipantStatusList] - There was an error update judge display name ${this.judge.id}`, error);
        }
    }
}
