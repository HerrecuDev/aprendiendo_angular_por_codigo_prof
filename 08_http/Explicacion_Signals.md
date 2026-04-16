# Guía Completa de Signals en Angular

Documento de referencia para entender y utilizar Signals en Angular de forma efectiva.

---

## 1. ¿Qué son los Signals?

Los Signals son una nueva primitiva reactiva introducida en Angular 16 (stable en Angular 17+) que permite manejar el estado de forma más eficiente y legible que los Observables.

### Concepto fundamental

Un Signal es un **contenedor de valor** que notifica automáticamente a Angular cuando su valor cambia. Esto permite una detección de cambios más precisa y eficiente.

```
┌─────────────────────────────────────┐
│           SIGNAL                    │
│  ┌─────────────────────────────┐   │
│  │         Valor               │   │
│  │         (data)              │   │
│  └─────────────────────────────┘   │
│                │                    │
│                ▼                    │
│  ┌─────────────────────────────┐   │
│  │   Suscriptores (UI)         │   │
│  │   - Templates              │   │
│  │   - Computed               │   │
│  │   - Effects                │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Comparación con anteriores

| Aspecto | Variables tradicionales | Signals |
|---------|------------------------|---------|
| Detección de cambios | Zone.js global | Granular por Signal |
| Actualización | Change Detection global | Solo componentes dependientes |
| Lectura | Directa | Con paréntesis `signal()` |
| Tipado | Básico | Completo con generics |

---

## 2. Tipos de Signals

### 2.1 Signal Básico (Writable)

Es el tipo más común y permite leer y modificar su valor.

```typescript
import { signal } from '@angular/core';

// Formas de crear
count = signal(0);
name = signal<string>('Angular');
user = signal<User | null>(null);

// Formas de leer
count()              // returns number
name()               // returns string

// Formas de asignar
count.set(10)        // asigna valor directo
count.update(n => n + 1)  // basa en valor actual

// Formas demutaciones (para objetos/arrays)
user.update(u => ({ ...u, name: 'Nuevo' }))
```

**Ejemplo completo:**
```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-contador',
  template: `
    <button (click)="increment()">+</button>
    <span>{{ count() }}</span>
    <button (click)="decrement()">-</button>
    <button (click)="reset()">Reset</button>
  `
})
export class ContadorComponent {
  count = signal(0);

  increment() {
    this.count.update(c => c + 1);
  }

  decrement() {
    this.count.update(c => c - 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

### 2.2 Computed Signals (Derivados)

Un computed signal derive automáticamente su valor desde otros signals. Son de solo lectura.

```typescript
import { signal, computed } from '@angular/core';

count = signal(5);
name = signal('Angular');

// Se actualiza automáticamente cuando count o name cambian
double = computed(() => count() * 2);
uppercase = computed(() => name().toUpperCase());
isEven = computed(() => count() % 2 === 0);
```

**Características:**
- Solo se recalcula cuando sus signals dependencias cambian
- Son de solo lectura (no tienen .set() ni .update())
- Son lazy: no se calculan hasta que se leen

**Ejemplo con objetos:**
```typescript
precio = signal(100);
cantidad = signal(3);

// Subtotal se recalcula solo cuando precio o cantidad cambian
subtotal = computed(() => precio() * cantidad());
impuesto = computed(() => subtotal() * 0.16);
total = computed(() => subtotal() + impuesto());
```

### 2.3 Effect (Efectos secundarios)

Los Effects se ejecutan cada vez que alguno de sus signals dependencias cambia. Son útiles para:

- Logging
- Sincronización con localStorage
- Actualización de título de página
- Integración con librerías externas

```typescript
import { effect } from '@angular/core';

constructor() {
  effect(() => {
    console.log('El contador ahora es:', this.count());
  });
}
```

**Opciones de configuración:**
```typescript
// Allow external (no-Signal) reads
effect(() => {
  console.log(this.count());
}, { allowSignalWrites: true });

// Injector específico
effect(() => {
  console.log('Effect con injector específico');
}, { injector: this.injector });
```

**Diferencia entre effect y computed:**

| Característica | computed | effect |
|----------------|----------|--------|
| Retorna valor | ✅ | ❌ |
| Side effects | ❌ | ✅ |
| caché | ✅ (lazy) | ❌ |
| Uso típico | Derivados | Sincronización |

---

## 3. Conversión entre Signals y Observables

### 3.1 toSignal (Observable → Signal)

Convierte un Observable en un Signal. Muy útil para eliminar suscripciones manuales.

```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

products$: Observable<Product[]> = this.http.get<Product[]>('/api/products');

// Convertir a Signal
products = toSignal(this.products$, { initialValue: [] });
```

**Opciones de configuración:**
```typescript
// Valor inicial mientras carga
products = toSignal(http.get('/api'), { initialValue: [] });

// Valor inicial con estrategia de fallback
products = toSignal(http.get('/api'), {
  initialValue: [] as Product[],
  manualTimeout: 5000  // timeout en ms
});

// Require sync signals
data = toSignal(observable$, { requireSync: true });
```

**En el template:**
```html
@for (product of products(); track product.id) {
  <li>{{ product.title }}</li>
}
```

### 3.2 toObservable (Signal → Observable)

Convierte un Signal en Observable.

```typescript
import { toObservable } from '@angular/core/rxjs-interop';

count = signal(0);

// Convertir a Observable
count$ = toObservable(this.count);

// Usar operadores RxJS
count$.pipe(
  debounceTime(300),
  distinctUntilChanged()
).subscribe(val => {
  console.log('Valor después de debounce:', val);
});
```

---

## 4. Patterns y Mejores Prácticas

### 4.1 Estado con Signals

```typescript
interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export class MyComponent {
  state = signal<LoadingState<User>>({
    data: null,
    loading: false,
    error: null
  });

  setLoading() {
    this.state.update(s => ({ ...s, loading: true }));
  }

  setData(data: User) {
    this.state.update(s => ({ ...s, data, loading: false }));
  }

  setError(error: string) {
    this.state.update(s => ({ ...s, error, loading: false }));
  }
}
```

### 4.2 Service con Signals (Store pattern)

```typescript
@Injectable({ providedIn: 'root' })
export class CartStore {
  private state = signal<CartState>({
    carts: [],
    selectedCart: null,
    loading: false
  });

  // Getters públicos (readonly)
  carts = computed(() => this.state().carts);
  loading = computed(() => this.state().loading);

  loadCarts(userId: number) {
    this.state.update(s => ({ ...s, loading: true }));
    
    this.cartService.getCartsByUserId(userId).subscribe({
      next: (carts) => this.state.update(s => ({ ...s, carts, loading: false })),
      error: (err) => this.state.update(s => ({ ...s, loading: false }))
    });
  }

  selectCart(cart: Cart) {
    this.state.update(s => ({ ...s, selectedCart: cart }));
  }
}
```

### 4.3 Signals en Formularios

```typescript
// Two-way binding con signals
name = signal('');

// En el template
<input 
  [ngModel]="name()" 
  (ngModelChange)="name.set($event)" 
/>

// O usando Binding de señal writable
<input 
  [ngModel]="name" 
  (ngModelChange)="name.set($event)" 
/>
```

### 4.4 Lista con Signals

```typescript
items = signal<string[]>([]);

addItem(item: string) {
  this.items.update(items => [...items, item]);
}

removeItem(index: number) {
  this.items.update(items => items.filter((_, i) => i !== index));
}
```

---

## 5. Ejemplos Prácticos para tu Cart

### 5.1 Listado de Carts con Signals puros

```typescript
export class CartComponent {
  private cartService = inject(CartService);
  // Signals
  userId = signal<number>(1);
  carts = signal<Cart[]>([]);
  loading = signal<boolean>(false);

  // Computed
  cartCount = computed(() => this.carts().length);

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
}
```

```html
<!-- Template -->
<h2>Carritos ({{ cartCount() }})</h2>

@if (loading()) {
  <p>Cargando...</p>
} @else {
  @for (cart of carts(); track cart.id) {
    <div>{{ cart.id }}</div>
  }
}
```

### 5.2 Listado con Async Pipe (Recomendado)

```typescript
export class CartComponent {
  private cartService = inject(CartService);
  
  // Observable con toSignal
  userId = signal(1);
  
  // Se actualiza automáticamente cuando userId cambia
  carts$ = toSignal(
    this.userId().pipe(
      switchMap(id => this.cartService.getCartsByUserId(id))
    ),
    { initialValue: [] }
  );
}
```

```html
@for (cart of carts$() | async; track cart.id) {
  <div>{{ cart.id }}</div>
}
```

### 5.3 Cargar productos del Cart

```typescript
export class CartComponent {
  selectedCartProducts = signal<Product[]>([]);
  
  loadCartProducts(cart: Cart) {
    this.loading.set(true);
    
    // Usar el service
    this.cartService.getCartProducts(cart).subscribe({
      next: (products) => {
        this.selectedCartProducts.set(products);
        this.loading.set(false);
      }
    });
  }
}
```

```html
@for (product of selectedCartProducts(); track product.id) {
  <img [src]="product.image" />
  <p>{{ product.title }}</p>
}
```

---

## 6. Errores Comunes

### 6.1 Olvidar los paréntesis

```typescript
// ❌ Error - esto retorna la función, no el valor
{{ count }}

// ✅ Correcto - esto retorna el valor
{{ count() }}
```

### 6.2 Mutar objetos directamente

```typescript
// ❌ Incorrecto - no dispara actualización
user().name = 'Nuevo';

// ✅ Correcto - crea nuevo objeto
user.update(u => ({ ...u, name: 'Nuevo' }));
```

### 6.3 Effects en servicios

```typescript
// ⚠️ Cuidado - effects en servicios pueden causar problemas
@Injectable({ providedIn: 'root' })
export class MyService {
  constructor() {
    effect(() => console.log('Effect en service')); // Puedefallar
  }
}
```

---

## 7. Resumen de API

| Método | Descripción | Ejemplo |
|--------|-------------|---------|
| `signal(val)` | Crear signal | `count = signal(0)` |
| `signal()` | Leer valor | `count()` |
| `.set(val)` | Asignar valor | `count.set(5)` |
| `.update(fn)` | Actualizar | `count.update(c => c + 1)` |
| `computed(fn)` | Signal derivado | `double = computed(() => count() * 2)` |
| `effect(fn)` | Effect colateral | `effect(() => console.log(count()))` |
| `toSignal(obs)` | Observable → Signal | `data = toSignal(http.get())` |

---

## 8. Cuándo Usar Qué

- **Signal básico**: Estado simple del componente
- **Computed**: Valores derivados de otros signals
- **Effect**: Side effects (localStorage, logging, etc)
- **toSignal + async pipe**: Datos asíncronos (recomendado)
- **Observable + subscribe**: Cuando necesitas control manual

---

*Documento creado para el proyecto 08_http del curso de Angular*
