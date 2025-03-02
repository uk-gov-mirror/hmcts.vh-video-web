import { ElementRef } from '@angular/core';
import { Guid } from 'guid-typescript';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, LoggedParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { adminTestProfile } from 'src/app/testing/data/test-profiles';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ImHelper } from '../im-helper';
import { Hearing } from '../models/hearing';
import { ChatBaseComponent } from './chat-base.component';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';

class ChatBaseTest extends ChatBaseComponent {
    content: ElementRef<HTMLElement>;
    messagesSent: string[] = [];
    incomingMessages: InstantMessage[] = [];

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected oidcSecurityService: OidcSecurityService,
        protected imHelper: ImHelper,
        protected translateService: TranslateService
    ) {
        super(videoWebService, profileService, eventService, logger, oidcSecurityService, imHelper, translateService);
    }

    sendMessage(messageBody: string): void {
        this.messagesSent.push(messageBody);
    }

    get participantUsername(): string {
        return 'participant.unit@hmcts.net';
    }

    get participantId(): string {
        return '1111-1111';
    }

    handleIncomingOtherMessage(messsage: InstantMessage) {
        this.incomingMessages.push(messsage);
    }
}

const mockOidcSecurityService = new MockOidcSecurityService();

describe('ChatBaseComponent', () => {
    let component: ChatBaseComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let conference: ConferenceResponse;
    let hearing: Hearing;
    const adminProfile = adminTestProfile;
    let contentElement: HTMLDivElement;

    beforeAll(() => {
        mockOidcSecurityService.setUserData({
            preferred_username: adminProfile.username
        });
        mockOidcSecurityService.setAuthenticated(true);

        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceChatHistory',
            'getCurrentParticipant'
        ]);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        component = new ChatBaseTest(
            videoWebServiceSpy,
            profileServiceSpy,
            eventsService,
            new MockLogger(),
            mockOidcSecurityService as any,
            new ImHelper(),
            translateServiceSpy
        );
        contentElement = document.createElement('div');
        component.content = new ElementRef(contentElement);
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: '1111-1111',
            display_name: 'somename',
            role: Role.Judge,
            admin_username: 'admin@hmcts.net'
        });
    });

    it('should remove message from pending list', () => {
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: 'admin@hmcts.net',
            to: '1111-1111',
            message: 'test message',
            timestamp: new Date()
        });

        component.addMessageToPending(instantMessage);
        expect(component.pendingMessages.size).toBe(1);

        component.removeMessageFromPending(instantMessage);
        expect(component.pendingMessages.size).toBe(1);
        expect(component.pendingMessages.get(instantMessage.to).length).toBe(0);
        expect(component.pendingMessagesForConversation.length).toBe(0);
    });

    it('should not disable scroll to bottom', () => {
        component.disableScrollDown = true;
        component.onScroll();
        expect(component.disableScrollDown).toBeFalsy();
    });

    it('should disable scroll to bottom', () => {
        component.disableScrollDown = false;
        component.onScroll();
        expect(component.disableScrollDown).toBeTruthy();
    });

    it('should not scroll to bottom when disabled', () => {
        component.disableScrollDown = true;
        let hasScrolled = false;
        spyOnProperty(component.content.nativeElement, 'scrollTop', 'set').and.callFake(() => (hasScrolled = true));
        spyOnProperty(component.content.nativeElement, 'scrollHeight', 'get').and.returnValue(100);
        component.scrollToBottom();
        expect(hasScrolled).toBeFalsy();
    });
});
