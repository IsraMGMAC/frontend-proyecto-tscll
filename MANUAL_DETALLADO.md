# Manual completo del sistema RentaEventos

## Indice
1. [Introduccion](#1-introduccion)
2. [Tecnologias](#2-tecnologias)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Flujo de autenticacion](#4-flujo-de-autenticacion)
5. [Flujo de alquiler completo](#5-flujo-de-alquiler-completo)
6. [Flujo de administracion](#6-flujo-de-administracion)
7. [Flujo de correos electronicos](#7-flujo-de-correos-electronicos)
8. [Flujo de cancelacion y reembolsos](#8-flujo-de-cancelacion-y-reembolsos)
9. [Guia de vistas y funcionalidades](#9-guia-de-vistas-y-funcionalidades)
10. [Componentes especiales](#10-componentes-especiales)
11. [Funciones destacadas del código](#11-funciones-destacadas-del-código)
12. [Manejo de errores](#12-manejo-de-errores)
13. [Persistencia y estado](#13-persistencia-y-estado)

---

## 1. Introduccion

RentaEventos es un sistema web para la administracion de alquiler de equipo para eventos (bocinas, micrófonos, iluminación, mobiliario, accesorios e instrumentos). Permite a los clientes explorar el inventario, consultar disponibilidad por fecha, armar un carrito de compras y realizar reservas. Los administradores pueden gestionar el inventario, ver pedidos, administrar usuarios y cambiar estados de las rentas.

### Actores del sistema

| Actor | Descripcion |
|-------|-------------|
| **Cliente** | Usuario registrado que puede ver catálogo, rentar equipo, ver su historial |
| **Admin** | Usuario administrador que gestiona inventario, pedidos y usuarios |
| **Visitante** | Usuario sin sesion que solo puede ver catálogo y detalles de productos |

---

## 2. Tecnologias

### Frontend
- **Vite 8**: Bundler ultrarrapido con HMR (Hot Module Replacement)
- **React 19**: Renderizado basado en componentes con estado y efectos
- **React Router DOM 7**: Enrutamiento SPA del lado del cliente
- **Bootstrap 5**: Framework CSS con sistema de grillas, componentes y utilidades
- **Axios**: Cliente HTTP con interceptors, soporte para query params y manejo de errores
- **react-datepicker**: Calendario interactivo con seleccion de rango y renderizado personalizado de días

### Backend
- **Spring Boot 3.x**: Framework Java para APIs REST
- **Spring Data JPA**: ORM para acceso a base de datos MySQL
- **BCrypt**: Hash de contrasenas (sal aleatoria incorporada)
- **Thymeleaf**: Motor de plantillas para correos HTML
- **JavaMailSender**: Envío de correos SMTP via Gmail

---

## 3. Estructura del proyecto

```
frontend-proyecto-tscll/
  public/
    productos/           # Imagenes de productos organizadas por categoria/slug
  src/
    components/
      DateRangePicker.jsx    # Calendario simple para filtrar fechas en catálogo
      Navbar.jsx             # Barra de navegacion principal responsiva
      ProductCalendar.jsx    # Calendario con disponibilidad por día
    pages/
      AboutPage.jsx          # Pagina "Nosotros"
      AdminInventario.jsx    # CRUD de equipos (sub-pagina del admin)
      AdminPage.jsx          # Panel admin con pestanas de navegacion
      AdminPedidos.jsx       # Gestion de pedidos con filtros y modal de detalle
      AdminResumen.jsx       # Resumen de inventario con totales y categorias
      AdminUsuarios.jsx      # Gestion de clientes con registro y baja
      CartPage.jsx           # Carrito de compras y checkout
      CatalogPage.jsx        # Catálogo con sidebar de categorias y filtro de fechas
      ConditionsPage.jsx     # Términos y condiciones
      FAQPage.jsx            # Preguntas frecuentes
      LoginPage.jsx          # Inicio de sesion y registro de clientes
      MisRentasPage.jsx      # Historial de rentas del cliente (paginado)
      ProductPage.jsx        # Detalle de producto con calendario y carrito
      ProfilePage.jsx        # Perfil del cliente con edicion y cambio de contrasena
      RentaDetailPage.jsx    # Detalle de una renta especifica
    services/
      api.js                 # Configuracion de Axios (baseURL: /api)
    utils/
      currency.js            # Formateo de moneda (Intl.NumberFormat)
      date.js                # Conversion de fechas y calculo de días
    App.jsx                  # Componente raiz con rutas y estado global
    main.jsx                 # Punto de entrada (React + Bootstrap + Router)
    index.css                # Estilos globales y personalizacion de react-datepicker
```

---

## 4. Flujo de autenticacion

### Inicio de sesion

```
Visitante → /login → selecciona tipo (Cliente/Admin)
  → Cliente: POST /api/clientes/login
      → Éxito: guarda user en estado + localStorage → redirige a /
      → Error: muestra mensaje "Credenciales invalidas"
  → Admin: POST /api/auth/admin/login
      → Éxito: guarda user con tipo:'admin' → redirige a /
      → Error: muestra mensaje "Credenciales invalidas"
```

**Diferencia clave**: El login de cliente busca en `clientes_acceso` (tabla separada del perfil), mientras que el login admin busca en `usuarios_admin`. Ambos usan BCrypt para verificar la contrasena.

### Registro de cliente

```
/ → "Registrate" → formulario con datos personales + email + contrasena
  → POST /api/clientes/registrar
  → POST /api/clientes/login (auto-login)
  → Redirige a / catálogo con sesion iniciada
```

### Cierre de sesion

- Limpia `user` del estado y `localStorage`
- **No limpia el carrito** (se conserva para la proxima sesion)
- Redirige a `/`

### Persistencia de sesion

El usuario se guarda en `localStorage` con clave `renta_eventos_user`. Al recargar la pagina, se recupera automaticamente. Si el token/estado expira, simplemente se muestra como no logueado.

---

## 5. Flujo de alquiler completo

Este es el flujo principal del sistema, desde que un visitante entra hasta que completa una reserva:

### Paso 1: Explorar catálogo
```
Visitante → / (catálogo)
  → Ve todos los productos con precio, descripcion y SKU
  → Filtra por categoria (sidebar izquierdo)
  → (Opcional) Selecciona fechas y da clic en "Buscar"
      → Solo se muestran productos disponibles en ese rango
  → Ordena por nombre o precio (dropdown)
```

### Paso 2: Ver detalle del producto
```
Click en producto → /producto/:slug
  → Ve imagenes (carrusel con miniaturas)
  → Ve calendario con disponibilidad por día
      → Cada día muestra cuantas unidades estan disponibles
      → Al cambiar de mes se recarga automaticamente
  → Ve precio, descripcion, SKU, categoria
```

### Paso 3: Agregar al carrito
```
Selecciona fechas en el calendario (inicio y fin)
Selecciona cantidad (max = disponibles)
→ Click "Anadir al carrito"
  → Si no hay sesion: redirige a /login
  → Si no hay fechas: muestra error "Selecciona las fechas"
  → Éxito: muestra toast "Producto agregado al carrito"
  → Badge en navbar se actualiza
```

### Paso 4: Revisar carrito
```
Click en "Carrito (N)" en navbar → /carrito
  → Lista de equipos con cantidad y subtotal
  → Fechas de renta (se sincronizan desde catálogo/producto)
  → Tipo de entrega (sucursal o domicilio)
  → Costo de envío automatico
  → Deposito de garantia (50%, solo informativo)
  → Desglose: Renta + Envío = Total
```

### Paso 5: Confirmar reserva
```
→ Llena datos de entrega, selecciona metodo de pago
→ Click "Alquilar"
  → Valida que todos los productos tengan fechas
  → POST /api/alquileres (crea la reserva)
  → clearCarrito()
  → Redirige a /renta/{id} (detalle de la renta)
  → Correo de confirmacion enviado al email del cliente
```

### Paso 6: Ver historial
```
Navbar → "Mis rentas" → /mis-rentas
  → Lista paginada (5 por pagina)
  → Ordenada del mas reciente al mas antiguo
  → Cada tarjeta muestra código, fechas, estado, total
  → Click → /renta/{id} detalle completo
```

---

## 6. Flujo de administracion

### Acceso al panel
```
Login como admin → aparece boton "Admin" en navbar
→ /admin
```

### Pestanas del admin

#### Resumen
- Sin interaccion del usuario, solo lectura
- 4 tarjetas: Productos, Unidades disponibles, Unidades fisicas, Categorias
- Desglose por categoria con totales
- Tabla completa de todos los productos con stock

#### Inventario (CRUD)
```
Registrar: llenar formulario → POST /api/equipos
Editar: click "Editar" → formulario pre-cargado → PUT /api/equipos/{id}
Eliminar: click "Eliminar" → confirmacion → DELETE /api/equipos/{id}
```
Campos del formulario: Categoria ID, SKU, Nombre, Slug, Descripcion, Cantidad optima, Con detalles, Mantenimiento, Inservible, Precio/día, Visible en web.

#### Pedidos
```
Lista completa de alquileres con filtros:
  - Por cliente (dropdown con todos los clientes)
  - Por rango de fechas (inicio y fin, con validacion cruzada)

Click en fila → Modal con detalle completo:
  - Datos del pedido (código, cliente, fechas, entrega, dirección)
  - Equipos: cantidad × precio/día × días = subtotal
  - Resumen financiero (total, pagado, saldo)
  - Pagos realizados
  - Botones para cambiar estado:
      Pendiente → Entregado | Cancelado
      Entregado → Devuelto Completo | Devuelto Con Problemas
```

**Funcion especial**: Al cambiar estado, usa el ID del admin logueado para los endpoints `entregar` y `devolver`.

#### Usuarios
```
Lista de clientes registrados con nombre, email, teléfono, fecha de registro

Nuevo cliente: formulario que llama a POST /api/clientes/registrar
Dar de baja: DELETE /api/clientes/{id} (soft-delete: solo marca fecha_baja)
```

---

## 7. Flujo de correos electronicos

### Configuracion
Las credenciales SMTP se leen de variables de entorno (`.env`):
```bash
export MAIL_USERNAME=correo@gmail.com
export MAIL_PASSWORD=contraseña_de_aplicacion
```

### Tipos de correo

#### Registro de cliente
- **Template**: `registro-exitoso.html` (Thymeleaf)
- **Variables**: nombre, email
- **Disparo**: `ClienteService.registrarNuevoCliente()`
- **Contenido**: Confirmacion de cuenta creada, email registrado

#### Confirmacion de alquiler
- **Template**: `confirmacion-alquiler.html` (Thymeleaf)
- **Variables**: nombreCliente, códigoReserva, fechaInicio, fechaFin, tipoEntrega, direccionEnvío, totalDías, totalRenta, costoEnvío, depositoGarantia, totalGeneral, items (lista)
- **Disparo**: `AlquilerService.crearAlquiler()`
- **Contenido**: Tabla con equipos (cant × precio/día × días = subtotal), desglose total, datos de la reserva. Estilo visual identico a la pagina web.

### Manejo de errores
Si el servidor SMTP falla (credenciales invalidas, sin conexion), el error se captura y registra en consola (`System.err.println`). **No interrumpe el flujo** — el usuario se registra o la reserva se crea igualmente.

---

## 8. Flujo de cancelacion y reembolsos

La cancelacion sigue estas reglas de negocio:

| Antelacion | Reembolso | Comportamiento |
|------------|-----------|----------------|
| Mas de 48 hrs (>2 días) | 100% | Boton "Cancelar (100% reembolso)" |
| Entre 24 y 48 hrs (1-2 días) | 50% | Boton "Cancelar (50% reembolso)" |
| Menos de 24 hrs (<1 día) | 0% | No se permite cancelar, solo mensaje informativo |

### Donde se puede cancelar
1. **Mis rentas** (`/mis-rentas`): boton por cada renta en estado Pendiente
2. **Detalle de renta** (`/renta/:id`): boton en la cabecera

### Calculo de días
```javascript
const ms = 1000 * 60 * 60 * 24
const hoy = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
const inicio = new Date(renta.fechaInicio.slice(0, 10) + 'T00:00:00Z')
const días = Math.round((inicio.getTime() - hoy.getTime()) / ms)
```

Se usa medíanoche UTC en ambos casos para evitar errores por timezone.

### Accion de cancelar
```javascript
await api.post(`/alquileres/${id}/cancelar`)
// Actualiza estado en backend y refresca vista
```

---

## 9. Guia de vistas y funcionalidades

### Para visitantes (sin sesion)

| Vista | Que puede hacer |
|-------|-----------------|
| `/` | Ver catálogo completo, filtrar por categoria/fecha, ordenar, ver precios, hacer click para ver detalle |
| `/producto/:slug` | Ver imagenes, calendario con disponibilidad, descripcion, precio. **No puede agregar al carrito** |
| `/login` | Iniciar sesion o registrarse |
| `/condiciones` | Leer términos |
| `/nosotros` | Informacion de la empresa |
| `/faq` | Preguntas frecuentes |

### Para clientes

| Vista | Funcionalidades adicionales |
|-------|----------------------------|
| `/` | Boton "Anadir" en cada producto |
| `/producto/:slug` | Boton "Anadir al carrito" (requiere fechas) |
| `/carrito` | Editar cantidades, seleccionar fechas, tipo de entrega, metodo de pago, confirmar reserva |
| `/mis-rentas` | Ver historial, cancelar rentas (según politica de reembolso) |
| `/renta/:id` | Ver detalle completo, cancelar si aplica |
| `/perfil` | Editar datos personales, cambiar contrasena |

### Para administradores

| Vista | Funcionalidades |
|-------|-----------------|
| `/admin` (Resumen) | Ver totales de inventario, desglose por categoria |
| `/admin` (Inventario) | CRUD de equipos: registrar, editar, eliminar |
| `/admin` (Pedidos) | Ver todos los pedidos, filtrar, ver detalle en modal, cambiar estado |
| `/admin` (Usuarios) | Ver clientes, registrar nuevos, dar de baja |

---

## 10. Componentes especiales

### Navbar (`src/components/Navbar.jsx`)
- **Navbar responsiva de Bootstrap** con collapse para movil
- Usa `bootstrap.bundle.min.js` para el funcionamiento del toggler
- **Enlaces centrales**: Catálogo, Condiciones, Nosotros, FAQ
- **Zona derecha**:
  - Admin (solo si tipo === 'admin')
  - Carrito con badge de conteo (si hay items)
  - Mis rentas (solo si hay sesion)
  - Nombre del usuario (clickeable → /perfil)
  - Cerrar sesion / Iniciar sesion

### DateRangePicker (`src/components/DateRangePicker.jsx`)
- Envoltura de `react-datepicker` con configuracion `selectsRange`
- `minDate={new Date()}`: no permite fechas pasadas
- Usado en el sidebar del catálogo

### ProductCalendar (`src/components/ProductCalendar.jsx`)
- `react-datepicker` con `renderDayContents` personalizado
- **Carga inicial**: al montarse, obtiene disponibilidad del mes actual
- **Cambio de mes**: `onMonthChange` dispara nueva carga
- **Disponibilidad por día**: cada día muestra un numero (ej. "5" = 5 unidades disponibles)
  - Color verde si > 0, rojo si = 0
- Endpoint: `GET /api/equipos/{id}/disponibilidad-díaria?fechaInicio=...&fechaFin=...`
- Usa fechas manuales (sin `toISOString`) para evitar errores de timezone:
  ```javascript
  const desde = \`${year}-${String(m + 1).padStart(2, '0')}-01\`
  ```

### Paginacion en MisRentasPage
- **5 items por pagina**
- Botones: `[Anterior] [1] [2] [3] ... [Siguiente]`
- Se genera array de botones con un `for` loop antes del return (evita problemas con `Array.from` en el bundler)
- `pagina` se resetea a 0 cuando cambian los datos

---

## 11. Funciones destacadas del código

### Proxy de Vite (vite.config.js)
```javascript
server: { proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } }
```
Todas las llamadas `axios.get('/api/equipos')` van a `localhost:8080/api/equipos` sin CORS.

### Carrito persistente
```javascript
const [carrito, setCarrito] = useState(() => {
  const saved = localStorage.getItem(CART_KEY)
  return saved ? JSON.parse(saved) : []
})

useEffect(() => {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito))
}, [carrito])
```
El carrito se guarda en `localStorage` en cada cambio y se recupera al cargar la pagina.

### Precio calculado por días
En el carrito, el `precioUnitario` que se envia al backend es:
```javascript
precioUnitario: item.precio * totalDías
```
Donde `item.precio` es `precioRentaDía` y `totalDías` se calcula con `díasEntre(fechaInicio, fechaFin)`. El backend lo guarda y lo usa para calcular subtotales.

### Costo de envío y deposito automaticos
```javascript
const costoEnvío = tipoEntrega === 'Recoleccion_Sucursal' ? 0 : (totalItems > 20 ? 0 : 500)
const depositoGarantia = totalConDías * 0.5
const totalFinal = totalConDías + costoEnvío
```
El usuario no puede modificar estos valores, solo los ve.

### Rango de fechas con validacion cruzada
```jsx
<input type="date" min={hoy} max={fechaFin || ''} value={fechaInicio} />
<input type="date" min={fechaInicio || hoy} value={fechaFin} />
```
- Inicio: no puede ser pasado, no puede superar a fecha fin
- Fin: no puede ser anterior a fecha inicio

### Estado de cancelacion en MisRentasPage
```javascript
const puedeCancelar = (renta) => {
  if (renta.estado !== 'Pendiente') return null
  // calculo de días restantes...
  return días  // null si no es Pendiente, numero si lo es
}
```
Devuelve `null` o el numero de días restantes. Se usa para mostrar diferentes botones según el rango.

### Modal de detalle de pedido (AdminPedidos)
- No usa Bootstrap JS para el modal
- Se maneja con clases CSS y estado React:
  ```jsx
  {selected ? (
    <>
      <div className="modal-backdrop fade show" onClick={() => setSelected(null)} />
      <div className="modal d-block" tabIndex="-1">
        <div className="modal-díalog modal-lg">...
  ```
- El backdrop captura clicks para cerrar el modal

### IIFE para calculo en JSX
En `RentaDetailPage.jsx` y `AdminPedidos.jsx`, se usa una IIFE para calcular los días dentro del JSX:
```jsx
{(() => {
  const días = detalle.precioRentaDía > 0 ? Math.round(detalle.precioUnitario / detalle.precioRentaDía) : 1
  return `${detalle.cantidadRentada} × ${formatCurrency(detalle.precioRentaDía)} / día × ${días} días`
})()}
```

---

## 12. Manejo de errores

### Red (Axios)
```javascript
try {
  const response = await api.post('/endpoint', data)
} catch (error) {
  const message = error?.response?.data?.mensaje || 'Mensaje generico'
}
```
Todos los llamados a la API usan `try/catch`. Los errores del backend llegan con el formato:
```json
{ "status": 400, "error": "Bad Request", "message": "Mensaje de error", "path": "/api/..." }
```

### Validaciones en formularios
- Campos `required` en HTML para evitar envíos vacios
- Inputs `type="email"`, `type="number"` con `min` y `max`
- Fechas con `min` y `max` para evitar rangos invalidos
- Mensajes de error especificos del backend se muestran en alerts

### Slugs vs IDs
- El ProductPage acepta tanto slug como ID numerico en la URL
- Detecta cual es con regex: `/^\d+$/.test(slug)`
- Si es numerico: usa `/api/equipos/{id}`
- Si es texto: usa `/api/equipos/slug/{slug}`

---

## 13. Persistencia y estado

### localStorage

| Clave | Contenido | Se limpia al... |
|-------|-----------|-----------------|
| `renta_eventos_user` | JSON con datos del usuario | Cerrar sesion |
| `renta_eventos_carrito` | JSON con items del carrito | **Nunca** (ni al cerrar sesion) |
| `renta_eventos_fechas` | JSON con fechaInicio/fechaFin | Al hacer "Limpiar" en catálogo |

### Estado en App.jsx
El estado global se pasa como props a los componentes hijos a traves de las rutas:
```jsx
<Route path="/" element={<CatalogPage user={user} {...cartProps} />} />
```

Donde `cartProps` incluye: carrito, addToCarrito, updateCantidad, removeItem, clearCarrito, totalCarrito, fechasRenta, setFechasRenta, showToast.
