import { Component, OnInit } from '@angular/core';

const COOKIE_KEY = 'cookie_consent_accepted';

@Component({
    selector: 'app-cookie-consent',
    standalone: false,
    templateUrl: './cookie-consent.component.html',
    styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit {

    visible: boolean = false;

    ngOnInit(): void {
        // Show only if user has never interacted with the banner
        const stored = localStorage.getItem(COOKIE_KEY);
        if (!stored) {
            // Small delay so the page renders first
            setTimeout(() => { this.visible = true; }, 400);
        }
    }

    acceptAll(): void {
        localStorage.setItem(COOKIE_KEY, 'accepted');
        this.dismiss();
    }

    rejectNonEssential(): void {
        localStorage.setItem(COOKIE_KEY, 'rejected');
        this.dismiss();
    }

    manageManually(): void {
        localStorage.setItem(COOKIE_KEY, 'manual');
        this.dismiss();
    }

    private dismiss(): void {
        this.visible = false;
    }
}
