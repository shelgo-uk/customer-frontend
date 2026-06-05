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
    return this.sharedService.siteConfig?.siteName || 'Next';
  }

  subscribeNewsletter() {
    const email = this.newsletterEmail.trim();
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return;
    }
    // TODO: wire to API when newsletter endpoint is ready
    this.isSubscribed = true;
    this.newsletterEmail = '';
  }

  // Mobile accordion state
  openSection: string | null = null;

  toggleSection(section: string) {
    this.openSection = this.openSection === section ? null : section;
  }

  isOpen(section: string): boolean {
    return this.openSection === section;
  }

  socialLinks = [
    { icon: 'fa-brands fa-facebook-f',  label: 'Facebook',    url: 'https://www.facebook.com/nextofficial' },
    { icon: 'fa-brands fa-x-twitter',   label: 'X / Twitter', url: 'https://twitter.com/nextofficial' },
    { icon: 'fa-brands fa-tiktok',       label: 'TikTok',      url: 'https://www.tiktok.com/@next' },
    { icon: 'fa-brands fa-instagram',    label: 'Instagram',   url: 'https://www.instagram.com/nextofficial' },
    { icon: 'fa-brands fa-pinterest-p',  label: 'Pinterest',   url: 'https://www.pinterest.com/nextofficial' },
    { icon: 'fa-brands fa-youtube',      label: 'YouTube',     url: 'https://www.youtube.com/next' },
  ];

  quickLinks = [
    { icon: 'fa-light fa-circle-user',  title: 'My Account',      sub: 'Sign-in to your account',        url: '/account' },
    { icon: 'fa-light fa-heart',        title: 'My Favourites',    sub: 'View your saved items',           url: '/wishlist' },
    { icon: 'fa-light fa-globe',        title: 'Change Country',   sub: 'Choose your shopping location',  url: '/change-country' },
    { icon: 'fa-light fa-store',        title: 'Store Locator',    sub: 'Find your nearest store',        url: '/store-locator' },
    { icon: 'fa-light fa-message-dots', title: 'Start a Chat',     sub: 'For general enquiries',          url: '/help/chat' },
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
        { label: 'Customer Services – 0333 777 8000', url: 'tel:03337778000', sub: 'Check your service provider for charges' },
        { label: 'Contact Us',                        url: '/help/contact',  routerLink: true  },
        { label: 'Accessible Site',                   url: '/help/accessible-site' },
        { label: 'Website Accessibility Policy',      url: '/help/accessibility-policy' },
        { label: 'Accessibility In Our Stores',       url: '/help/accessibility-stores' },
        { label: 'Site Map',                          url: '/site-map',    routerLink: true  },
        { label: 'Complaints Process',                url: '/help/complaints' },
        { label: 'Furniture Spare Parts',             url: '/help/furniture-spare-parts' },
      ]
    },
    {
      id: 'shopping',
      heading: 'Shopping With Us',
      links: [
        { label: 'Next Unlimited',                    url: '/next-unlimited' },
        { label: 'Next Credit Options',               url: '/credit' },
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
      heading: 'More From Next',
      links: [
        { label: 'Next App',                          url: '/x/apps' },
        { label: 'The Company',                       url: '/the-company' },
        { label: 'Media & Press',                     url: '/media-press' },
        { label: 'Business 2 Business',               url: '/b2b' },
        { label: 'NEXT Careers',                      url: '/careers' },
        { label: 'View Our Modern Slavery Statement', url: '/modern-slavery' },
        { label: 'Gender Pay Report',                 url: '/gender-pay-report' },
        { label: 'Corporate Responsibility Report',   url: '/corporate-responsibility' },
      ]
    },
  ];
}
