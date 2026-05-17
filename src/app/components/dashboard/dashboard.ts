import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';
import { AuthService } from '../../services/auth';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private orderService = inject(OrderService);
  
  private route = inject(ActivatedRoute);
  currentUser$ = this.authService.currentUser$;
  activeTab = 'overview';
  showProfileMenu = false;
  sellerProducts: any[] = [];
  buyerOrders: any[] = [];
  sellerOrders: any[] = [];
  editingProductId: string | null = null;
  ordersLoading = false;
  sellerOrdersLoading = false;
  
  product = {
    name: '',
    description: '',
    price: '',
    sku: '',
    imageUrl: '',
    category: '',
    subcategory: '',
    variants: [] as any[],
    isActive: true
  };

  categoriesMap: { [key: string]: string[] } = {
    'Electronics': ['Smartphones', 'Laptops', 'PCs', 'RAM ROM', 'TV', 'Fridges'],
    'Beauty': ['Face Washes', 'Makeup Cosmetic Products'],
    'Fashion': ['Clothes', 'T-shirts', 'Pants/Jeans', 'Shirts/Hoodies'],
    'Home Appliances': ['Fans', 'Mixer Cookers', 'Gas Stoves'],
    'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Athletic Apparel']
  };

  get availableCategories(): string[] {
    return Object.keys(this.categoriesMap);
  }

  get availableSubcategories(): string[] {
    return this.product.category ? this.categoriesMap[this.product.category] : [];
  }

  newVariant = {
    size: '',
    color: '',
    stock: 0,
    imageUrl: ''
  };

  loading = false;
  productsLoading = true;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  ngOnInit() {
    const savedTab = this.route.snapshot.queryParamMap.get('tab');
    if (savedTab) {
      this.activeTab = savedTab;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.currentUser$.subscribe(user => {
        if (user) {
          this.fetchOrders();
          if (user.role === 'seller') {
            this.fetchMyProducts();
            this.fetchSellerOrders();
          }
        }
      });
    }
  }

  fetchMyProducts() {
    this.productsLoading = true;
    this.productService.getMyProducts().subscribe({
      next: (products: any) => {
        this.zone.run(() => {
          this.sellerProducts = products;
          this.productsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.toastr.error('Failed to fetch your products', 'Error');
          console.error('Error fetching products', err);
          this.productsLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  fetchOrders() {
    this.ordersLoading = true;
    this.orderService.getOrders().subscribe({
      next: (orders: any) => {
        this.zone.run(() => {
          this.buyerOrders = orders;
          this.ordersLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.toastr.error('Failed to fetch your orders', 'Error');
          this.ordersLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  fetchSellerOrders() {
    this.sellerOrdersLoading = true;
    this.orderService.getSellerOrders().subscribe({
      next: (orders: any) => {
        this.zone.run(() => {
          this.sellerOrders = orders;
          this.sellerOrdersLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.toastr.error('Failed to fetch orders for your products', 'Error');
          this.sellerOrdersLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge'
    });
  }

  logout() {
    this.authService.logout();
    this.toastr.info('You have been logged out', 'Logged Out');
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  becomeSeller() {
    this.loading = true;
    this.authService.becomeSeller().subscribe({
      next: () => {
        this.toastr.success('You are now a seller! You can start adding products.', 'Congratulations!');
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Error becoming seller: ' + err.message, 'Error');
        this.loading = false;
      }
    });
  }

  addVariant() {
    if (this.newVariant.size && this.newVariant.color) {
      this.product.variants.push({ ...this.newVariant });
      this.newVariant = { size: '', color: '', stock: 0, imageUrl: '' };
      this.toastr.info('Variant added to product');
    }
  }

  removeVariant(index: number) {
    this.product.variants.splice(index, 1);
  }

  editProduct(product: any) {
    this.editingProductId = product.id;
    this.product = {
      name: product.name,
      description: product.description || '',
      price: product.price,
      sku: product.sku || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      variants: [...(product.variants || [])],
      isActive: product.isActive !== undefined ? product.isActive : true
    };
    this.activeTab = 'add';
  }

  onSubmit() {
    this.loading = true;
    const request = this.editingProductId 
      ? this.productService.updateProduct(this.editingProductId, this.product)
      : this.productService.createProduct(this.product);

    request.subscribe({
      next: (res: any) => {
        const action = this.editingProductId ? 'updated' : 'added';
        this.toastr.success(`Product ${action} successfully!`, 'Success');
        this.loading = false;
        this.fetchMyProducts();
        this.resetForm();
        setTimeout(() => this.activeTab = 'products', 1000);
      },
      error: (err: any) => {
        const msg = err.error?.message || err.message;
        const action = this.editingProductId ? 'updating' : 'adding';
        this.toastr.error(`Error ${action} product: ` + msg, 'Error');
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.editingProductId = null;
    this.product = {
      name: '',
      description: '',
      price: '',
      sku: '',
      imageUrl: '',
      category: '',
      subcategory: '',
      variants: [],
      isActive: true
    };
  }
}
