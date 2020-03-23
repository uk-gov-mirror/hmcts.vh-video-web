import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UserProfileResponse, UserRole } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { BackNavigationStubComponent } from 'src/app/testing/stubs/back-navigation-stub';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone.component';

describe('SwitchOnCameraMicrophoneComponent', () => {
    let component: SwitchOnCameraMicrophoneComponent;
    let fixture: ComponentFixture<SwitchOnCameraMicrophoneComponent>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let router: Router;
    let videoWebService: VideoWebService;
    let userMediaStreamService: UserMediaStreamService;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const judgerProfile = new UserProfileResponse({ role: UserRole.Judge });
    const individualProfile = new UserProfileResponse({ role: UserRole.Individual });

    configureTestSuite(() => {
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileServiceSpy.getUserProfile.and.returnValue(judgerProfile);
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [SwitchOnCameraMicrophoneComponent, ContactUsFoldingStubComponent, BackNavigationStubComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: AdalService, useClass: MockAdalService },
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: Logger, useClass: MockLogger },
                { provide: ProfileService, useValue: profileServiceSpy }
            ]
        });
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(SwitchOnCameraMicrophoneComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        videoWebService = TestBed.get(VideoWebService);
        userMediaStreamService = TestBed.get(UserMediaStreamService);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should go to judge self test when profile is judge', async () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.isJudge = true;
        component.goVideoTest();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeSelfTestVideo, component.conference.id]);
    });

    it('should go to participant self test when profile is not a judge', async () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        profileServiceSpy.getUserProfile.and.returnValue(individualProfile);
        component.isJudge = false;
        component.goVideoTest();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.ParticipantSelfTestVideo, component.conference.id]);
    });

    it('should raise permission denied event on media access rejection', async () => {
        spyOn(videoWebService, 'raiseMediaEvent').and.callFake(() => Promise.resolve());
        spyOn(userMediaStreamService, 'requestAccess').and.callFake(() => Promise.resolve(false));

        await component.requestMedia();
        expect(component.mediaAccepted).toBeFalsy();
        expect(videoWebService.raiseMediaEvent).toHaveBeenCalled();
    });
});
