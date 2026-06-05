import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CustomerAuthService } from '../../shared/services/customer-auth.service';
import { SharedService } from '../../shared/services/shared.service';
import { urlConstant } from '../../shared/constant/urlConst';

@Component({
    selector: 'app-order-success',
    standalone: false,
    templateUrl: './order-success.component.html',
    styleUrls: ['./order-success.component.scss']
})
export class OrderSuccessComponent implements OnInit {

    order: any = null;
    loading: boolean = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        public authService: CustomerAuthService,
        public sharedService: SharedService
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) { this.router.navigate(['/']); return; }
        this.http.get<any>(urlConstant.OrderAPI.getById + id,
            { headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.token}` }) })
            .subscribe(
                res => { this.order = res.data; this.loading = false; },
                () => { this.loading = false; }
            );
    }

    get currency(): string { return this.sharedService.siteConfig?.currency || '£'; }
    get siteName(): string { return this.sharedService.siteConfig?.siteName || 'Store'; }

    getItems(): any[] {
        if (!this.order?.items) return [];
        try {
            return typeof this.order.items === 'string'
                ? JSON.parse(this.order.items)
                : this.order.items;
        } catch { return []; }
    }

    getAddress(): string {
        const a = this.order?.deliveryAddress;
        if (!a) return '';
        return [a.firstName + ' ' + a.lastName, a.line1, a.line2, a.city, a.county, a.postcode, a.country]
            .filter(Boolean).join(', ');
    }

    getOptionEntries(options: any): { key: string; value: string }[] {
        if (!options) return [];
        try {
            const obj = typeof options === 'string' ? JSON.parse(options) : options;
            return Object.entries(obj || {}).map(([key, value]) => ({ key, value: value as string }));
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
}
