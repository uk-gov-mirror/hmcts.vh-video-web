import { ElementRef } from '@angular/core';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Event, NavigationEnd, Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { ClientSettingsResponse, Role, UserProfileResponse } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { LocationService } from './services/location.service';
import { PageTrackerService } from './services/page-tracker.service';
import { ConnectionStatusService } from './services/connection-status.service';
import { pageUrls } from './shared/page-url.constants';
import { MockOidcSecurityService } from './testing/mocks/mock-oidc-security.service';
import { TestLanguageService } from './shared/test-language.service';
import { translateServiceSpy } from './testing/mocks/mock-translation.service';

describe('AppComponent', () => {
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let locationServiceSpy: jasmine.SpyObj<LocationService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let titleServiceSpy: jasmine.SpyObj<Title>;
    let connectionStatusServiceSpy: jasmine.SpyObj<ConnectionStatusService>;
    let pageTrackerServiceSpy: jasmine.SpyObj<PageTrackerService>;
    let testLanguageServiceSpy: jasmine.SpyObj<TestLanguageService>;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/logout',
        redirect_uri: '/home',
        video_api_url: 'http://vh-video-api/',
        event_hub_path: 'eventhub-karma-tests'
    });

    let component: AppComponent;
    let activatedRoute: ActivatedRoute;
    const eventsSubjects = new Subject<Event>();
    const dummyElement = document.createElement('div');

    beforeAll(() => {
        activatedRoute = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', [], {
            firstChild: <any>{ snapshot: { data: convertToParamMap({ title: 'test-title' }) } }
        });

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));
        oidcSecurityService = mockOidcSecurityService;
        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        locationServiceSpy = jasmine.createSpyObj<LocationService>('LocationService', ['getCurrentUrl', 'getCurrentPathName']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
            events: eventsSubjects.asObservable()
        });
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError', 'goToUnauthorised']);
        titleServiceSpy = jasmine.createSpyObj<Title>('Title', ['getTitle', 'setTitle']);
        connectionStatusServiceSpy = jasmine.createSpyObj('ConnectionStatusService', ['start']);
        pageTrackerServiceSpy = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);
        testLanguageServiceSpy = jasmine.createSpyObj('TestLanguageService', ['setupSubscriptions']);
    });

    beforeEach(() => {
        component = new AppComponent(
            routerSpy,
            deviceTypeServiceSpy,
            profileServiceSpy,
            errorServiceSpy,
            titleServiceSpy,
            activatedRoute,
            locationServiceSpy,
            connectionStatusServiceSpy,
            pageTrackerServiceSpy,
            testLanguageServiceSpy,
            translateServiceSpy,
            oidcSecurityService,
            configServiceSpy
        );

        document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(dummyElement);
        component.main = new ElementRef(dummyElement);
        component.skipLinkDiv = new ElementRef(dummyElement);
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        routerSpy.navigate.and.returnValue(Promise.resolve(true));
        routerSpy.navigateByUrl.and.returnValue(Promise.resolve(true));
        routerSpy.navigate.calls.reset();
        routerSpy.navigateByUrl.calls.reset();
        profileServiceSpy.getUserProfile.calls.reset();
    });

    afterEach(() => {
        mockOidcSecurityService.setAuthenticated(false);
    });

    it('should start connection status service if authenticated oninit', fakeAsync(() => {
        locationServiceSpy.getCurrentUrl.and.returnValue(pageUrls.AdminVenueList);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.AdminVenueList}`);
        mockOidcSecurityService.setAuthenticated(true);
        component.ngOnInit();
        flushMicrotasks();
        expect(connectionStatusServiceSpy.start).toHaveBeenCalled();
    }));

    it('should prompt user to login if not authenticated', () => {
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should navigate to unsupported browser page if browser is not compatible', () => {
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(false);
        component.checkBrowser();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(pageUrls.UnsupportedBrowser);
    });

    it('should allow user to continue on a supported browser', () => {
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        component.checkBrowser();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(0);
    });

    it('should log out of adal', () => {
        spyOn(oidcSecurityService, 'logoffAndRevokeTokens');
        component.logOut();
        expect(component.loggedIn).toBeFalsy();
        expect(oidcSecurityService.logoffAndRevokeTokens).toHaveBeenCalled();
    });

    it('should set to true when user profile is a representative', async () => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        await component.retrieveProfileRole();
        expect(component.isRepresentativeOrIndividual).toBeTruthy();
    });

    it('should set to true when user profile is an individual', async () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        await component.retrieveProfileRole();
        expect(component.isRepresentativeOrIndividual).toBeTruthy();
    });

    it('should set to false when user profile is a judge', async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        await component.retrieveProfileRole();
        expect(component.isRepresentativeOrIndividual).toBeFalsy();
    });

    it('should send user to unauthorised page when profile cannot be found', async () => {
        const error = { status: 401, isApiException: true };
        profileServiceSpy.getUserProfile.and.returnValue(Promise.reject(error));
        await component.retrieveProfileRole();
        expect(errorServiceSpy.goToUnauthorised).toHaveBeenCalled();
    });

    it('should retrieve profile when on not on logout and authenticated', async () => {
        locationServiceSpy.getCurrentUrl.and.returnValue(pageUrls.AdminVenueList);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.AdminVenueList}`);
        mockOidcSecurityService.setAuthenticated(true);
        await component.ngOnInit();
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalled();
    });

    it('should navigate to login not on logout and not authenticated', async () => {
        locationServiceSpy.getCurrentUrl.and.returnValue(pageUrls.AdminVenueList);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.AdminVenueList}`);
        mockOidcSecurityService.setAuthenticated(false);
        await component.ngOnInit();
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalledTimes(0);
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${pageUrls.IdpSelection}`], {
            queryParams: { returnUrl: pageUrls.AdminVenueList }
        });
    });

    it('should not check auth or get profile on logout', async () => {
        locationServiceSpy.getCurrentUrl.and.returnValue(pageUrls.Logout);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.Logout}`);
        mockOidcSecurityService.setAuthenticated(true);
        await component.checkAuth();
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalledTimes(0);
    });

    it('should update page title is naviation event raised', fakeAsync(() => {
        const navEvent = new NavigationEnd(1, pageUrls.Login, pageUrls.AdminVenueList);
        component.setPageTitle();
        eventsSubjects.next(navEvent);
        tick();
        flushMicrotasks();
        expect(titleServiceSpy.setTitle).toHaveBeenCalled();
    }));

    it('should clear subscriptions on destory', () => {
        const sub = jasmine.createSpyObj<Subscription>('Subscription', ['add', 'unsubscribe']);
        component.subscriptions = sub;
        component.ngOnDestroy();
        expect(component.subscriptions.unsubscribe).toHaveBeenCalled();
    });

    it('should skip to content', () => {
        spyOn(dummyElement, 'focus');
        component.skipToContent();
        expect(dummyElement.focus).toHaveBeenCalled();
    });
});
