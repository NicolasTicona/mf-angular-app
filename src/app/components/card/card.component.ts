import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class CardComponent {
    @Input() title = 'dummy title';
    @Input() content = 'dummy content';

    onClick() {
        window.dispatchEvent(new CustomEvent('CARD_SELECTED', {
            detail: { title: this.title, content: this.content }
        }));
    }
}