import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';
import { pageUrls } from '../shared/page-url.constants';
import { IdpSelectionComponent } from './idp-selection/idp-selection.component';

export const routes: Routes = [
    { path: `${pageUrls.Login}`, component: LoginComponent },
    { path: `${pageUrls.Logout}`, component: LogoutComponent },
    { path: `${pageUrls.IdpSelection}`, component: IdpSelectionComponent },
    { path: `${pageUrls.Unauthorised}`, component: UnauthorisedComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SecurityRoutingModule {}
