import { Component, OnInit, OnDestroy, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { HomeBannerService } from '../../shared/services/home-banner.service';
import { AppStoreService } from '../../shared/services/app-store.service';
import { environment } from '../../shared/environment/environment';

@Component({
    selector: 'app-home',
    standalone: false,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    allBanners: any[] = [];
    desktopBanners: any[] = [];
    mobileBanners: any[] = [];

    currentSlide: number = 0;
    isMobile: boolean = false;
    isLoaded: boolean = false;

    // Brands for marquee — local copy so template re-renders when data arrives
    marqueebrands: any[] = [];
    marqueeDuration: number = 60;

    // Brand grid rows — top 24 brands split into rows of 8
    brandRows: { label: string; brands: any[] }[] = [];
    private readonly ROW_LABELS = ['FEATURED', 'SPORTS', 'LUXURY'];
    private readonly BRANDS_PER_ROW = 8;

    // Promo banners — 3 rows: 1 col, 2 cols, 1 col
    promoBanners: any[] = [];
    promoRows: any[][] = [[], [], []];
    private readonly PROMO_COLS = [1, 2, 1]; // columns per row

    private autoPlayInterval: any;
    private readonly AUTO_PLAY_DELAY = 5000;
    private brandsSub: Subscription;

    constructor(
        private homeBannerService: HomeBannerService,
        public appStore: AppStoreService,
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        this.checkDevice();

        // Show page immediately — banner loads in background
        this.isLoaded = true;

        // Load banner async — slider appears when data arrives
        this.loadBanners();

        // Brands already in AppStoreService from APP_INITIALIZER — set immediately
        this.marqueebrands = this.appStore.brands;
        this.calcMarqueeDuration(this.marqueebrands);
        this.buildBrandRows(this.appStore.brands);

        // Subscribe for any future updates (in case store loads slightly after)
        this.brandsSub = this.appStore.brands$.subscribe(brands => {
            this.marqueebrands = brands;
            this.calcMarqueeDuration(brands);
            this.buildBrandRows(brands);
        });

        // Load promo banners in background
        this.loadPromoBanners();
    }

    ngOnDestroy(): void {
        this.stopAutoPlay();
        if (this.brandsSub) this.brandsSub.unsubscribe();
    }

    @HostListener('window:resize')
    onResize() {
        this.checkDevice();
    }

    checkDevice() {
        if (isPlatformBrowser(this.platformId)) {
            this.isMobile = window.innerWidth <= 768;
        }
    }

    get activeBanners(): any[] {
        return this.isMobile ? this.mobileBanners : this.desktopBanners;
    }

    loadBanners() {
        this.homeBannerService.getActiveBanners().subscribe(
            (res: any) => {
                if (res && res.data) {
                    this.allBanners = res.data;
                    this.desktopBanners = res.data.filter((b: any) => !b.forMobile);
                    this.mobileBanners = res.data.filter((b: any) => !!b.forMobile);
                    this.currentSlide = 0;
                    this.startAutoPlay();
                }
            },
            () => { /* silently fail — no banner shown */ }
        );
    }

    goToSlide(index: number) {
        this.currentSlide = index;
        this.resetAutoPlay();
    }

    prevSlide() {
        const total = this.activeBanners.length;
        if (total === 0) return;
        this.currentSlide = (this.currentSlide - 1 + total) % total;
        this.resetAutoPlay();
    }

    nextSlide() {
        const total = this.activeBanners.length;
        if (total === 0) return;
        this.currentSlide = (this.currentSlide + 1) % total;
        this.resetAutoPlay();
    }

    startAutoPlay() {
        if (this.activeBanners.length <= 1) return;
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.AUTO_PLAY_DELAY);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    calcMarqueeDuration(brands: any[]) {
        // 130px avg per item, 300px/s scroll speed = smooth readable pace
        const totalWidth = brands.length * 130;
        this.marqueeDuration = Math.max(20, Math.round(totalWidth / 50));
    }

    buildBrandRows(brands: any[]) {
        // Take top 24 active brands (already sorted by sortOrder from API)
        const top = brands.slice(0, this.BRANDS_PER_ROW * this.ROW_LABELS.length);
        this.brandRows = this.ROW_LABELS.map((label, i) => ({
            label,
            brands: top.slice(i * this.BRANDS_PER_ROW, (i + 1) * this.BRANDS_PER_ROW)
        })).filter(row => row.brands.length > 0);
    }

    loadPromoBanners() {
        const url = `${environment.APIUrl}promo-banners/getActive`;
        this.http.get<any>(url).subscribe(
            res => {
                this.promoBanners = res.data || [];
                this.buildPromoRows();
            },
            () => { /* silently fail */ }
        );
    }

    buildPromoRows() {
        // Build rows based on PROMO_COLS = [1, 2, 1]
        this.promoRows = this.PROMO_COLS.map((cols, rowIdx) => {
            const slots = [];
            for (let col = 0; col < cols; col++) {
                const found = this.promoBanners.find(b => b.rowIndex === rowIdx && b.colIndex === col);
                slots.push(found || null);
            }
            return slots;
        });
    }

    openPromoLink(banner: any) {
        if (banner?.redirectionUrl) {
            window.open(banner.redirectionUrl, '_blank');
        }
    }

    openRedirection(banner: any) {
        if (banner.redirectionUrl) {
            window.open(banner.redirectionUrl, '_blank');
        }
    }

    // Force autoplay on video — needed for browsers that block autoplay until interaction
    onVideoCanPlay(event: Event) {
        const video = event.target as HTMLVideoElement;
        if (video) {
            video.muted = true;
            video.play().catch(() => {
                // Autoplay blocked — silently ignore, video stays paused
            });
        }
    }
}
