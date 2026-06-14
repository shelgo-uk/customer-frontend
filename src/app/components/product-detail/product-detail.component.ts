import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../shared/services/product.service';
import { SharedService } from '../../shared/services/shared.service';
import { FavouritesService } from '../../shared/services/favourites.service';
import { CartService } from '../../shared/services/cart.service';
import { ReviewPoolService } from '../../shared/services/review-pool.service';

@Component({
    selector: 'app-product-detail',
    standalone: false,
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit, OnDestroy {

    product: any = null;
    isLoading = true;
    notFound = false;

    // Image gallery
    activeImageIdx = 0;

    prevImage() {
        const total = this.product?.images?.length || 0;
        if (total === 0) return;
        this.activeImageIdx = (this.activeImageIdx - 1 + total) % total;
    }

    nextImage() {
        const total = this.product?.images?.length || 0;
        if (total === 0) return;
        this.activeImageIdx = (this.activeImageIdx + 1) % total;
    }

    // Variants — selected options
    selectedOptions: { [variantName: string]: string } = {};

    // Related products
    relatedProducts: any[] = [];
    relatedLoading = false;

    // Reviews
    reviews: any[] = [];
    reviewStats: any = null;
    reviewsLoading = false;
    reviewOffset = 0;
    reviewLimit = 8;
    reviewSort = 'newest';
    hasMoreReviews = false;

    // Add review form
    showReviewForm = false;
    reviewForm = { reviewerName: '', rating: 5, title: '', body: '' };
    reviewSubmitting = false;

    // Recently viewed (localStorage)
    recentlyViewed: any[] = [];

    private routeSub!: Subscription;

    // Add to bag
    addQty = 1;
    addedToBag = false;

    constructor(
        private productService: ProductService,
        private route: ActivatedRoute,
        private router: Router,
        public sharedService: SharedService,
        public favService: FavouritesService,
        public cartService: CartService,
        private reviewPool: ReviewPoolService
    ) {}

    ngOnInit(): void {
        this.routeSub = this.route.params.subscribe(params => {
            this.loadProduct(params['slug']);
        });
        this.loadRecentlyViewed();
    }

    ngOnDestroy(): void { this.routeSub?.unsubscribe(); }

    loadProduct(slug: string) {
        this.isLoading = true;
        this.notFound = false;
        this.product = null;
        this.reviews = [];
        this.relatedProducts = [];
        this.activeImageIdx = 0;
        this.selectedOptions = {};
        this.activeTab = 'product';

        this.productService.getProduct(slug).subscribe(
            async (res: any) => {
                if (!res.data) { this.notFound = true; this.isLoading = false; return; }
                await this.reviewPool.ensureLoaded();
                this.product = this.reviewPool.enrichProduct(res.data);
                this.isLoading = false;

                // Default select first option of each variant
                (this.product.variants || []).forEach((v: any) => {
                    if (v.options?.length) this.selectedOptions[v.name] = v.options[0].label;
                });

                this.saveToRecentlyViewed(this.product);
                this.loadRelated();
                this.loadReviews();
            },
            () => { this.notFound = true; this.isLoading = false; }
        );
    }

    loadRelated() {
        if (!this.product?.categoryId) return;
        this.relatedLoading = true;
        this.productService.getRelated(this.product.categoryId, this.product.id, 8).subscribe(
            async (res: any) => {
                await this.reviewPool.ensureLoaded();
                this.relatedProducts = this.reviewPool.enrichProducts(res.data || []);
                this.relatedLoading = false;
            },
            () => { this.relatedLoading = false; }
        );
    }

    loadReviews(append = false) {
        if (!this.product?.id) return;
        this.reviewsLoading = true;

        this.productService.getReviews(this.product.id, this.reviewLimit, this.reviewOffset, this.reviewSort).subscribe(
            async (res: any) => {
                await this.reviewPool.ensureLoaded();
                const apiReviews = res.data || [];
                const meta = this.reviewPool.getRatingMeta(this.product);

                if (apiReviews.length > 0 && (res.stats?.totalCount || 0) > 0) {
                    this.reviews = append ? [...this.reviews, ...apiReviews] : apiReviews;
                    this.reviewStats = res.stats;
                    this.reviewOffset += apiReviews.length;
                    this.hasMoreReviews = this.reviews.length < (res.stats?.totalCount || 0);
                } else {
                    const pool = this.reviewPool.getReviews(
                        this.product.id, meta, this.reviewOffset, this.reviewLimit, this.reviewSort as any
                    );
                    this.reviews = append ? [...this.reviews, ...pool.data] : pool.data;
                    this.reviewStats = pool.stats;
                    this.reviewOffset += pool.data.length;
                    this.hasMoreReviews = this.reviews.length < meta.reviewCount;
                }

                this.reviewsLoading = false;
            },
            async () => {
                await this.reviewPool.ensureLoaded();
                const meta = this.reviewPool.getRatingMeta(this.product);
                const pool = this.reviewPool.getReviews(
                    this.product.id, meta, this.reviewOffset, this.reviewLimit, this.reviewSort as any
                );
                this.reviews = append ? [...this.reviews, ...pool.data] : pool.data;
                this.reviewStats = pool.stats;
                this.reviewOffset += pool.data.length;
                this.hasMoreReviews = this.reviews.length < meta.reviewCount;
                this.reviewsLoading = false;
            }
        );
    }

    loadMoreReviews() {
        this.loadReviews(true);
    }

    changeReviewSort(sort: string) {
        this.reviewSort = sort;
        this.reviewOffset = 0;
        this.reviews = [];
        this.loadReviews();
    }

    submitReview() {
        if (!this.reviewForm.reviewerName.trim() || !this.reviewForm.body.trim()) return;
        this.reviewSubmitting = true;
        this.productService.addReview(this.product.id, this.reviewForm).subscribe(
            () => {
                this.reviewSubmitting = false;
                this.showReviewForm = false;
                this.reviewForm = { reviewerName: '', rating: 5, title: '', body: '' };
                this.reviewOffset = 0;
                this.reviews = [];
                this.loadReviews();
            },
            () => { this.reviewSubmitting = false; }
        );
    }

    // ── Tabs ──────────────────────────────────────────────────────────────────
    activeTab: 'product' | 'more' = 'product';
    deliveryOpen = false;
    descOpen = true;

    setTab(tab: 'product' | 'more') {
        this.activeTab = tab;
        // Load related when switching to More Like This tab
        if (tab === 'more' && this.relatedProducts.length === 0 && !this.relatedLoading) {
            this.loadRelated();
        }
    }

    // ── Gallery ──────────────────────────────────────────────────────────────
    setActiveImage(i: number) { this.activeImageIdx = i; }

    // ── Favourites ────────────────────────────────────────────────────────────
    get isFav(): boolean { return this.product ? this.favService.isFavourite(this.product.id) : false; }

    toggleFav() {
        if (!this.product) return;
        this.favService.toggle({
            id: this.product.id,
            name: this.product.name,
            slug: this.product.slug,
            price: this.product.price,
            salePrice: this.product.salePrice,
            images: this.product.images || [],
            brandName: this.product.brandName
        });
    }

    // ── Add to Bag ────────────────────────────────────────────────────────────
    addToBag(): void {
        if (!this.product) return;
        this.cartService.addItem(this.product, this.addQty, { ...this.selectedOptions });
        this.addedToBag = true;
        setTimeout(() => { this.addedToBag = false; }, 2000);
    }

    get cartItemQty(): number {
        return this.cartService.getItemQty(this.product?.id);
    }

    get isInCart(): boolean {
        return this.product ? this.cartService.isInCart(this.product.id) : false;
    }

    decrementAddQty(): void { if (this.addQty > 1) this.addQty--; }
    incrementAddQty(): void { this.addQty++; }

    // Scroll a horizontal row by id
    scrollRelated(id: string, dir: 1 | -1) {
        const el = document.getElementById(id);
        if (el) el.scrollBy({ left: dir * 240, behavior: 'smooth' });
    }

    get activeImage(): string {
        return this.product?.images?.[this.activeImageIdx] || '';
    }

    // ── Recently Viewed ───────────────────────────────────────────────────────
    saveToRecentlyViewed(product: any) {
        try {
            let rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            rv = rv.filter((p: any) => p.id !== product.id);
            rv.unshift({ id: product.id, name: product.name, slug: product.slug, price: product.price, salePrice: product.salePrice, images: product.images });
            rv = rv.slice(0, 10);
            localStorage.setItem('recentlyViewed', JSON.stringify(rv));
            this.recentlyViewed = rv.filter((p: any) => p.id !== product.id);
        } catch {}
    }

    loadRecentlyViewed() {
        try {
            this.recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        } catch { this.recentlyViewed = []; }
    }

    clearRecentlyViewed() {
        localStorage.removeItem('recentlyViewed');
        this.recentlyViewed = [];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    getFirstImage(images: string[]): string { return images?.[0] || ''; }

    get starArray(): number[] { return [1,2,3,4,5]; }

    getStarPercent(star: number): number {
        const total = this.reviewStats?.totalCount || 0;
        if (!total) return 0;
        const count = this.reviewStats?.[`star${star}`] || 0;
        return Math.round((count / total) * 100);
    }

    timeAgo(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7)  return `${days} days ago`;
        if (days < 30) return `${Math.floor(days/7)} weeks ago`;
        return `${Math.floor(days/30)} months ago`;
    }

    get deliveryDateFrom(): string {
        const d = new Date();
        d.setDate(d.getDate() + 8);
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    get deliveryDateTo(): string {
        const d = new Date();
        d.setDate(d.getDate() + 10);
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    get skeletonRelated(): number[] { return Array(4).fill(0); }
}
