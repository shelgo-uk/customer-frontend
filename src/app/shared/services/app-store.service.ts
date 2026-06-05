import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environment/environment';
import { SharedService } from './shared.service';

/**
 * AppStoreService — Central data store for the UI app.
 *
 * Loads brands + categories + siteconfig ONCE on app startup (via APP_INITIALIZER).
 * Uses fetch() directly so it works before Angular's HttpClient is ready.
 */
@Injectable({ providedIn: 'root' })
export class AppStoreService {

    // ── Brands ────────────────────────────────────────────────────────────────
    private _brands$ = new BehaviorSubject<any[]>([]);
    brands$ = this._brands$.asObservable();
    get brands(): any[] { return this._brands$.getValue(); }

    // ── Categories ────────────────────────────────────────────────────────────
    private _categories$ = new BehaviorSubject<any[]>([]);
    categories$ = this._categories$.asObservable();
    get categories(): any[] { return this._categories$.getValue(); }

    // ── Category tree ─────────────────────────────────────────────────────────
    private _categoryTree$ = new BehaviorSubject<any[]>([]);
    categoryTree$ = this._categoryTree$.asObservable();
    get categoryTree(): any[] { return this._categoryTree$.getValue(); }

    // ── Loaded flags ──────────────────────────────────────────────────────────
    brandsLoaded: boolean = false;
    categoriesLoaded: boolean = false;
    siteConfigLoaded: boolean = false;

    constructor(private http: HttpClient, private sharedService: SharedService) { }

    /**
     * APP_INITIALIZER — loads config.json (local, instant), then fires API calls.
     * Uses a 2s timeout so the app never blocks more than 2s even if API is slow.
     * Data arrives via BehaviorSubject — components update reactively.
     */
    async loadAllAsync(): Promise<void> {
        const base = environment.APIUrl;

        const withTimeout = (promise: Promise<any>, ms: number, fallback: any) =>
            Promise.race([promise, new Promise(r => setTimeout(() => r(fallback), ms))]);

        try {
            const [brandsRes, categoriesRes, siteconfigRes] = await Promise.all([
                withTimeout(
                    fetch(`${base}brand/getActiveBrands`).then(r => r.json()),
                    2000, { data: [] }
                ),
                withTimeout(
                    fetch(`${base}category/getPublicCategories`).then(r => r.json()),
                    2000, { data: [] }
                ),
                withTimeout(
                    fetch(`${base}siteconfig/getSiteconfig`).then(r => r.json()),
                    2000, { data: [] }
                ),
            ]);

            // Brands
            const brandList = (brandsRes as any)?.data || [];
            this._brands$.next(brandList);
            this.brandsLoaded = true;

            // Categories
            const catList = ((categoriesRes as any)?.data || []).filter((c: any) => c.isActive);
            this._categories$.next(catList);
            this._categoryTree$.next(this.buildTree(catList, null));
            this.categoriesLoaded = true;

            // SiteConfig
            const cfg = (siteconfigRes as any)?.data?.[0] || null;
            if (cfg) {
                this.sharedService.siteConfig = cfg;
                if (cfg.siteName && typeof document !== 'undefined') {
                    document.title = String(cfg.siteName);
                }
                if (cfg.icon && typeof document !== 'undefined') {
                    this._applyFavicon(cfg.icon);
                }
            }
            this.siteConfigLoaded = true;

        } catch {
            this.brandsLoaded = true;
            this.categoriesLoaded = true;
            this.siteConfigLoaded = true;
        }
    }

    private _applyFavicon(href: string): void {
        try {
            const head = document.head || document.getElementsByTagName('head')[0];
            if (!head) return;
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                (link as HTMLLinkElement).rel = 'icon';
                head.appendChild(link);
            }
            (link as HTMLLinkElement).href = href;
        } catch {}
    }

    /**
     * Called once from AppComponent.ngOnInit() — after ConfigService has set APIUrl.
     * Loads brands + categories in parallel.
     */
    loadAll(): void {
        const base = environment.APIUrl;

        forkJoin({
            brands: this.http.get<any>(`${base}brand/getActiveBrands`).pipe(
                catchError(() => of({ data: [] }))
            ),
            categories: this.http.get<any>(`${base}category/getPublicCategories`).pipe(
                catchError(() => of({ data: [] }))
            )
        }).subscribe(({ brands, categories }) => {

            const brandList = brands?.data || [];
            this._brands$.next(brandList);
            this.brandsLoaded = true;

            const catList = (categories?.data || []).filter((c: any) => c.isActive);
            this._categories$.next(catList);
            this._categoryTree$.next(this.buildTree(catList, null));
            this.categoriesLoaded = true;
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    buildTree(flat: any[], parentId: number | null): any[] {
        return flat
            .filter(c => (c.parentId ?? null) === parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map(c => ({ ...c, children: this.buildTree(flat, c.id) }));
    }

    getCategoryById(id: number): any {
        return this.categories.find(c => c.id === id) || null;
    }

    getBrandById(id: number): any {
        return this.brands.find(b => b.id === id) || null;
    }

    get rootCategories(): any[] {
        return this.categories.filter(c => !c.parentId);
    }

    getChildren(parentId: number): any[] {
        return this.categories.filter(c => c.parentId === parentId);
    }

    get activeBrands(): any[] {
        return this.brands.filter(b => b.isActive);
    }
}
