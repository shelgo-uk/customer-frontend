import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppStoreService } from '../../shared/services/app-store.service';
import { SharedService } from '../../shared/services/shared.service';

@Component({
    selector: 'app-site-map',
    standalone: false,
    templateUrl: './site-map.component.html',
    styleUrls: ['./site-map.component.scss']
})
export class SiteMapComponent implements OnInit {

    // Category tree: root → level1 → level2
    rootCategories: any[] = [];
    brands: any[] = [];

    activeSection: string = 'categories';

    navItems = [
        { id: 'categories', label: 'Shop by Category' },
        { id: 'brands',     label: 'Shop by Brand' },
        { id: 'help',       label: 'Help & Information' },
        { id: 'legal',      label: 'Privacy & Legal' },
        { id: 'other',      label: 'Other Services' },
    ];

    helpLinks = [
        { label: 'Frequently Asked Questions', url: '/help/faq' },
        { label: 'Delivery Information',        url: '/help/delivery' },
        { label: 'Arrange A Return',            url: '/help/returns' },
        { label: 'Contact Us',                  url: '/help/contact' },
        { label: 'Store Locator',               url: '/store-locator' },
    ];

    legalLinks = [
        { label: 'Privacy Policy',        url: '/policy/privacy-policy',       routerLink: true },
        { label: 'Terms & Conditions',    url: '/policy/terms-conditions',      routerLink: true },
        { label: 'Shipping Policy',       url: '/policy/shipping-policy',       routerLink: true },
        { label: 'Return & Refund Policy',url: '/policy/return-refund-policy',  routerLink: true },
        { label: 'Cookie Policy',         url: '/policy/privacy-policy',        routerLink: true },
    ];

    otherLinks = [
        { label: 'My Account',    url: '/account' },
        { label: 'My Wishlist',   url: '/wishlist' },
        { label: 'Track My Order',url: '/account' },
        { label: 'Gift Cards',    url: '/gift-cards' },
    ];

    constructor(
        public appStore: AppStoreService,
        public sharedService: SharedService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.buildTree();
        this.appStore.categories$.subscribe(() => this.buildTree());
        this.brands = this.appStore.brands;
        this.appStore.brands$.subscribe(b => { this.brands = b; });
    }

    buildTree(): void {
        const all = this.appStore.categories;
        this.rootCategories = all
            .filter(c => !c.parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map(root => ({
                ...root,
                level1: all
                    .filter(c => c.parentId === root.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
                    .map(l1 => ({
                        ...l1,
                        level2: all
                            .filter(c => c.parentId === l1.id)
                            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
                    }))
            }));
    }

    toSlug(name: string): string {
        return name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
    }

    scrollTo(id: string): void {
        this.activeSection = id;
        const el = document.getElementById('sm-' + id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    goToCategory(cat: any): void {
        if (!cat.parentId) {
            this.router.navigate(['/category', this.toSlug(cat.name)]);
        } else {
            this.router.navigate(['/shop'], { queryParams: { categoryId: cat.id } });
        }
    }

    goToBrand(brand: any): void {
        this.router.navigate(['/shop'], { queryParams: { brandId: brand.id } });
    }

    get siteName(): string {
        return this.sharedService.siteConfig?.siteName || 'NEXT';
    }
}
