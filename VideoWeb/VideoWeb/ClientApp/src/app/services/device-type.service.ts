import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
    providedIn: 'root'
})
export class DeviceTypeService {
    constructor(private deviceDetectorService: DeviceDetectorService) {}

    isMobile(): boolean {
        return this.deviceDetectorService.isMobile();
    }

    isTablet(): boolean {
        return this.deviceDetectorService.isTablet();
    }

    isDesktop(): boolean {
        return this.deviceDetectorService.isDesktop();
    }

    isIpad(): boolean {
        return (
            this.deviceDetectorService.isTablet() &&
            this.deviceDetectorService.os.toLowerCase() === 'mac' &&
            this.deviceDetectorService.browser.toLowerCase() === 'safari'
        );
    }

    isSupportedBrowser(): boolean {
        const supportedBrowsers = ['Firefox', 'Safari', 'Chrome', 'MS-Edge', 'MS-Edge-Chromium'];
        const browser = this.deviceDetectorService.browser;
        return supportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
    }

    getBrowserName(): string {
        return this.deviceDetectorService.browser;
    }

    getBrowserVersion(): string {
        return this.deviceDetectorService.browser_version;
    }

    getOSName(): string {
        return this.deviceDetectorService.os;
    }

    getOSVersion(): string {
        return this.deviceDetectorService.os_version;
    }
}
