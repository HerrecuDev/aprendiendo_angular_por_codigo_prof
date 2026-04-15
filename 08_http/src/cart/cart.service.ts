import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map, forkJoin} from 'rxjs';
import { Cart, CartProduct } from '../app/cart';
import { APP_SETTINGS } from '../app/app.settings';
import { Product } from '../app/product';

@Injectable({providedIn: 'root',})
export class CartService {

  private http = inject(HttpClient);
  private baseUrl = inject(APP_SETTINGS).apiUrl;

  getCart(): Observable<Cart[]>{
    return this.http.get<Cart[]>(`${this.baseUrl}/carts`);

  }

  getCartsByUserId(userId: number): Observable<Cart[]>{
    return this.getCart().pipe(
      map(carts => carts.filter(c => c.userId === userId))
    );

  }

  createCart(userId: number, products: any[]): Observable<Cart>{
    return this.http.post<Cart>(`${this.baseUrl}/carts`, {userId, products });
  }

  getCartProducts(cart: Cart):Observable<Product[]> {
    const productRequests = cart.products.map((p: CartProduct) =>
      this.http.get<Product>(`${this.baseUrl}/products/${p.productId}`)
    );

    return forkJoin((productRequests));
  }

}
