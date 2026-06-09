import { Component, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SharedService } from './shared/services/shared.service';
import { AppStoreService } from './shared/services/app-store.service';
import { isBlockedExternalUrl } from './shared/utils/link.util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Shelgo';

  constructor(
    private router: Router,
    private sharedservice: SharedService,
    public appStore: AppStoreService
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        if (event.url) { }
      }
    });
  }

  ngOnInit(): void {
    this.onResize(null);
    // SiteConfig is already loaded via APP_INITIALIZER in AppStoreService.loadAllAsync()
    // No extra HTTP call needed here — sharedservice.siteConfig is already populated
  }

  /** Block clicks to competitor domains (e.g. next.co.uk) site-wide */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement)?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (href && isBlockedExternalUrl(href)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event) {
      this.sharedservice.deviceWidth = event.target.innerWidth;
      this.sharedservice.deviceHeight = event.target.innerHeight;
    } else {
      this.sharedservice.deviceWidth = window.innerWidth;
      this.sharedservice.deviceHeight = window.innerHeight;
    }
  }
}