import { Component, inject, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css']
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  product: any = null;
  selectedVariant: any = null;
  qty: number = 1;
  currentUser$ = this.authService.currentUser$;
  
  newReview = {
    rating: 0,
    comment: ''
  };
  isPostingReview: boolean = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.fetchProductDetails(id);
      }
    }
  }

  fetchProductDetails(id: string) {
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.product = data;
          if (this.product.variants && this.product.variants.length > 0) {
            this.selectedVariant = this.product.variants[0];
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.toastr.error('Failed to load product details');
          this.router.navigate(['/']);
          this.cdr.detectChanges();
        });
      }
    });
  }

  getDisplayedImage(): string | null {
    if (this.selectedVariant && this.selectedVariant.imageUrl) {
      return this.selectedVariant.imageUrl;
    }
    return this.product?.imageUrl || null;
  }

  async buyNow() {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = await new Promise<any>(resolve => this.currentUser$.subscribe(resolve));
    if (!user) {
      this.toastr.info('Please login to continue purchase');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.toastr.info('Initializing secure checkout...');
    const currentImageUrl = this.getDisplayedImage();
    const variantStr = this.selectedVariant ? `${this.selectedVariant.size || ''} / ${this.selectedVariant.color || ''}` : '';

    this.orderService.createOrder(this.product.id, this.qty, currentImageUrl || '', variantStr).subscribe({
      next: (order) => {
        localStorage.setItem('pendingOrderId', order.id);
        this.orderService.createStripeSession(order.id).subscribe({
          next: (session) => {
            window.location.href = session.url;
          },
          error: (err) => this.toastr.error('Failed to create payment session')
        });
      },
      error: (err) => this.toastr.error('Could not create order')
    });
  }

  submitReview() {
    this.isPostingReview = true;
    const payload = {
        productId: this.product.id,
        rating: this.newReview.rating,
        comment: this.newReview.comment
    };

    this.productService.createReview(payload).subscribe({
        next: (review) => {
            this.zone.run(() => {
                if (!this.product.reviews) this.product.reviews = [];
                this.product.reviews.unshift(review);
                this.newReview = { rating: 0, comment: '' };
                this.isPostingReview = false;
                this.toastr.success('Review posted! Thank you.');
                this.cdr.detectChanges();
            });
        },
        error: (err) => {
            this.zone.run(() => {
                this.isPostingReview = false;
                this.toastr.error('Failed to post review');
                this.cdr.detectChanges();
            });
        }
    });
  }
}
