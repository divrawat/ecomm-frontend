import { Component, inject, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../services/order';
import { loadStripe } from '@stripe/stripe-js';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private toastr = inject(ToastrService);
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;
  showProfileMenu = false;
  products: any[] = [];
  loading = true;
  searchQuery = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParamMap.subscribe(params => {
        const query = params.get('q') || '';
        this.searchQuery = query;
        this.fetchProducts(query);
      });
      this.checkPaymentStatus();
    }
  }

  onSearch() {
    this.router.navigate(['/'], { queryParams: { q: this.searchQuery } });
  }

  checkPaymentStatus() {
    if (isPlatformBrowser(this.platformId)) {
      const sessionId = this.route.snapshot.queryParamMap.get('session_id');
      const orderId = localStorage.getItem('pendingOrderId');

      if (sessionId && orderId) {
        this.currentUser$.subscribe(user => {
          if (user && user.email) {
            this.orderService.verifyPayment(orderId, sessionId, 'stripe', user.email).subscribe({
              next: () => {
                this.toastr.success('Payment successful! Your order is being processed.', 'Order Placed');
                localStorage.removeItem('pendingOrderId');
              },
              error: (err) => {
                this.toastr.error('Payment verification failed.');
                console.error(err);
              }
            });
          }
        });
      }
    }
  }

  async buyNow(product: any) {
    const user = await new Promise<any>(resolve => this.currentUser$.subscribe(resolve));
    if (!user) {
      this.toastr.info('Please login to buy products');
      return;
    }

    this.toastr.info('Preparing checkout...');
    this.orderService.createOrder(product.id, 1).subscribe({
      next: (order) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('pendingOrderId', order.id);
        }
        this.orderService.createStripeSession(order.id).subscribe({
          next: async (session) => {
            if (isPlatformBrowser(this.platformId)) {
              window.location.href = session.url;
            }
          },
          error: (err) => this.toastr.error('Failed to create payment session')
        });
      },
      error: (err) => this.toastr.error('Failed to create order')
    });
  }

  fetchProducts(query?: string) {
    this.loading = true;
    this.productService.getProducts(query).subscribe({
      next: (data) => {
        this.products = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.toastr.error('Failed to load products');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.authService.logout();
    this.toastr.info('You have been logged out', 'Logged Out');
  }
}
