import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AppStoreService } from '../../shared/services/app-store.service';
import { SharedService } from '../../shared/services/shared.service';
import { FavouritesService } from '../../shared/services/favourites.service';
import { ProductService } from '../../shared/services/product.service';
import { ReviewPoolService } from '../../shared/services/review-pool.service';
import { environment } from '../../shared/environment/environment';
import { openSafeUrl } from '../../shared/utils/link.util';

@Component({
    selector: 'app-category-page',
    standalone: false,
    templateUrl: './category-page.component.html',
    styleUrls: ['./category-page.component.scss']
})
export class CategoryPageComponent implements OnInit, OnDestroy {

    category: any = null;
    config: any = null;       // page config from DB
    isLoading = true;

    // Sub-categories (direct children of this root category)
    subCategories: any[] = [];

    // Slider state
    readonly VISIBLE = 5;   // max cards visible at once
    subcatSlide = 0;        // current slide index (0-based)

    get subcatMaxSlide(): number {
        return Math.max(0, this.subCategories.length - this.VISIBLE);
    }

    get subcatTranslate(): string {
        // Each card = 100/VISIBLE % of track width
        const pct = (100 / this.VISIBLE) * this.subcatSlide;
        return `translateX(-${pct}%)`;
    }

    get subcatCardClass(): string {
        const n = this.subCategories.length;
        if (n <= 1) return 'full-width-2'; // treat 1 as 2-col for aesthetics
        if (n === 2) return 'full-width-2';
        if (n === 3) return 'full-width-3';
        if (n === 4) return 'full-width-4';
        return ''; // 5+ → default 20%
    }

    subcatPrev() {
        if (this.subcatSlide > 0) this.subcatSlide--;
    }

    subcatNext() {
        if (this.subcatSlide < this.subcatMaxSlide) this.subcatSlide++;
    }

    // Featured products (first 8 from this category)
    featuredProducts: any[] = [];
    featuredLoading = false;

    private routeSub!: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        public appStore: AppStoreService,
        public sharedService: SharedService,
        public favService: FavouritesService,
        private productService: ProductService,
        private reviewPool: ReviewPoolService
    ) {}

    ngOnInit(): void {
        this.routeSub = this.route.params.subscribe(p => {
            const slug = p['slug'];
            this.loadPage(slug);
        });
    }

    ngOnDestroy(): void { this.routeSub?.unsubscribe(); }

    loadPage(slug: string) {
        this.isLoading = true;
        this.config = null;
        this.category = null;
        this.featuredProducts = [];
        this.subcatSlide = 0;

        // Find category from store by slug (name-based slug)
        const allCats = this.appStore.categories;
        const cat = allCats.find(c =>
            this.toSlug(c.name) === slug && !c.parentId
        );

        if (!cat) {
            // Not a root category — redirect to shop
            this.router.navigate(['/shop']);
            return;
        }

        this.category = cat;
        this.subCategories = this.appStore.getChildren(cat.id);

        // Load page config
        this.http.get<any>(`${environment.APIUrl}category-page/public/${cat.id}`).subscribe(
            res => {
                this.config = res.data?.config || {};
                this.isLoading = false;
                this.loadFeaturedProducts();
            },
            () => {
                this.config = {};
                this.isLoading = false;
                this.loadFeaturedProducts();
            }
        );
    }

    loadFeaturedProducts() {
        if (!this.category) return;
        this.featuredLoading = true;
        this.productService.getProducts({
            categoryId: this.category.id,
            limit: 8,
            offset: 0,
            sort: 'newest'
        }).subscribe(
            async (res: any) => {
                await this.reviewPool.ensureLoaded();
                this.featuredProducts = this.reviewPool.enrichProducts(res.data || []);
                this.featuredLoading = false;
            },
            () => { this.featuredLoading = false; }
        );
    }

    // Navigate to sub-category shop page
    goToSubCategory(cat: any) {
        if (this.appStore.getChildren(cat.id).length > 0) {
            // Has children — go to its own category page
            this.router.navigate(['/category', this.toSlug(cat.name)]);
        } else {
            // Leaf — go to shop filtered
            this.router.navigate(['/shop'], { queryParams: { categoryId: cat.id } });
        }
    }

    // Shop all products in this category
    shopAll() {
        this.router.navigate(['/shop'], { queryParams: { categoryId: this.category.id } });
    }

    // Navigate to sub-sub-category
    goToCategory(cat: any) {
        this.router.navigate(['/shop'], { queryParams: { categoryId: cat.id } });
    }

    toSlug(name: string): string {
        return name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
    }

    openLink(url: string) {
        if (!url) return;
        openSafeUrl(url, this.router, /^https?:\/\//i.test(url));
    }

    // Hero banner from config
    get heroBanner(): any { return this.config?.heroBanner || null; }

    // Sections array from config
    get sections(): any[] { return this.config?.sections || []; }

    // Featured section title
    get featuredTitle(): string {
        return this.config?.featuredTitle || ('NEW IN ' + (this.category?.name?.toUpperCase() || ''));
    }

    getFirstImage(images: any): string {
        if (!images) return '';
        const arr = typeof images === 'string' ? JSON.parse(images) : images;
        return arr?.[0] || '';
    }

    toggleWishlist(e: Event, p: any) {
        e.preventDefault();
        e.stopPropagation();
        this.favService.toggle({
            id: p.id, name: p.name, slug: p.slug,
            price: p.price, salePrice: p.salePrice,
            images: p.images || [], brandName: p.brandName
        });
    }

    isFav(id: number): boolean { return this.favService.isFavourite(id); }

    get skeletonArr(): number[] { return Array(8).fill(0); }
}
