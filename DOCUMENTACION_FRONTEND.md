# Documentacion del Frontend - RentaEventos

## Stack tecnologico

| Tecnologia | Version | Uso |
|------------|---------|-----|
| **Vite** | 8.x | Bundler y dev server |
| **React** | 19.x | Framework de UI |
| **React Router DOM** | 7.x | Enrutamiento SPA |
| **Bootstrap** | 5.x | Estilos base y componentes UI |
| **Axios** | 1.x | Cliente HTTP para API REST |
| **react-datepicker** | 7.x | Calendario interactivo con seleccion de rango y disponibilidad por dia |

## Arquitectura

```
frontend-proyecto-tscll/
  src/
    components/        Componentes reutilizables
    pages/             Paginas completas (cada ruta)
    services/          Configuracion de Axios
    utils/             Funciones utilitarias
    App.jsx            Router principal y estado global
    main.jsx           Punto de entrada (monta React + Bootstrap + Router)
```

## Rutas principales

| Ruta | Componente | Acceso | Descripcion |
|------|-----------|--------|-------------|
| `/` | CatalogPage | Publico | Catalogo con sidebar de categorias y filtro por fechas |
| `/producto/:slug` | ProductPage | Publico | Detalle de producto con calendario y carrito |
| `/carrito` | CartPage | Cliente | Carrito de compras y checkout |
| `/login` | LoginPage | Publico | Inicio de sesion (cliente/admin) y registro de clientes |
| `/mis-rentas` | MisRentasPage | Cliente | Historial de rentas del cliente |
| `/renta/:id` | RentaDetailPage | Cliente | Detalle de una renta especifica |
| `/perfil` | ProfilePage | Cliente | Editar datos personales y cambiar contrasena |
| `/admin` | AdminPage | Admin | Panel de administracion con pestanas |
| `/condiciones` | ConditionsPage | Publico | Terminos y condiciones |
| `/nosotros` | AboutPage | Publico | Informacion de la empresa |
| `/faq` | FAQPage | Publico | Preguntas frecuentes |

## Estado global (App.jsx)

El estado global se maneja con `useState` y `useCallback` en App.jsx y se pasa como props a los componentes hijos:

- **user**: Datos del usuario logueado (id, nombre, email, tipo: 'cliente' | 'admin')
- **carrito**: Array de items en el carrito (id, nombre, precio, cantidad, maxDisponible)
- **fechasRenta**: Objeto con fechaInicio y fechaFin seleccionadas globalmente
- **toast**: Notificacion flotante que se muestra al agregar al carrito

**Persistencia**: Todos los estados se guardan en `localStorage` y se recuperan al recargar la pagina.

### Funciones del estado global

| Funcion | Descripcion |
|---------|-------------|
| `addToCarrito(equipo, cantidad, fechaInicio, fechaFin, maxDisponible)` | Agrega un producto al carrito. Si ya existe, incrementa la cantidad. Respeta `maxDisponible` |
| `updateCantidad(id, cantidad)` | Actualiza la cantidad de un item en el carrito |
| `removeItem(id)` | Elimina un item del carrito |
| `clearCarrito()` | Vacia el carrito |
| `handleLogin(data)` | Guarda el usuario y redirige a `/` |
| `handleLogout()` | Limpia usuario y carrito, redirige a `/` |
| `showToast(message)` | Muestra una notificacion flotante por 2.5s |

## Pantallas detalladas

### Catalogo (`/`)
- **Sidebar izquierdo**: sticky, contiene:
  - Filtro de fechas (inputs date) con validacion: inicio no puede ser posterior a fin y viceversa
  - Boton "Buscar": llama a `POST /api/equipos/disponibilidad`
  - Boton "Limpiar": resetea el filtro
  - Lista de categorias: al seleccionar una filtra los productos
- **Area principal**: grilla de tarjetas de producto (3 columnas en desktop):
  - Click en la tarjeta → `/producto/:slug`
  - Muestra imagen (o emoji representativo), nombre, descripcion, precio/dia, SKU
  - Boton "Anadir": solo visible para clientes logueados
  - Si no hay fechas seleccionadas: no muestra disponibilidad
  - Si hay fechas: muestra "Disponibles: X"
- **Ordenamiento**: dropdown con opciones: Sin orden, Nombre A-Z, Nombre Z-A, Precio menor a mayor, Precio mayor a menor

### Detalle de producto (`/producto/:slug`)
- **URL con slug**: ej. `/producto/bocina-jbl-prx815`. Acepta tanto slug como ID numerico para compatibilidad.
- **Columna izquierda**:
  - Carrusel de imagenes con miniaturas seleccionables (React state, sin Bootstrap JS)
  - Calendario de disponibilidad con `react-datepicker`:
    - Muestra numero de unidades disponibles por dia
    - Carga al cambiar de mes via `GET /api/equipos/{id}/disponibilidad-diaria`
    - Seleccion de rango (inicio y fin)
    - No permite seleccionar fechas pasadas
- **Columna derecha**:
  - Nombre, descripcion, precio/dia, disponibles, selector de cantidad
  - Subtotal en tiempo real: `precio * cantidad`
  - Boton "Anadir al carrito": valida que haya fechas seleccionadas

### Carrito y checkout (`/carrito`)
- **Fechas de renta**: selector unico de inicio y fin para todo el pedido
- **Lista de equipos**: cada item con nombre, precio/dia, input de cantidad (max respetado) y boton quitar
- **Subtotal**: `precio * cantidad * dias`
- **Costos automaticos**:
  - Costo de envio: $0 si recoge en sucursal; si es envio a domicilio: $500, gratis si >20 productos
  - Deposito de garantia: 50% del total de renta (solo informativo, no se suma al total)
- **Desglose**: Renta + Envio = Total a pagar
- **Boton "Alquilar"**: deshabilitado si faltan fechas. Al hacer clic:
  1. Crea el alquiler via `POST /api/alquileres`
  2. Limpia el carrito
  3. Redirige a `/renta/{id}`

### Login y registro (`/login`)
- **Selector de tipo**: Cliente o Admin (cambia el endpoint de login)
- **Login cliente**: `POST /api/clientes/login` con email + password
- **Login admin**: `POST /api/auth/admin/login` con email + password
- **Registro**: al dar clic en "Registrate", muestra formulario con todos los campos del cliente
  - Al enviar: llama a `POST /api/clientes/registrar`, luego automaticamente hace login con los mismos datos
- El estado del usuario se persiste en `localStorage`

### Mis rentas (`/mis-rentas`)
- Carga `GET /api/alquileres/cliente/{id}` y ordena por fecha descendente (mas reciente primero)
- Paginacion: 5 items por pagina con botones Anterior/Siguiente/numeros
- Cada tarjeta es clickeable → `/renta/{id}`
- Muestra codigo, fechas, estado (con badge de color), tipo de entrega, total
- Boton "Cancelar" solo si estado Pendiente y faltan mas de 2 dias:
  - `> 2 dias`: cancelacion con 100% de reembolso
  - `1-2 dias`: cancelacion con 50% de reembolso
  - `< 1 dia`: no se permite cancelar

### Detalle de renta (`/renta/:id`)
- Carga datos del alquiler, pagos y resumen financiero concurrentemente: `Promise.all`
- **Cabecera**: codigo de reserva, estado, boton de cancelacion con logica de reembolso
- **Detalles**: fechas, tipo de entrega, direccion, notas
- **Equipos**: cada linea muestra `cantidad × precio/dia × dias = subtotal`
- **Resumen financiero**: total alquiler, total pagado, saldo pendiente
- **Pagos realizados**: lista con fecha, metodo y monto
- Cada equipo es clickeable → `/producto/{equipoId}` (usando ID numerico)

### Perfil (`/perfil`)
- Solo accesible para clientes
- Muestra datos personales en modo vista
- Boton "Editar": convierte los datos en inputs y permite guardar con `PUT /api/clientes/{id}`
- Formulario de cambio de contrasena separado

### Panel admin (`/admin`)
- **Sidebar lateral** con 4 pestanas:

| Pestana | Componente | Descripcion |
|---------|-----------|-------------|
| Resumen | AdminResumen | Tarjetas con totales (productos, unidades, categorias). Desglose por categoria. Tabla completa de productos. |
| Inventario | AdminInventario | CRUD completo de equipos: registrar, editar, eliminar. Tabla con todos los campos. |
| Pedidos | AdminPedidos | Lista de todos los alquileres con filtros por cliente y fechas. Modal con detalle completo. Botones para cambiar estado (Entregado, Devuelto, Cancelado). |
| Usuarios | AdminUsuarios | Lista de clientes. Boton "Nuevo cliente" con formulario de registro. Boton "Dar de baja" (soft-delete via API). |

## Servicios y utilidades

### api.js (`src/services/api.js`)
```javascript
const api = axios.create({ baseURL: '/api' })
```
Usa el proxy de Vite para redirigir `/api/*` a `http://localhost:8080`. No hay CORS en desarrollo.

### date.js (`src/utils/date.js`)
- `toApiDateTime(value, endOfDay)`: convierte fecha ISO a formato backend. Si `endOfDay=true` agrega `T23:59:59`
- `diasEntre(inicio, fin)`: calcula dias entre dos fechas (minimo 1)

### currency.js (`src/utils/currency.js`)
- `formatCurrency(value)`: formatea numero a moneda MXN con `Intl.NumberFormat`

## Flujo de alquiler completo

1. **Explorar catalogo** (`/`) — usuario ve productos, filtra por categoria y fecha
2. **Ver detalle** (`/producto/:slug`) — usuario ve imagenes, precio, disponibilidad por dia en calendario
3. **Seleccionar fechas** — en el calendario del producto o en el carrito
4. **Agregar al carrito** — requiere sesion de cliente. Se muestra toast de confirmacion
5. **Ir al carrito** (`/carrito`) — navbar muestra badge con conteo
6. **Confirmar datos** — fechas, tipo de entrega, metodo de pago
7. **Alquilar** — se crea el alquiler en backend, se redirige a `/renta/{id}`
8. **Ver resumen** — detalles de la renta, equipos, pagos, estado
9. **Cancelar** (si aplica) — desde `/mis-rentas` o `/renta/{id}`

## Sistema de correo

El backend envia correos automaticamente via SMTP (Gmail configurado en `.env`):

- **Registro de cliente**: plantilla Thymeleaf `registro-exitoso.html`
- **Confirmacion de alquiler**: plantilla Thymeleaf `confirmacion-alquiler.html` con:
  - Estilo visual identico a la pagina (crema, terracota, olivo)
  - Tabla de equipos con cantidad, precio/dia, dias y subtotal
  - Desglose financiero completo
  - Datos de la reserva (codigo, fechas, entrega)

Si el servidor SMTP no esta configurado, los errores se registran en consola pero no interrumpen el flujo.

## Funciones especiales

- **Slug en URLs**: los productos se acceden por slug (`/producto/bocina-jbl-prx815`) en lugar de ID numerico
- **Carrito persistente**: se guarda en localStorage y no se pierde al cerrar sesion
- **Disponibilidad por dia**: el calendario muestra el numero exacto de unidades disponibles cada dia
- **Precio calculado por dias**: `precioUnitario = precioRentaDia * dias` en el backend
- **Envio automatico**: $0 en sucursal, $500 a domicilio, gratis si >20 productos
- **Soft-delete**: "Dar de baja" solo marca `fecha_baja` en BD, no elimina registros
- **Reorder de rentas**: historial ordenado del mas reciente al mas antiguo
- **Modal de detalle de pedido**: en admin se abre un modal Bootstrap sin Bootstrap JS (manejo manual con clases CSS)

## Componentes extra

### DateRangePicker (`src/components/DateRangePicker.jsx`)
- Usa `react-datepicker` con seleccion de rango
- Usado en el catalogo (sidebar) para filtrar por fechas

### ProductCalendar (`src/components/ProductCalendar.jsx`)
- Usa `react-datepicker` con renderizado personalizado de dias
- Muestra disponibilidad por dia (numeros verdes/rojos)
- Se actualiza al cambiar de mes
- Usado en la pagina de detalle de producto

### Navbar (`src/components/Navbar.jsx`)
- Navbar responsiva con collapse (Bootstrap CSS + JS bundle)
- Enlaces: Catalogo, Condiciones, Nosotros, FAQ
- Boton Carrito con badge de conteo
- Si hay sesion: nombre clickable → `/perfil`, Mis rentas, Cerrar sesion
- Si es admin: boton Admin
- Sin sesion: boton Iniciar sesion (terracotta)

## Proxy de Vite

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

Todas las peticiones a `/api/*` se redirigen al backend Spring Boot. Esto evita CORS en desarrollo.
