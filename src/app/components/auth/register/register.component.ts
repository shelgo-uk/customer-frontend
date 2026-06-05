import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../../../shared/services/customer-auth.service';
import { SharedService } from '../../../shared/services/shared.service';

@Component({
    selector: 'app-register',
    standalone: false,
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {

    model = {
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        dateOfBirth: '',
        mobile: '',
        marketingPost: false,
        marketingSms: false,
        marketingEmail: false
    };

    isSubmitting = false;
    passVisible = false;
    errorMsg = '';
    registered = false; // show success screen

    titles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof'];

    constructor(
        private authService: CustomerAuthService,
        private router: Router,
        public sharedService: SharedService
    ) {}

    get siteName(): string {
        return this.sharedService.siteConfig?.siteName || 'Us';
    }

    submit() {
        this.errorMsg = '';

        if (!this.model.firstName.trim()) { this.errorMsg = 'First Name is required'; return; }
        if (!this.model.lastName.trim())  { this.errorMsg = 'Last Name is required'; return; }
        if (!this.model.email.trim())     { this.errorMsg = 'Email is required'; return; }
        if (!this.model.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { this.errorMsg = 'Enter a valid email'; return; }
        if (!this.model.password.trim())  { this.errorMsg = 'Password is required'; return; }
        if (this.model.password.length < 6) { this.errorMsg = 'Password must be at least 6 characters'; return; }

        this.isSubmitting = true;
        this.authService.register(this.model).subscribe(
            () => {
                this.isSubmitting = false;
                this.registered = true; // show success screen
            },
            err => {
                this.isSubmitting = false;
                this.errorMsg = err.error?.error || 'Registration failed';
            }
        );
    }
}
