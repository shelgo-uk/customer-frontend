import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

/** Redirects logged-in customers away from login/register pages */
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
    constructor(private auth: CustomerAuthService, private router: Router) {}

    canActivate(): boolean {
        if (this.auth.isLoggedIn) {
            this.router.navigate(['/account-dashboard']);
            return false;
        }
        return true;
    }
}

/** Redirects guests away from protected pages */
@Injectable({ providedIn: 'root' })
export class CustomerAuthGuard implements CanActivate {
    constructor(private auth: CustomerAuthService, private router: Router) {}

    canActivate(): boolean {
        if (!this.auth.isLoggedIn) {
            this.router.navigate(['/login']);
            return false;
        }
        return true;
    }
}
