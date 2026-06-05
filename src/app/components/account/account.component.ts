import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerAuthService } from '../../shared/services/customer-auth.service';
import { SharedService } from '../../shared/services/shared.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { urlConstant } from '../../shared/constant/urlConst';

@Component({
    selector: 'app-account',
    standalone: false,
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

    activeSection: string = 'orders';

    // Orders tab state
    ordersTab: string = 'expected';
    whereOrderOpen: boolean = false;

    // Forms — contact/signin
    emailModel: string = '';
    passwordModel: string = '';
    passVisible: boolean = false;
    firstNameModel: string = '';
    lastNameModel: string = '';
    mobileModel: string = '';
    dobModel: string = '';
    isSaving: boolean = false;
    saveMsg: string = '';

    // ── Addresses ─────────────────────────────────────────────────────────────
    addresses: any[] = [];
    addrLoading: boolean = false;
    showAddrForm: boolean = false;
    editingAddrId: number | null = null;
    addrForm = this.emptyAddrForm();
    addrSaving: boolean = false;
    addrError: string = '';

    // ── Orders ────────────────────────────────────────────────────────────────
    orders: any[] = [];
    ordersLoading: boolean = false;
    selectedOrder: any = null;

    constructor(
        public authService: CustomerAuthService,
        public sharedService: SharedService,
        private router: Router,
        private route: ActivatedRoute,
        private http: HttpClient
    ) {}

    ngOnInit(): void {
        if (!this.authService.isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }
        const c = this.customer;
        this.emailModel     = c?.email || '';
        this.firstNameModel = c?.firstName || '';
        this.lastNameModel  = c?.lastName || '';
        this.mobileModel    = c?.mobile || '';
        this.dobModel       = c?.dateOfBirth || '';

        this.route.queryParams.subscribe(p => {
            if (p['section']) this.activeSection = p['section'];
        });

        if (this.activeSection === 'orders') {
            this.loadOrders();
        }
    }

    setSection(s: string) {
        this.activeSection = s;
        if (s === 'addresses' && this.addresses.length === 0) {
            this.loadAddresses();
        }
        if (s === 'orders' && this.orders.length === 0) {
            this.loadOrders();
        }
        // Sections that are purely static — no data loading needed:
        // 'cards', 'unlimited', 'signin', 'contact', 'billing',
        // 'returns', 'collection', 'label', '2fa', 'callback'
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    get customer(): any { return this.authService.customer; }
    get siteName(): string { return this.sharedService.siteConfig?.siteName || 'Us'; }
    get currency(): string { return this.sharedService.siteConfig?.currency || '£'; }
    get customerNumber(): string {
        return 'C' + String(this.customer?.id || 0).padStart(6, '0');
    }
    get selfserveNumber(): string {
        // Derive a selfserve number from customer id — static-style display
        const id = this.customer?.id || 0;
        return String(88000000000 + id);
    }

    getItemSize(item: any): string {
        if (!item) return '';
        if (item.selectedOptions) {
            try {
                const opts = typeof item.selectedOptions === 'string'
                    ? JSON.parse(item.selectedOptions)
                    : item.selectedOptions;
                const vals = Object.values(opts);
                return vals.join(' / ');
            } catch { return ''; }
        }
        return item.size || item.variant || '';
    }

    private get authHeaders(): HttpHeaders {
        return new HttpHeaders({ Authorization: `Bearer ${this.authService.token}` });
    }

    // ── Orders ────────────────────────────────────────────────────────────────
    loadOrders() {
        this.ordersLoading = true;
        const customerId = this.customer?.id;
        this.http.get<any>(`${urlConstant.OrderAPI.getByCustomer}${customerId}`, { headers: this.authHeaders })
            .subscribe(
                res => { this.orders = res.data || []; this.ordersLoading = false; },
                () => { this.ordersLoading = false; }
            );
    }

    viewOrder(order: any) {
        this.selectedOrder = this.selectedOrder?.id === order.id ? null : order;
    }

    getOrderItems(order: any): any[] {
        try {
            return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch { return []; }
    }

    getStatusClass(status: string): string {
        const map: any = {
            pending: 'badge-pending',
            confirmed: 'badge-confirmed',
            processing: 'badge-processing',
            shipped: 'badge-shipped',
            delivered: 'badge-delivered',
            cancelled: 'badge-cancelled'
        };
        return map[status] || 'badge-pending';
    }

    // ── Addresses ─────────────────────────────────────────────────────────────
    loadAddresses() {
        this.addrLoading = true;
        this.http.get<any>(urlConstant.CustomerAddressAPI.base, { headers: this.authHeaders })
            .subscribe(
                res => { this.addresses = res.data || []; this.addrLoading = false; },
                () => { this.addrLoading = false; }
            );
    }

    emptyAddrForm() {
        return { firstName: '', lastName: '', line1: '', line2: '', city: '', county: '', postcode: '', country: 'United Kingdom', phone: '', isDefault: false };
    }

    openAddForm() {
        this.addrForm = this.emptyAddrForm();
        this.addrForm.firstName = this.customer?.firstName || '';
        this.addrForm.lastName  = this.customer?.lastName || '';
        this.editingAddrId = null;
        this.addrError = '';
        this.showAddrForm = true;
    }

    openEditForm(addr: any) {
        this.addrForm = { ...addr };
        this.editingAddrId = addr.id;
        this.addrError = '';
        this.showAddrForm = true;
    }

    cancelAddrForm() {
        this.showAddrForm = false;
        this.editingAddrId = null;
        this.addrError = '';
    }

    saveAddress() {
        this.addrError = '';
        if (!this.addrForm.firstName.trim()) { this.addrError = 'First Name required'; return; }
        if (!this.addrForm.lastName.trim())  { this.addrError = 'Last Name required'; return; }
        if (!this.addrForm.line1.trim())     { this.addrError = 'Address Line 1 required'; return; }
        if (!this.addrForm.postcode.trim())  { this.addrError = 'Postcode required'; return; }

        this.addrSaving = true;
        const url = urlConstant.CustomerAddressAPI.base;
        const req = this.editingAddrId
            ? this.http.put(`${url}/${this.editingAddrId}`, this.addrForm, { headers: this.authHeaders })
            : this.http.post(url, this.addrForm, { headers: this.authHeaders });

        req.subscribe(
            () => {
                this.addrSaving = false;
                this.showAddrForm = false;
                this.loadAddresses();
            },
            err => {
                this.addrSaving = false;
                this.addrError = err.error?.error || 'Failed to save address';
            }
        );
    }

    setDefaultAddress(id: number) {
        this.http.put(`${urlConstant.CustomerAddressAPI.base}/${id}/default`, {}, { headers: this.authHeaders })
            .subscribe(() => this.loadAddresses());
    }

    deleteAddress(id: number) {
        if (!confirm('Remove this address?')) return;
        this.http.delete(`${urlConstant.CustomerAddressAPI.base}/${id}`, { headers: this.authHeaders })
            .subscribe(() => this.loadAddresses());
    }
}
