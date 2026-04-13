import { Component, inject, signal } from '@angular/core';
import { Cart, CartProduct } from '../../app/cart';
import { CartService } from '../cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { Product } from '../../app/product';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

  private cartService = inject(CartService);

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

 this.cartService.getCartsProducts(cart).subscribe({

  next: (products) => {
    this.selectedCartProducts.set(products);
    this.loading.set(false);
  },

  error: () => this.loading.set(false)

 });


 /*

  //Para ejecutar todas las peticiones en paralelo:


  //Si se HardCodea la URL:
  Promise.all
                (
                  productRequests.map(req => lastValueFrom (req))
                )
                .then((results) =>{
                                          this.selectedCartProducts.set(results);
                                          this.loading.set(false);
                });

                */
}

}
