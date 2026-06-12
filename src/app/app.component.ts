import { Component } from '@angular/core';
import { TOPICS } from './mocks/topics.mock';
import { EventLogService } from './services/event-log.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    public topics = TOPICS;

    constructor(public eventLog: EventLogService) {}
}
