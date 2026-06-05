import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { urlConstant } from '../constant/urlConst';

const STORAGE_KEY = 'customer_data';
const TOKEN_KEY   = 'customer_token';

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {

    private _customer$ = new BehaviorSubject<any>(this.loadCustomer());
    customer$ = this._customer$.asObservable();

    get customer(): any { return this._customer$.getValue(); }
    get isLoggedIn(): boolean { return !!this.customer; }
    get token(): string { return localStorage.getItem(TOKEN_KEY) || ''; }

    constructor(private http: HttpClient) {}

    register(data: any) {
        return this.http.post<any>(urlConstant.CustomerAPI.register, data).pipe(
            tap(res => { if (res?.token) this.persist(res.customer, res.token); })
        );
    }

    login(data: any) {
        return this.http.post<any>(urlConstant.CustomerAPI.login, data).pipe(
            tap(res => { if (res?.token) this.persist(res.customer, res.token); })
        );
    }

    logout() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        this._customer$.next(null);
    }

    private persist(customer: any, token: string) {
        localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(customer)));
        localStorage.setItem(TOKEN_KEY, token);
        this._customer$.next(customer);
    }

    private loadCustomer(): any {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(atob(raw)) : null;
        } catch { return null; }
    }
}
