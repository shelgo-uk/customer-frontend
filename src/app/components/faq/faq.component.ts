import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../shared/services/shared.service';
import { urlConstant } from '../../shared/constant/urlConst';

@Component({
    selector: 'app-faq',
    standalone: false,
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

    // View: 'home' | 'category' | 'article'
    view: 'home' | 'category' | 'article' = 'home';

    // Home view
    categories: any[] = [];
    homeLoading = true;

    // Category view
    selectedCategory: any = null;
    categoryArticles: any[] = [];
    catLoading = false;

    // Article view
    selectedArticle: any = null;
    siblingArticles: any[] = [];
    articleCategory: any = null;
    articleLoading = false;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router,
        public sharedService: SharedService
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(p => {
            if (p['articleId']) {
                this.loadArticle(p['articleId']);
            } else if (p['categoryId']) {
                this.loadCategory(p['categoryId']);
            } else {
                this.loadHome();
            }
        });
    }

    loadHome(): void {
        this.view = 'home';
        this.homeLoading = true;
        this.http.get<any>(urlConstant.FaqAPI.getCategories).subscribe(
            res => { this.categories = res.data || []; this.homeLoading = false; },
            () => { this.homeLoading = false; }
        );
    }

    loadCategory(categoryId: string): void {
        this.view = 'category';
        this.catLoading = true;
        // Find category from already-loaded list or fetch
        const cat = this.categories.find(c => c.id == categoryId);
        if (cat) this.selectedCategory = cat;
        this.http.get<any>(`${urlConstant.FaqAPI.getArticles}${categoryId}/articles`).subscribe(
            res => {
                this.categoryArticles = res.data || [];
                this.catLoading = false;
                // If category not in list yet, find from articles response
                if (!this.selectedCategory && this.categories.length === 0) {
                    this.loadHome();
                }
            },
            () => { this.catLoading = false; }
        );
    }

    loadArticle(articleId: string): void {
        this.view = 'article';
        this.articleLoading = true;
        this.http.get<any>(`${urlConstant.FaqAPI.getArticle}${articleId}`).subscribe(
            res => {
                this.selectedArticle = res.data?.article;
                this.siblingArticles = res.data?.siblings || [];
                this.articleCategory = res.data?.category;
                this.articleLoading = false;
            },
            () => { this.articleLoading = false; }
        );
    }

    goToCategory(cat: any): void {
        this.selectedCategory = cat;
        this.router.navigate(['/help/faq'], { queryParams: { categoryId: cat.id } });
    }

    goToArticle(article: any): void {
        this.router.navigate(['/help/faq'], { queryParams: { articleId: article.id } });
    }

    goHome(): void {
        this.router.navigate(['/help/faq']);
    }

    get siteName(): string {
        return this.sharedService.siteConfig?.siteName || 'Store';
    }
}
