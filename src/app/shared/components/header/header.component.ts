import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { AppStoreService } from '../../services/app-store.service';
import { FavouritesService } from '../../services/favourites.service';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DynSubLink  { id: number; name: string; image: string; }
export interface DynSection  { id: number; name: string; image: string; children: DynSubLink[]; }
export interface DynNavItem  { id: number; label: string; image: string; sections: DynSection[]; }

@Component({
    selector: 'app-header',
    standalone: false,
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

    searchTxt = '';
    cartCount = 0;
    cartDropOpen = false;

    // ── Mobile search offcanvas ───────────────────────────────────────────────
    mobileSearchOpen = false;
    mobileSearchTxt = '';
    private readonly SEARCH_HISTORY_KEY = 'search_history';
    private readonly MAX_HISTORY = 8;
    recentSearches: string[] = [];

    openMobileSearch() {
        this.mobileSearchOpen = true;
        this.mobileSearchTxt = '';
        this.recentSearches = this.loadSearchHistory();
        // Focus input after render
        setTimeout(() => {
            const el = document.getElementById('mob-search-input') as HTMLInputElement;
            if (el) el.focus();
        }, 80);
    }

    closeMobileSearch() {
        this.mobileSearchOpen = false;
        this.mobileSearchTxt = '';
    }

    onMobileSearch() {
        const q = this.mobileSearchTxt.trim();
        if (!q) return;
        this.saveSearchHistory(q);
        this.closeMobileSearch();
        this.router.navigate(['/shop'], { queryParams: { search: q } });
    }

    selectRecentSearch(q: string) {
        this.mobileSearchTxt = q;
        this.onMobileSearch();
    }

    clearRecentSearch(q: string, e: Event) {
        e.stopPropagation();
        this.recentSearches = this.recentSearches.filter(s => s !== q);
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.recentSearches));
    }

    clearAllRecentSearches() {
        this.recentSearches = [];
        localStorage.removeItem(this.SEARCH_HISTORY_KEY);
    }

    private loadSearchHistory(): string[] {
        try {
            const raw = localStorage.getItem(this.SEARCH_HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    private saveSearchHistory(q: string) {
        let history = this.loadSearchHistory();
        history = [q, ...history.filter(s => s.toLowerCase() !== q.toLowerCase())];
        history = history.slice(0, this.MAX_HISTORY);
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
        this.recentSearches = history;
    }

    dynNavItems: DynNavItem[] = [];

    activeMenuId: number | null = null;
    activeSection: DynSection | null = null;
    private menuOpen = false;
    private catSub: Subscription;

    constructor(
        public sharedService: SharedService,
        private appStore: AppStoreService,
        public favService: FavouritesService,
        public authService: CustomerAuthService,
        public cartService: CartService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Data already loaded via APP_INITIALIZER — build nav immediately
        if (this.appStore.categories.length > 0) {
            this.dynNavItems = this.buildNavItems(this.appStore.categories);
        }

        // Also subscribe for any future updates
        this.catSub = this.appStore.categories$.subscribe(cats => {
            if (cats.length > 0) {
                this.dynNavItems = this.buildNavItems(cats);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.catSub) this.catSub.unsubscribe();
    }

    buildNavItems(flat: any[]): DynNavItem[] {
        const roots = flat
            .filter(c => !c.parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

        return roots.map(root => {
            const level1 = flat
                .filter(c => c.parentId === root.id)
                .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

            const sections: DynSection[] = level1.map(sec => {
                const level2 = flat
                    .filter(c => c.parentId === sec.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

                return {
                    id: sec.id,
                    name: sec.name,
                    image: sec.image || '',
                    children: level2.map(l => ({ id: l.id, name: l.name, image: l.image || '' }))
                };
            });

            return {
                id: root.id,
                label: root.name.toUpperCase(),
                image: root.image || '',
                sections
            };
        });
    }

    get activeNavItem(): DynNavItem | null {
        return this.dynNavItems.find(n => n.id === this.activeMenuId) || null;
    }

    /** Groups sections (skipping index 0 = Clothing) into columns of ~2 groups each */
    get groupedSections(): DynSection[][] {
        const item = this.activeNavItem;
        if (!item) return [];
        // Skip first section (shown in col 1 as flat list)
        const secs = item.sections.slice(1).filter(s => s.children.length > 0);
        const cols: DynSection[][] = [];
        const perCol = 2; // 2 groups per column
        for (let i = 0; i < secs.length; i += perCol) {
            cols.push(secs.slice(i, i + perCol));
        }
        return cols;
    }

    openMenu(id: number) {
        this.menuOpen = true;
        this.activeMenuId = id;
        const item = this.dynNavItems.find(n => n.id === id);
        this.activeSection = item?.sections?.[0] || null;
    }

    keepMenu() { this.menuOpen = true; }

    closeMenu() {
        this.menuOpen = false;
        setTimeout(() => {
            if (!this.menuOpen) {
                this.activeMenuId = null;
                this.activeSection = null;
            }
        }, 80);
    }

    setSection(sec: DynSection) { this.activeSection = sec; }

    toSlug(name: string): string {
        return name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
    }

    /** Root categories → /category/:slug, sub-categories → /shop?categoryId=X */
    getCategoryUrl(id: number, isRoot: boolean): any[] {
        if (isRoot) {
            const cat = this.appStore.getCategoryById(id);
            return ['/category', this.toSlug(cat?.name || String(id))];
        }
        return ['/shop'];
    }

    getCategoryQueryParams(id: number, isRoot: boolean): any {
        if (isRoot) return {};
        return { categoryId: id };
    }

    scrollNav(dir: 'left' | 'right') {
        const el = document.getElementById('navScrollContainer') as HTMLElement;
        if (el) el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
    }

    onSearch() {
        const q = this.searchTxt.trim();
        if (q) {
            this.saveSearchHistory(q);
            this.router.navigate(['/shop'], { queryParams: { search: q } });
            this.searchTxt = '';
        }
    }

    // ── Account dropdown ─────────────────────────────────────────────────────
    accountDropOpen = false;

    toggleAccountDrop(e: Event) {
        e.stopPropagation();
        this.accountDropOpen = !this.accountDropOpen;
    }

    closeAccountDrop() { this.accountDropOpen = false; }

    signOut() {
        this.authService.logout();
        this.accountDropOpen = false;
        this.router.navigate(['/login']);
    }

    // ── Cart dropdown ─────────────────────────────────────────────────────────
    toggleCartDrop(e: Event) {
        e.stopPropagation();
        this.cartDropOpen = !this.cartDropOpen;
        if (this.cartDropOpen) this.accountDropOpen = false;
    }

    closeCartDrop() { this.cartDropOpen = false; }

    goToCart() {
        this.cartDropOpen = false;
        this.router.navigate(['/cart']);
    }

    goToCheckout() {
        this.cartDropOpen = false;
        this.router.navigate(['/checkout']);
    }

    @HostListener('document:click')
    onDocClick() {
        this.accountDropOpen = false;
        this.cartDropOpen = false;
    }
}