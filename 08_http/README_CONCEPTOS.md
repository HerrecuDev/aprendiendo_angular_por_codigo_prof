# Conceptos Fundamentales de Angular

Este documento explica los conceptos clave del proyecto para comprender la implementación del Carrito.

---

## 1. Signals

Los Signals son la nueva forma de manejar estado reactivo en Angular (desde Angular 16+).

### ¿Qué son?
Son "variables reactivas" que notifican a Angular cuando su valor cambia, optimizando la detección de cambios.

### Cómo usarlos

```typescript
import { signal } from '@angular/core';

// Crear un signal
const userId = signal<number>(1);

// Leer el valor (con paréntesis)
userId()  // retorna 1

// Asignar nuevo valor
userId.set(5)

// Actualizar basado en valor anterior
userId.update(val => val + 1)
```

### En el template
```html
<!-- Leer valor -->
{{ userId() }}

<!-- Two-way binding con signals (Angular 17+) -->
<input [value]="userId()" (click)="userId.set($event.target.value)" />
```

### Ventajas sobre las variables tradicionales
- Detección de cambios más eficiente
- Código más legible
- Perfecto para estado local de componentes

---

## 2. HttpClient + Observable

### HttpClient
Servicio de Angular para hacer peticiones HTTP a APIs.

```typescript
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = 'https://fakestoreapi.com/carts';

  getCarts() {
    return this.http.get<Cart[]>(this.baseUrl);
  }
}
```

### Observable
Es un "flujo de datos" que puede emitir múltiples valores a lo largo del tiempo. Es parte de la librería RxJS.

```typescript
import { Observable } from 'rxjs';

// Un Observable NO se ejecuta hasta que te suscribes
const obs$: Observable<number> = new Observable(observer => {
  observer.next(1);
  observer.next(2);
  observer.complete();
});
```

### Suscripción
```typescript
// Forma clásica
service.getCarts().subscribe({
  next: (data) => console.log(data),  // cuando llega datos
  error: (err) => console.error(err), // cuando hay error
  complete: () => console.log('terminado')
});

// Forma simplificada
service.getCarts().subscribe(data => console.log(data));
```

### Operadores (pipe)
Transforman los datos del Observable:

```typescript
import { map, filter } from 'rxjs/operators';

this.http.get<Product[]>('/api/products').pipe(
  map(products => products.filter(p => p.price > 100))
).subscribe();
```

---

## 3. Two-way Binding (ngModel)

Permite sincronizar automáticamente un input con una variable.

### Sin two-way binding (unidirectional)
```typescript
// TS
userId = 1;

// HTML - solo muestra el valor, no actualiza
<input [value]="userId">
<input (input)="userId = $event.target.value">
```

### Con two-way binding (bidirectional)
```typescript
// TS - con signal
userId = signal<number>(1);

// HTML - sincroniza en ambas direcciones
<input [(ngModel)]="userId">
```

### Requisitos
- Importar `FormsModule` en el componente
- Usar `[(ngModel)]` en el template

```typescript
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  // ...
})
export class CartComponent {}
```

### Con Signals (Angular 17+)
```html
<input [ngModel]="userId()" (ngModelChange)="userId.set($event)" />
```

---

## 4. Control Flow (@if, @for, @switch)

Nueva sintaxis introduced in Angular 17. Reemplaza las directivas estructurales `*ngIf`, `*ngFor`, `*ngSwitch`.

### @if - Condicional
```html
@if (loading) {
  <p>Cargando...</p>
} @else {
  <p>Listo!</p>
}
```

Equivalente a:
```html
<p *ngIf="loading">Cargando...</p>
<p *ngIf="!loading">Listo!</p>
```

### @for - Iteración
```html
@for (cart of carts; track cart.id) {
  <li>{{ cart.id }}</li>
} @empty {
  <p>No hay carritos</p>
}
```

Equivalente a:
```html
<li *ngFor="let cart of carts">{{ cart.id }}</li>
```

**Importante**: `track` es obligatorio y debe ser único (normalmente el `id`).

### @switch - Condicional múltiple
```html
@switch (category) {
  @case ('electronics') { <span>⌨️</span> }
  @case ('jewelery') { <span>💎</span> }
  @default { <span>🏷️</span> }
}
```

---

## 5. Inyección de Dependencias (DI)

Es un patrón de diseño que permite obtener dependencias desde "afuera" en lugar de crearlas dentro de la clase.

### Forma tradicional (constructor)
```typescript
@Component({...})
export class CartComponent {
  constructor(private cartService: CartService) {}
  
  ngOnInit() {
    this.cartService.getCarts(); // usar servicio
  }
}
```

### Forma moderna (inject)
```typescript
import { inject } from '@angular/core';

@Component({...})
export class CartComponent {
  private cartService = inject(CartService);
  
  ngOnInit() {
    this.cartService.getCarts();
  }
}
```

### ¿Por qué usar DI?
1. **Código más limpio**: menos dependencias en el constructor
2. **Testing**: puedes reemplazar servicios con mocks
3. **Lazy loading**: los servicios se cargan solo cuando se necesitan
4. **Singleton**: por defecto, una instancia para toda la app

### providedIn: 'root'
```typescript
@Injectable({ providedIn: 'root' })  // disponible en toda la app
export class CartService {}
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│                    COMPONENTE                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Imports                                            ││
│  │  - CommonModule (directivas)                        ││
│  │  - FormsModule (ngModel)                            ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Inyección de dependencias                          ││
│  │  service = inject(MyService)                        ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Estado (Signals)                                    ││
│  │  name = signal('valor')                             ││
│  │  items = signal([])                                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Lógica                                              ││
│  │  - subscribe() → datos asíncronos                  ││
│  │  - .pipe(map()) → transformar datos                ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      TEMPLATE                            │
│  @if (condition) { }                                    │
│  @for (item of items; track item.id) { }               │
│  [(ngModel)] = two-way binding                          │
└─────────────────────────────────────────────────────────┘
```

---

## Recursos Adicionales

- [Documentación oficial de Angular Signals](https://angular.io/guide/signals)
- [Angular HTTP Client](https://angular.io/guide/http)
- [Nueva sintaxis de control flow](https://angular.io/guide/control-flow)
- [RxJS Observables](https://rxjs.dev/guide/observable)

---

*Documento creado para el proyecto 08_http del curso de Angular*