import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../shared/services/shared.service';
import { urlConstant } from '../../shared/constant/urlConst';

@Component({
    selector: 'app-contact',
    standalone: false,
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss']
})
export class ContactComponent {

    form = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    };

    subjects = [
        'Order Enquiry',
        'Returns & Refunds',
        'Delivery Issue',
        'Product Question',
        'Account Help',
        'Payment Issue',
        'Complaint',
        'Other'
    ];

    isSubmitting = false;
    submitted = false;
    errorMsg = '';

    constructor(
        private http: HttpClient,
        public sharedService: SharedService
    ) {}

    get siteName(): string { return this.sharedService.siteConfig?.siteName || 'Store'; }
    get siteEmail(): string { return this.sharedService.siteConfig?.email || ''; }
    get siteMobile(): string { return this.sharedService.siteConfig?.mobile || ''; }

    submit(): void {
        this.errorMsg = '';
        if (!this.form.name.trim()) { this.errorMsg = 'Please enter your name.'; return; }
        if (!this.form.email.trim() || !this.form.email.includes('@')) { this.errorMsg = 'Please enter a valid email address.'; return; }
        if (!this.form.message.trim()) { this.errorMsg = 'Please enter your message.'; return; }

        this.isSubmitting = true;
        this.http.post<any>(urlConstant.ContactAPI.submit, this.form).subscribe(
            () => {
                this.isSubmitting = false;
                this.submitted = true;
                this.form = { name: '', email: '', phone: '', subject: '', message: '' };
            },
            err => {
                this.isSubmitting = false;
                this.errorMsg = err.error?.error || 'Something went wrong. Please try again.';
            }
        );
    }

    reset(): void {
        this.submitted = false;
        this.errorMsg = '';
    }
}
