import { Component } from '@angular/core';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  currentYear = new Date().getFullYear();
  newsletterEmail: string = '';
  isSubscribed: boolean = false;

  constructor(public sharedService: SharedService) {}

  get siteName(): string {
    return this.sharedService.siteConfig?.siteName || 'Shelgo';
  }

  subscribeNewsletter() {
    const email = this.newsletterEmail.trim();
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return;
    }
    this.isSubscribed = true;
    this.newsletterEmail = '';
  }

  openSection: string | null = null;

  toggleSection(section: string) {
    this.openSection = this.openSection === section ? null : section;
  }

  isOpen(section: string): boolean {
    return this.openSection === section;
  }

  get socialLinks() {
    const c = this.sharedService.siteConfig || {};
    const items = [
      { icon: 'fa-brands fa-facebook-f',  label: 'Facebook',  url: c.facebookURL },
      { icon: 'fa-brands fa-x-twitter',   label: 'X',         url: c.twitterURL },
      { icon: 'fa-brands fa-instagram',    label: 'Instagram', url: c.instagramURL },
      { icon: 'fa-brands fa-youtube',      label: 'YouTube',   url: c.youtubeURL },
      { icon: 'fa-brands fa-linkedin-in',  label: 'LinkedIn',  url: c.linkedInURL },
    ];
    return items.filter(s => s.url && String(s.url).trim());
  }

  quickLinks = [
    { icon: 'fa-light fa-circle-user',  title: 'My Account',      sub: 'Sign-in to your account',        url: '/account' },
    { icon: 'fa-light fa-heart',        title: 'My Favourites',    sub: 'View your saved items',           url: '/wishlist' },
    { icon: 'fa-light fa-globe',        title: 'Change Country',   sub: 'Choose your shopping location',  url: '/change-country' },
    { icon: 'fa-light fa-message-dots', title: 'Start a Chat',     sub: 'For general enquiries',          url: '/help/contact' },
  ];

  columns: Array<{
    id: string;
    heading: string;
    links: Array<{ label: string; url: string; sub?: string; routerLink?: boolean; }>;
  }> = [
    {
      id: 'help',
      heading: 'Help',
      links: [
        { label: 'Frequently Asked Questions',       url: '/help/faq',    routerLink: true  },
        { label: 'Delivery Information',              url: '/help/delivery' },
        { label: 'Arrange A Return',                  url: '/help/returns' },
        { label: 'Product Recall',                    url: '/help/product-recall' },
        { label: 'Contact Us',                        url: '/help/contact',  routerLink: true  },
        { label: 'Site Map',                          url: '/site-map',    routerLink: true  },
      ]
    },
    {
      id: 'shopping',
      heading: 'Shopping With Us',
      links: [
        { label: 'Shelgo Unlimited',                  url: '/shelgo-unlimited' },
        { label: 'Shelgo Credit Options',             url: '/credit' },
        { label: 'eGift Cards',                       url: '/gift-cards/egift' },
        { label: 'Gift Cards',                        url: '/gift-cards' },
        { label: 'Shipping Policy',                   url: '/policy/shipping-policy',      routerLink: true },
        { label: 'Return & Refund Policy',            url: '/policy/return-refund-policy', routerLink: true },
        { label: 'Privacy Policy',                    url: '/policy/privacy-policy',       routerLink: true },
        { label: 'Terms & Conditions',                url: '/policy/terms-conditions',     routerLink: true },
        { label: 'Customer Reviews & Ratings Policy', url: '/reviews-policy' },
        { label: 'Manually Manage Cookies',           url: '/cookies' },
      ]
    },
    {
      id: 'departments',
      heading: 'Departments',
      links: [
        { label: 'Womens',    url: '/shop/gender-women' },
        { label: 'Mens',      url: '/shop/gender-men' },
        { label: 'Boys',      url: '/shop/gender-boys' },
        { label: 'Girls',     url: '/shop/gender-girls' },
        { label: 'Home',      url: '/shop/home' },
        { label: 'Furniture', url: '/shop/furniture' },
        { label: 'Beauty',    url: '/shop/beauty' },
        { label: 'Brands',    url: '/shop/brands' },
        { label: 'Baby',      url: '/shop/baby' },
        { label: 'Sports',    url: '/shop/sports' },
        { label: 'Gifts',     url: '/shop/gifts' },
        { label: 'Clearance', url: '/shop/clearance' },
      ]
    },
    {
      id: 'more',
      heading: 'More From Shelgo',
      links: [
        { label: 'Shelgo App',                        url: '/x/apps' },
        { label: 'The Company',                       url: '/the-company' },
        { label: 'Media & Press',                     url: '/media-press' },
        { label: 'Business 2 Business',               url: '/b2b' },
        { label: 'Shelgo Careers',                    url: '/careers' },
        { label: 'View Our Modern Slavery Statement', url: '/modern-slavery' },
        { label: 'Gender Pay Report',                 url: '/gender-pay-report' },
        { label: 'Corporate Responsibility Report',   url: '/corporate-responsibility' },
      ]
    },
  ];
}
