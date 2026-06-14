import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PoolReview {
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
}

export interface ProductRatingMeta {
  avgRating: number;
  reviewCount: number;
}

export interface ReviewListResult {
  data: Array<PoolReview & { created_at: string; id: number }>;
  stats: {
    totalCount: number;
    avgRating: number;
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ReviewPoolService {
  private pool: PoolReview[] = [];
  private loadPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  ensureLoaded(): Promise<void> {
    if (this.pool.length) return Promise.resolve();
    if (!this.loadPromise) {
      this.loadPromise = firstValueFrom(this.http.get<PoolReview[]>('assets/review-pool.json'))
        .then(data => { this.pool = data || []; })
        .catch(() => { this.pool = []; });
    }
    return this.loadPromise;
  }

  /** Deterministic pseudo-random 0–1 from product id */
  private hash(id: number, salt = 0): number {
    const x = Math.abs(((id * 9301 + 49297 + salt * 7919) | 0) % 233280);
    return x / 233280;
  }

  /** Rating meta: use DB values when set, else seeded random (3.5–5.0, count 18–320) */
  getRatingMeta(product: { id: number; avgRating?: number; reviewCount?: number }): ProductRatingMeta {
    const dbRating = parseFloat(String(product.avgRating ?? 0)) || 0;
    const dbCount = Number(product.reviewCount ?? 0) || 0;
    if (dbRating > 0 && dbCount > 0) {
      return { avgRating: dbRating, reviewCount: dbCount };
    }
    const h1 = this.hash(product.id, 1);
    const h2 = this.hash(product.id, 2);
    const avgRating = Math.round((3.5 + h1 * 1.5) * 10) / 10;
    const reviewCount = Math.floor(18 + h2 * 302);
    return { avgRating, reviewCount };
  }

  enrichProduct<T extends { id: number; avgRating?: number; reviewCount?: number }>(product: T): T {
    const meta = this.getRatingMeta(product);
    return { ...product, avgRating: meta.avgRating, reviewCount: meta.reviewCount };
  }

  enrichProducts<T extends { id: number; avgRating?: number; reviewCount?: number }>(products: T[]): T[] {
    return products.map(p => this.enrichProduct(p));
  }

  /** Pick and sort reviews for a product from the shared pool */
  getReviews(
    productId: number,
    meta: ProductRatingMeta,
    offset = 0,
    limit = 8,
    sort: 'newest' | 'highest' | 'lowest' = 'newest'
  ): ReviewListResult {
    if (!this.pool.length) {
      return {
        data: [],
        stats: { totalCount: 0, avgRating: meta.avgRating, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 }
      };
    }

    const displayCount = Math.min(meta.reviewCount, this.pool.length);
    const indices = this.pickIndices(productId, displayCount);

    let items = indices.map((poolIdx, i) => {
      const base = this.pool[poolIdx];
      const rating = this.reviewRating(productId, poolIdx, meta.avgRating);
      const daysAgo = Math.floor(2 + this.hash(productId, poolIdx + 10) * 180);
      const created = new Date();
      created.setDate(created.getDate() - daysAgo);
      return {
        id: productId * 1000 + i,
        reviewerName: base.reviewerName,
        rating,
        title: base.title,
        body: base.body,
        created_at: created.toISOString()
      };
    });

    if (sort === 'highest') items.sort((a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at));
    else if (sort === 'lowest') items.sort((a, b) => a.rating - b.rating || b.created_at.localeCompare(a.created_at));
    else items.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const page = items.slice(offset, offset + limit);
    const stats = this.buildStats(items, meta);

    return { data: page, stats };
  }

  private pickIndices(productId: number, count: number): number[] {
    const scored = this.pool.map((_, idx) => ({ idx, score: this.hash(productId, idx + 100) }));
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, count).map(s => s.idx);
  }

  private reviewRating(productId: number, poolIdx: number, targetAvg: number): number {
    const h = this.hash(productId, poolIdx + 200);
    if (targetAvg >= 4.7) return h > 0.15 ? 5 : 4;
    if (targetAvg >= 4.3) return h > 0.35 ? 5 : 4;
    if (targetAvg >= 4.0) return h > 0.55 ? 4 : 5;
    return h > 0.25 ? 4 : 3;
  }

  private buildStats(items: Array<{ rating: number }>, meta: ProductRatingMeta) {
    const star5 = items.filter(r => r.rating === 5).length;
    const star4 = items.filter(r => r.rating === 4).length;
    const star3 = items.filter(r => r.rating === 3).length;
    const star2 = items.filter(r => r.rating === 2).length;
    const star1 = items.filter(r => r.rating === 1).length;
    const shownTotal = items.length;
    const scale = shownTotal > 0 ? meta.reviewCount / shownTotal : 1;

    return {
      totalCount: meta.reviewCount,
      avgRating: meta.avgRating,
      star5: Math.round(star5 * scale),
      star4: Math.round(star4 * scale),
      star3: Math.round(star3 * scale),
      star2: Math.max(0, Math.round(star2 * scale)),
      star1: Math.max(0, Math.round(star1 * scale))
    };
  }
}
