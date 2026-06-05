import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../shared/services/product.service';
import { AppStoreService } from '../../shared/services/app-store.service';
import { SharedService } from '../../shared/services/shared.service';
import { FavouritesService } from '../../shared/services/favourites.service';

@Component({
    selector: 'app-shop',
    standalone: false,
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit, OnDestroy {

    products: any[] = [];
    totalCount = 0;
    isLoading = false;
    isInitialLoad = true;
    hasMore = true;

    readonly LIMIT = 20;
    offset = 0;

    // ── Filters ───────────────────────────────────────────────────────────────
    selectedCategoryId: number | null = null;
    selectedBrandId: number | null = null;
    selectedSort = 'newest';
    searchTxt: string = '';
    newIn = false;
    minPrice: number | null = null;
    maxPrice: number | null = null;
    tempMin: number | null = null;
    tempMax: number | null = null;

    // ── UI state ──────────────────────────────────────────────────────────────
    openDropdown: string | null = null;   // desktop dropdown
    showMobileFilter = false;             // mobile filter panel
    showMobileSort = false;               // mobile sort dropdown
    showMoreFilters = false;              // MORE/LESS row

    // ── Meta ──────────────────────────────────────────────────────────────────
    pageTitle = 'All Products';
    allCategories: any[] = [];
    allBrands: any[] = [];

    sortOptions = [
        { value: 'newest',     label: 'Most Relevant' },
        { value: 'popular',    label: 'Most Popular' },
        { value: 'price_asc',  label: 'Price: Low – High' },
        { value: 'price_desc', label: 'Price: High – Low' },
        { value: 'rating',     label: 'Top Rated' },
    ];

    private routeSub!: Subscription;

    constructor(
        private productService: ProductService,
        private route: ActivatedRoute,
        private router: Router,
        public appStore: AppStoreService,
        public sharedService: SharedService,
        public favService: FavouritesService
    ) {}

    ngOnInit(): void {
        // Load meta from store
        if (this.appStore.categories.length) this.allCategories = [...this.appStore.categories];
        if (this.appStore.brands.length)     this.allBrands     = [...this.appStore.brands];

        this.appStore.categories$.subscribe(c => { if (c.length) this.allCategories = [...c]; });
        this.appStore.brands$.subscribe(b => { if (b.length) this.allBrands = [...b]; });

        // Sync from URL
        this.routeSub = this.route.queryParams.subscribe(p => {
            this.selectedCategoryId = p['categoryId'] ? +p['categoryId'] : null;
            this.selectedBrandId    = p['brandId']    ? +p['brandId']    : null;
            this.selectedSort       = p['sort']       || 'newest';
            this.searchTxt          = p['search']     || '';
            this.newIn              = p['newIn']       === 'true';
            this.minPrice           = p['minPrice']   ? +p['minPrice']   : null;
            this.maxPrice           = p['maxPrice']   ? +p['maxPrice']   : null;
            this.tempMin = this.minPrice;
            this.tempMax = this.maxPrice;
            this.setPageTitle();
            this.resetAndLoad();
        });
    }

    ngOnDestroy(): void { this.routeSub?.unsubscribe(); }

    // ── Close dropdowns on outside click ─────────────────────────────────────
    @HostListener('document:click')
    onDocClick() {
        this.openDropdown = null;
        this.showMobileSort = false;
    }

    // ── Dropdown toggle ───────────────────────────────────────────────────────
    toggleDd(name: string, e: Event) {
        e.stopPropagation();
        this.openDropdown = this.openDropdown === name ? null : name;
    }

    stopProp(e: Event) { e.stopPropagation(); }

    // ── Apply filters → URL ───────────────────────────────────────────────────
    applyFilters() {
        const qp: any = {};
        if (this.selectedCategoryId) qp['categoryId'] = this.selectedCategoryId;
        if (this.selectedBrandId)    qp['brandId']    = this.selectedBrandId;
        if (this.selectedSort !== 'newest') qp['sort'] = this.selectedSort;
        if (this.newIn)              qp['newIn']      = 'true';
        if (this.minPrice)           qp['minPrice']   = this.minPrice;
        if (this.maxPrice)           qp['maxPrice']   = this.maxPrice;
        if (this.searchTxt)          qp['search']     = this.searchTxt;
        this.router.navigate(['/shop'], { queryParams: qp });
        this.openDropdown = null;
        this.showMobileFilter = false;
    }

    selectCategory(id: number | null) {
        this.selectedCategoryId = id;
        this.applyFilters();
    }

    selectBrand(id: number | null) {
        this.selectedBrandId = id;
        this.applyFilters();
    }

    selectSort(val: string) {
        this.selectedSort = val;
        this.showMobileSort = false;
        this.applyFilters();
    }

    toggleNewIn() {
        this.newIn = !this.newIn;
        this.applyFilters();
    }

    applyPrice() {
        this.minPrice = this.tempMin || null;
        this.maxPrice = this.tempMax || null;
        this.applyFilters();
    }

    clearPrice() {
        this.tempMin = null; this.tempMax = null;
        this.minPrice = null; this.maxPrice = null;
        this.applyFilters();
    }

    clearAllFilters() {
        this.selectedCategoryId = null;
        this.selectedBrandId = null;
        this.selectedSort = 'newest';
        this.searchTxt = '';
        this.newIn = false;
        this.minPrice = null; this.maxPrice = null;
        this.tempMin = null; this.tempMax = null;
        this.router.navigate(['/shop']);
        this.showMobileFilter = false;
    }

    // ── Mobile filter panel ───────────────────────────────────────────────────
    openMobileFilter(e: Event) { e.stopPropagation(); this.showMobileFilter = true; }
    closeMobileFilter() { this.showMobileFilter = false; }

    openMobileSort(e: Event) { e.stopPropagation(); this.showMobileSort = !this.showMobileSort; }

    // ── Helpers ───────────────────────────────────────────────────────────────
    get hasActiveFilters(): boolean {
        return !!(this.selectedCategoryId || this.selectedBrandId || this.minPrice || this.maxPrice || this.newIn);
    }

    get activeFilterCount(): number {
        let n = 0;
        if (this.selectedCategoryId) n++;
        if (this.selectedBrandId) n++;
        if (this.minPrice || this.maxPrice) n++;
        if (this.newIn) n++;
        return n;
    }

    get activeSortLabel(): string {
        return this.sortOptions.find(s => s.value === this.selectedSort)?.label || 'Sort';
    }

    getCategoryName(id: number | null): string {
        return this.allCategories.find(c => c.id === id)?.name || '';
    }

    getBrandName(id: number | null): string {
        return this.allBrands.find(b => b.id === id)?.name || '';
    }

    setPageTitle() {
        if (this.searchTxt) {
            this.pageTitle = `Search: "${this.searchTxt}"`;
        } else if (this.selectedCategoryId) {
            this.pageTitle = this.getCategoryName(this.selectedCategoryId) || 'Products';
        } else if (this.selectedBrandId) {
            this.pageTitle = this.getBrandName(this.selectedBrandId) || 'Products';
        } else {
            this.pageTitle = 'All Products';
        }
    }

    // ── Load products ─────────────────────────────────────────────────────────
    resetAndLoad() {
        this.products = [];
        this.offset = 0;
        this.hasMore = true;
        this.isInitialLoad = true;
        this.loadMore();
    }

    loadMore() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;

        const params: any = { limit: this.LIMIT, offset: this.offset, sort: this.selectedSort };
        if (this.selectedCategoryId) params.categoryId = this.selectedCategoryId;
        if (this.selectedBrandId)    params.brandId    = this.selectedBrandId;
        if (this.minPrice)           params.minPrice   = this.minPrice;
        if (this.maxPrice)           params.maxPrice   = this.maxPrice;
        if (this.searchTxt)          params.search     = this.searchTxt;

        this.productService.getProducts(params).subscribe(
            (res: any) => {
                const items = res.data || [];
                this.products = [...this.products, ...items];
                this.totalCount = res.totalCount || 0;
                this.offset += items.length;
                this.hasMore = this.products.length < this.totalCount;
                this.isLoading = false;
                this.isInitialLoad = false;
            },
            () => { this.isLoading = false; this.isInitialLoad = false; }
        );
    }

    @HostListener('window:scroll')
    onScroll() {
        // Infinite scroll disabled — using Load More button instead
    }

    get skeletonArr(): number[] { return Array(this.LIMIT).fill(0); }
    getFirstImage(images: string[]): string { return images?.[0] || ''; }

    toggleWishlist(e: Event, p: any) {
        e.preventDefault();
        e.stopPropagation();
        this.favService.toggle({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            salePrice: p.salePrice,
            images: p.images || [],
            brandName: p.brandName
        });
    }

    isFav(id: number): boolean { return this.favService.isFavourite(id); }
}
