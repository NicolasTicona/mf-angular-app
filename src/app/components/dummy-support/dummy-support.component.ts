import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { loadMicrofrontend } from 'src/app/utils/microfrontend.util';
import { environment } from 'src/environments/environment';
import { EventLogService } from 'src/app/services/event-log.service';

@Component({
    selector: 'app-dummy-support',
    templateUrl: './dummy-support.component.html',
    styleUrls: ['./dummy-support.component.scss'],
    standalone: true,
    imports: [],
})
export class DummySupportComponent {
    @ViewChild('microfrontendContainer') microfrontContainer: ElementRef | undefined;

    alreadyLoaded = false;

    constructor(private zone: NgZone, private eventLog: EventLogService) {}

    public loadMicrofront() {
        if (this.alreadyLoaded) return;
        if (!this.microfrontContainer) return;

        this.eventLog.clear();
        this.eventLog.push('⏳ Fetching manifest from React app...');

        window.addEventListener('MICROFRONTEND_LOADED', (event: Event) => {
            const ce = event as CustomEvent;
            if (ce.detail.name === 'react-app') {
                this.zone.run(() => {
                    this.eventLog.push('✅ Manifest fetched — scripts injected');
                    this.eventLog.push('📥 MICROFRONTEND_LOADED received');
                    this.eventLog.push('🚀 Dispatching MICROFRONTEND_RENDER...');
                });
            }
        }, { once: true });

        window.addEventListener('MICROFRONTEND_RENDER', () => {
            this.zone.run(() => {
                this.eventLog.push('✅ React MFE mounted');
            });
        }, { once: true });

        window.addEventListener('SUPPORT_MESSAGE_SENT', (event: Event) => {
            const ce = event as CustomEvent;
            this.zone.run(() => {
                this.eventLog.push(`💬 User → Angular: "${ce.detail.message}"`);
            });
        });

        window.addEventListener('CARD_SELECTED', (event: Event) => {
            const ce = event as CustomEvent;
            this.zone.run(() => {
                this.eventLog.push(`📌 Angular → React: "${ce.detail.title}"`);
            });
        });

        loadMicrofrontend(
            environment.microfrontends['react-app'].name,
            this.microfrontContainer.nativeElement
        );

        this.alreadyLoaded = true;
    }
}
