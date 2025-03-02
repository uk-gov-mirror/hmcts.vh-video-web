import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferenceGuard } from '../security/conference.guard';
import { ParticipantWaitingRoomGuard } from '../security/participant-waiting-room.guard';
import { pageUrls } from '../shared/page-url.constants';
import { JohWaitingRoomComponent } from './joh-waiting-room/joh-waiting-room.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { LoggedUserResolveService } from './services/logged-user-resolve.service';

const routes: Routes = [
    {
        path: `${pageUrls.ParticipantWaitingRoom}/:conferenceId`,
        component: ParticipantWaitingRoomComponent,
        canActivate: [ParticipantWaitingRoomGuard],
        resolve: { loggedUser: LoggedUserResolveService },
        data: { title: 'Waiting room' }
    },
    {
        path: `${pageUrls.JudgeWaitingRoom}/:conferenceId`,
        component: JudgeWaitingRoomComponent,
        canActivate: [ConferenceGuard],
        resolve: { loggedUser: LoggedUserResolveService },
        data: { title: 'Waiting room' }
    },
    {
        path: `${pageUrls.JOHWaitingRoom}/:conferenceId`,
        component: JohWaitingRoomComponent,
        resolve: { loggedUser: LoggedUserResolveService },
        data: { title: 'Waiting room' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WaitingSpaceRoutingModule {}
