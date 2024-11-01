import { Component, ElementRef, ViewChild } from '@angular/core';
import { loadMicrofrontend } from 'src/app/utils/microfrontend.util';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-dummy-support',
    templateUrl: './dummy-support.component.html',
    styleUrls: ['./dummy-support.component.scss'],
    standalone: true,
})
export class DummySupportComponent {
    @ViewChild('microfrontendContainer') microfrontContainer: ElementRef | undefined;

    public loadMicrofront() {
        if(this.microfrontContainer) {
            loadMicrofrontend(environment.microfrontends['react-app'].name, this.microfrontContainer.nativeElement);
        }
    }
}