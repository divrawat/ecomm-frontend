import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private getHeaders() {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  createOrder(productId: string, quantity: number, imageUrl?: string, variantDetails?: string): Observable<any> {
    return this.http.post(this.apiUrl, { productId, quantity, imageUrl, variantDetails }, { headers: this.getHeaders() });
  }

  getOrders(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  getSellerOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/seller`, { headers: this.getHeaders() });
  }

  createStripeSession(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/stripe`, { orderId }, { headers: this.getHeaders() });
  }

  verifyPayment(orderId: string, paymentId: string, provider: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/verify`, { orderId, paymentId, provider, email }, { headers: this.getHeaders() });
  }
}
