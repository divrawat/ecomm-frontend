import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getHeaders() {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post(this.apiUrl, productData, { headers: this.getHeaders() });
  }

  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, productData, { headers: this.getHeaders() });
  }

  getProducts(query?: string): Observable<any> {
    const url = query ? `${this.apiUrl}?q=${query}` : this.apiUrl;
    return this.http.get(url);
  }

  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getMyProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my/products`, { headers: this.getHeaders() });
  }

  createReview(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, payload, { headers: this.getHeaders() });
  }
}
