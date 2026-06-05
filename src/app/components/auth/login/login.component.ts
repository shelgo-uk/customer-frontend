import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../../../shared/services/customer-auth.service';
import { SharedService } from '../../../shared/services/shared.service';

@Component({
    selector: 'app-login',
    standalone: false,
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {

    model = { email: '', password: '' };
    isSubmitting = false;
    passVisible = false;
    errorMsg = '';

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
        if (!this.model.email || !this.model.password) {
            this.errorMsg = 'Please enter both email and password';
            return;
        }

        this.isSubmitting = true;
        this.authService.login(this.model).subscribe(
            () => {
                this.isSubmitting = false;
                this.router.navigate(['/account-dashboard']);
            },
            err => {
                this.isSubmitting = false;
                this.errorMsg = err.error?.error || 'Login failed';
            }
        );
    }
}
