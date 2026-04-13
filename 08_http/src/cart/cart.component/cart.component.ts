import { Component, inject, signal } from '@angular/core';
import { Cart, CartProduct } from '../../app/cart';
import { CartService } from '../cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Product{
  id:number;
  title: string;
  price: number;
  image: string;
  category:string;
}

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

  private cartService = inject(CartService);
  private http = inject(HttpClient);

  userId = signal<number>(1);
  carts = signal<Cart[]>([]);
  loading = signal<boolean>(false);

  // Para mostrar productos seleccionados
  selectedCartProducts = signal<Product[]>([]);
  selectedCartId = signal<number | null>(null);

  onSearch() {
  this.loading.set(true);
  this.cartService.getCartsByUserId(this.userId()).subscribe({

    next: (data) => {
      this.carts.set(data);
      this.loading.set(false);
    },
    error: () => this.loading.set(false)

  });

}

createCart(){
  this.loading.set(true);
  this.cartService.createCart(this.userId(), []).subscribe({
    next: () => {
      this.onSearch();
    },
    error: () => this.loading.set(false)
  });
}


//Para cargar todos los productos del cart Seleccionado:
loadCartProducts(cart: Cart){
  this.selectedCartId.set(cart.id);
  this.loading.set(true);

  const productRequests = cart.products.map((p: CartProduct)=>
  this.http.get<Product>(`https://fakestoreapi.com/products/${p.productId}`)
  );

  //PAra ejecutar todas las peticiones en paralelo:

  Promise.all(productRequests.map(req => req.toPromise())).then((results: any) =>{
    this.selectedCartProducts.set(results.filter((r: any)=> r));
    this.loading.set(true);
  });
}

}
