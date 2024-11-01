import { Component } from '@angular/core';
import { DummySupportComponent } from '../dummy-support/dummy-support.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [
        DummySupportComponent
    ]
})
export class HeaderComponent {
    title = 'Angular app';
}