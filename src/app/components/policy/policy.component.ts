import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { urlConstant } from '../../shared/constant/urlConst';

@Component({
    selector: 'app-policy',
    standalone: false,
    templateUrl: './policy.component.html',
    styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {

    policy: any = null;
    isLoading = true;
    openSections: Set<number> = new Set([0]); // first section open by default

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(p => {
            this.loadPolicy(p['slug']);
        });
    }

    loadPolicy(slug: string): void {
        this.isLoading = true;
        this.policy = null;
        this.openSections = new Set([0]);
        this.http.get<any>(`${urlConstant.PolicyAPI.getBySlug}${slug}`).subscribe(
            res => { this.policy = res.data; this.isLoading = false; },
            () => { this.isLoading = false; }
        );
    }

    toggle(i: number): void {
        if (this.openSections.has(i)) {
            this.openSections.delete(i);
        } else {
            this.openSections.add(i);
        }
    }

    isOpen(i: number): boolean {
        return this.openSections.has(i);
    }

    get sections(): any[] {
        return this.policy?.sections || [];
    }
}
