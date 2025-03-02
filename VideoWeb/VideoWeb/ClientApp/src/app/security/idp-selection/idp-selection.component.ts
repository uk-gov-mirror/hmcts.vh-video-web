import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { NEVER } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/api/config.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { pageUrls } from '../../shared/page-url.constants';
import { OidcConfigSetupService } from '../oidc-config-setup.service';

@Component({
    selector: 'app-idp-selection',
    templateUrl: './idp-selection.component.html'
})
export class IdpSelectionComponent implements OnInit {
    identityProviders = {
        ejud: {
            url: '/' + pageUrls.Login
        },
        vhaad: {
            url: '/' + pageUrls.Login
        }
    };

    selectedProvider: string;
    submitted = false;

    constructor(
        private oidcSecurityService: OidcSecurityService,
        private route: ActivatedRoute,
        private router: Router,
        private returnUrlService: ReturnUrlService,
        private logger: Logger,
        private configService: ConfigService,
        private oidcConfigSetupService: OidcConfigSetupService
    ) {}

    ngOnInit(): void {
        this.configService.getClientSettings().subscribe(() => {
            this.oidcSecurityService.isAuthenticated$
                .pipe(
                    catchError(err => {
                        this.logger.error('[Idp Selection] - Check Auth Error', err);
                        this.router.navigate(['/']);
                        return NEVER;
                    })
                )
                .subscribe(async loggedIn => {
                    this.logger.debug('[IdpSelectionComponent] - isLoggedIn ' + loggedIn);
                    if (loggedIn) {
                        const returnUrl = this.returnUrlService.popUrl() || '/';
                        try {
                            this.logger.debug(`[IdpSelectionComponent] - User is authenticated. Returning to ${returnUrl}`);
                            this.router.navigateByUrl(returnUrl);
                        } catch (e) {
                            this.logger.error('[IdpSelectionComponent] - Failed to log in', e);
                            this.router.navigate(['/']);
                        }
                    } else {
                        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                        this.returnUrlService.setUrl(returnUrl);

                        const routeIdp = this.route.snapshot.queryParams['idp'];
                        if (routeIdp && this.identityProviders[routeIdp]) {
                            this.logger.debug('[IdpSelectionComponent] - Redirecting to login');
                            this.redirectToLogin(routeIdp);
                        }
                    }
                });
        });
    }

    showError(): boolean {
        return this.submitted && !this.selectedProvider;
    }

    getProviders(): string[] {
        return Object.keys(this.identityProviders);
    }

    selectProvider(provider: string) {
        this.selectedProvider = provider;
    }

    onSubmit(): boolean {
        this.submitted = true;
        return this.redirectToLogin(this.selectedProvider);
    }

    redirectToLogin(provider: string): boolean {
        if (!this.identityProviders[provider]) {
            return false;
        }

        this.logger.info(`Sending to idp: ${provider}`);
        this.oidcConfigSetupService.setIdp(provider);
        this.router.navigate([this.identityProviders[provider].url]);
        return true;
    }
}
