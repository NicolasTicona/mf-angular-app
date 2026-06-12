import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EventLogService {
    events: string[] = [];

    push(msg: string) {
        this.events = [...this.events, msg];
    }

    clear() {
        this.events = [];
    }
}
