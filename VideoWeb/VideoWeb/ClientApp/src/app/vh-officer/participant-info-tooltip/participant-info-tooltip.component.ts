import { Component, OnInit, Input } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-participant-info-tooltip',
    templateUrl: './participant-info-tooltip.component.html'
})
export class ParticipantInfoTooltipComponent implements OnInit {
    @Input() participant: Participant;
    constructor() {}

    ngOnInit() {}
}
