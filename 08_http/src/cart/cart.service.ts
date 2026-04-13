import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map} from 'rxjs';
import { Cart } from '../app/cart';

@Injectable({providedIn: 'root',})
export class CartService {

  private http = inject(HttpClient);
  private baseUrl = 'https://fakestoreapi.com/carts';

  getCarts(): Observable<Cart[]>{
    return this.http.get<Cart[]>(this.baseUrl);

  }

  getCartsByUserId(userId: number): Observable<Cart[]>{
    return this.getCarts().pipe(
      map(carts => carts.filter(c => c.userId === userId))
    );

  }

  createCart(userId: number, products: any[]): Observable<Cart>{
    return this.http.post<Cart>(this.baseUrl, {userId, products});
  }

}
