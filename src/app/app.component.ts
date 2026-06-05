import { Component, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SharedService } from './shared/services/shared.service';
import { AppStoreService } from './shared/services/app-store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Next Ecom';

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