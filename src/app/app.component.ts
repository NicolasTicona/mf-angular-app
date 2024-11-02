import { Component } from '@angular/core';
import { TOPICS } from './mocks/topics.mock';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    public topics = TOPICS;
}
