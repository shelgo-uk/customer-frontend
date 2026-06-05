import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../shared/services/cart.service';
import { CustomerAuthService } from '../../shared/services/customer-auth.service';
import { SharedService } from '../../shared/services/shared.service';
import { urlConstant } from '../../shared/constant/urlConst';

declare var Razorpay: any;

@Component({
    selector: 'app-checkout',
    standalone: false,
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {

    step: number = 1; // 1 = Delivery, 2 = Payment

    items: CartItem[] = [];
    private sub!: Subscription;

    deliveryCharge: number = 20;

    // Addresses
    addresses: any[] = [];
    selectedAddress: any = null;
    addrLoading: boolean = false;

    // Delivery date
    deliveryDates: { label: string; date: Date; dateStr: string; unavailable?: boolean }[] = [];
    selectedDate: string = '';
    private dateOffset: number = 0; // weeks offset for next week

    get currentMonthLabel(): string {
        if (!this.deliveryDates.length) return '';
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return months[this.deliveryDates[0].date.getMonth()] + ' ' + this.deliveryDates[0].date.getFullYear();
    }

    nextWeek(): void {
        this.dateOffset += 7;
        this.buildDeliveryDates();
    }

    // Contact
    contactPhone: string = '';
    selectedTimeslot: string = 'morning'; // 'morning' | 'contact'

    // Order accordion
    orderAccordionOpen: boolean = false;
    parcelAccordionOpen: boolean = false;

    // Payment
    razorpayKeyId: string = '';
    isPaymentActive: boolean = false;
    isProcessing: boolean = false;
    selectedPayment: string = 'razorpay';

    get siteName(): string {
        return this.sharedService.siteConfig?.siteName || 'Store';
    }

    constructor(
        public cartService: CartService,
        public authService: CustomerAuthService,
        public sharedService: SharedService,
        private http: HttpClient,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (!this.authService.isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }
        this.sub = this.cartService.items$.subscribe(items => { this.items = items; });
        if (this.cartService.items.length === 0) {
            this.router.navigate(['/cart']);
            return;
        }
        this.buildDeliveryDates();
        this.loadAddresses();
        this.loadRazorpayKey();
        this.contactPhone = this.authService.customer?.mobile || '';
    }

    ngOnDestroy(): void { this.sub?.unsubscribe(); }

    get currency(): string { return this.sharedService.siteConfig?.currency || '£'; }
    get subtotal(): number { return this.cartService.getTotal(); }
    get total(): number { return this.subtotal + this.deliveryCharge; }
    get itemCount(): number { return this.cartService.getCount(); }

    private get authHeaders(): HttpHeaders {
        return new HttpHeaders({ Authorization: `Bearer ${this.authService.token}` });
    }

    buildDeliveryDates(): void {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        this.deliveryDates = [];
        const startOffset = 2 + this.dateOffset;
        for (let i = startOffset; i < startOffset + 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const label = days[d.getDay()];
            const dateStr = d.toISOString().split('T')[0];
            // Mark weekends as unavailable
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            this.deliveryDates.push({ label, date: d, dateStr, unavailable: isWeekend });
        }
        // Auto-select first available
        const first = this.deliveryDates.find(d => !d.unavailable);
        if (first) this.selectedDate = first.dateStr;
    }

    loadAddresses(): void {
        this.addrLoading = true;
        this.http.get<any>(urlConstant.CustomerAddressAPI.base, { headers: this.authHeaders })
            .subscribe(
                res => {
                    this.addresses = res.data || [];
                    this.selectedAddress = this.addresses.find(a => a.isDefault) || this.addresses[0] || null;
                    this.addrLoading = false;
                },
                () => { this.addrLoading = false; }
            );
    }

    loadRazorpayKey(): void {
        this.http.get<any>(urlConstant.PaymentSettingsAPI.getPublic).subscribe(
            res => {
                this.razorpayKeyId = res.keyId || '';
                this.isPaymentActive = !!res.isActive;
            },
            () => {}
        );
    }

    selectDate(dateStr: string): void { this.selectedDate = dateStr; }

    continueToPayment(): void {
        if (!this.contactPhone.trim()) return;
        this.step = 2;
        window.scrollTo(0, 0);
    }

    goBackToDelivery(): void { this.step = 1; }

    loadRazorpayScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof Razorpay !== 'undefined') { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Razorpay script failed to load'));
            document.body.appendChild(script);
        });
    }

    async payNow(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
            await this.loadRazorpayScript();
            const amountPaise = Math.round(this.total * 100);
            const customer = this.authService.customer;
            const options = {
                key: this.razorpayKeyId,
                amount: amountPaise,
                currency: 'GBP',
                name: this.sharedService.siteConfig?.siteName || 'Store',
                description: `Order of ${this.itemCount} item(s)`,
                prefill: {
                    name: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
                    email: customer?.email || '',
                    contact: this.contactPhone
                },
                theme: { color: '#1c1c1c' },
                handler: (response: any) => {
                    this.onPaymentSuccess(response);
                },
                modal: {
                    ondismiss: () => { this.isProcessing = false; }
                }
            };
            const rzp = new Razorpay(options);
            rzp.open();
        } catch (err) {
            this.isProcessing = false;
            console.error('Razorpay error:', err);
        }
    }

    onPaymentSuccess(response: any): void {
        const customer = this.authService.customer;
        const payload = {
            customerId: customer.id,
            items: this.items,
            subtotal: this.subtotal,
            deliveryCharge: this.deliveryCharge,
            total: this.total,
            deliveryAddress: this.selectedAddress,
            contactPhone: this.contactPhone,
            paymentMethod: 'razorpay',
            razorpayPaymentId: response.razorpay_payment_id || null,
            razorpayOrderId: response.razorpay_order_id || null,
            paymentId: response.razorpay_payment_id || null,
            status: 'confirmed'
        };
        this.http.post<any>(urlConstant.OrderAPI.createOrder, payload, { headers: this.authHeaders })
            .subscribe(
                res => {
                    this.cartService.clearCart();
                    this.isProcessing = false;
                    this.router.navigate(['/order-success', res.data.id]);
                },
                err => {
                    this.isProcessing = false;
                    console.error('Order creation failed:', err);
                }
            );
    }

    getOptionEntries(options: { [key: string]: string }): { key: string; value: string }[] {
        return Object.entries(options || {}).map(([key, value]) => ({ key, value }));
    }

    formatAddress(addr: any): string {
        if (!addr) return '';
        return [addr.firstName + ' ' + addr.lastName, addr.line1, addr.line2, addr.city, addr.county, addr.postcode, addr.country]
            .filter(Boolean).join(', ');
    }
}
