# Pro-Gas ERP — Frontend

> Cliente web para la gestión operativa y logística de una distribuidora de gas en cilindros. Cubre control de inventario físico, cierre de caja diario, registro de entregas de proveedor, bitácora de pedidos telefónicos y facturación a revendedores con descuento por kilo.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework UI | React | 18.3 |
| Lenguaje | TypeScript (strict) | 5.4 |
| Build | Vite | 5.2 |
| Estilos | Tailwind CSS + tailwindcss-animate | 3.4 |
| Componentes | shadcn/ui (slot, radix) | — |
| HTTP | Axios | 1.6 |
| Enrutamiento | React Router | 7 |
| Gráficos | Recharts | 3 |
| Iconos | lucide-react + @radix-ui/react-icons | — |
| Notificaciones | Sonner | 2 |

---

## Características principales

- **Dashboard operativo** — KPIs del día (estado de caja, efectivo rendido, ventas del mes, salud de cuadres) y gráfico de actividad de los últimos 7 días (kilos vendidos vs. ingresados).
- **Gestión de Cierres de Caja** — Creación de cierre diario por chofer, cuadre matemático automático `(ventas − descuentos) − (efectivo + vouchers)` y sellado inmutable con snapshot de inventario.
- **Inventario físico** — Visualización de stock de cilindros llenos/vacíos por formato. Ajuste manual de stock disponible para `super_admin`.
- **Medias Cargas** — Registro de entregas de proveedor con múltiples líneas de producto, cálculo automático de IVA y descarga de PDF por entrega.
- **Bitácora de pedidos** — Registro de llamadas entrantes con cliente, dirección, teléfono y detalle de pedido.
- **Ventas a Revendedor** — Facturación con descuento por kilo configurado en tratados comerciales. Cálculo automático de IVA y ajuste de inventario. Exclusivo `super_admin`.
- **Gestión de Usuarios** — CRUD de operadores y administradores. Exclusivo `super_admin`.
- **RBAC** — Dos roles: `operador` (acceso operativo) y `super_admin` (acceso completo). Guardas de ruta aplicadas en el router y en el sidebar de navegación.

---

## Prerrequisitos

| Requisito | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 10 |
| Backend Pro-Gas (FastAPI) | corriendo en `http://localhost:8000` |

---

## Configuración local

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd erp-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con los valores correspondientes

# 4. Levantar el servidor de desarrollo
npm run dev
# Disponible en http://localhost:5173
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `VITE_API_URL` | URL base del backend FastAPI. En desarrollo puede omitirse; el proxy Vite redirige `/api/*` a `http://localhost:8000`. En producción usar la URL completa de Render. | No (dev) / Sí (prod) |

`.env.local` (no commitear):

```env
VITE_API_URL=http://localhost:8000
```

En producción (Vercel / Render):

```env
VITE_API_URL=https://backend-pro-gas.onrender.com
```

---

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/                       # Primitivas de shadcn/ui (button, card, badge, …)
│   ├── medias-cargas/
│   │   └── MediasCargaForm.tsx   # Formulario de ingreso de entrega de proveedor
│   ├── AppLayout.tsx             # Shell principal: sidebar desktop + topbar móvil
│   ├── CilindroCard.tsx          # Tarjeta individual de cilindro en inventario
│   ├── InventarioGrid.tsx        # Grid de productos del inventario
│   └── ProtectedRoute.tsx        # Guard de rutas; acepta prop `requiredRole`
├── hooks/
│   ├── useAuth.ts                # AuthContext + Provider + hook de sesión JWT
│   ├── useBitacora.ts            # Fetch y POST de llamadas registradas
│   ├── useCierreDiarios.ts       # Fetch, POST crear y PATCH cerrar cierres
│   ├── useDashboard.ts           # Fetch del resumen operativo y trigger de reporte
│   ├── useHealthCheck.ts         # Verificación de disponibilidad del backend
│   ├── useInventario.ts          # Fetch de productos con refetch
│   ├── useMediasCargas.ts        # POST de entregas de proveedor
│   ├── useUsuarios.ts            # CRUD de usuarios
│   └── useVentasRevendedor.ts    # POST de ventas a revendedor
├── lib/
│   ├── api.ts                    # Cliente Axios centralizado con interceptor JWT
│   └── utils.ts                  # Helper cn() de shadcn/ui (clsx + tailwind-merge)
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Inventario.tsx
│   ├── MediasCargas.tsx
│   ├── Bitacora.tsx
│   ├── CierresDiarios.tsx
│   ├── VentasRevendedor.tsx      # Exclusivo super_admin
│   └── Usuarios.tsx              # Exclusivo super_admin
├── types/
│   └── api.ts                    # Tipos TypeScript de todos los schemas del backend
├── App.tsx                       # Router con rutas protegidas y guardas de rol
└── main.tsx                      # Entry point: monta AuthProvider + BrowserRouter
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo Vite en el puerto 5173 con HMR y proxy hacia el backend. |
| `npm run build` | Ejecuta `tsc` (verificación de tipos estricta) seguido del bundle de producción en `dist/`. Falla si hay errores de TypeScript. |
| `npm run lint` | Corre ESLint con las reglas de `@typescript-eslint` y `react-hooks`. Devuelve error con cualquier warning. |
| `npm run preview` | Sirve el bundle de producción de `dist/` localmente para validación previa al despliegue. |

---

## Autenticación y seguridad

El flujo de autenticación opera íntegramente en el cliente:

1. `POST /api/v1/auth/login` con `Content-Type: application/x-www-form-urlencoded` retorna un JWT.
2. El token se almacena en `localStorage` bajo la clave `access_token`.
3. `src/lib/api.ts` inyecta el header `Authorization: Bearer <token>` en cada request mediante un interceptor de Axios.
4. Un interceptor de response captura HTTP 401 (excepto en el propio endpoint de login), limpia el storage y redirige a `/login`.
5. `ProtectedRoute` verifica `isAuthenticated` antes de renderizar cualquier ruta privada. La prop `requiredRole` restringe rutas a un rol específico.

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| `operador` | Dashboard, Inventario, Bitácora, Medias Cargas, Cierres Diarios |
| `super_admin` | Todo lo anterior + Ventas a Revendedor, Usuarios, ajuste manual de stock |

---

## CI/CD

GitHub Actions ejecuta el pipeline definido en `.github/workflows/ci-frontend.yml` en cada Pull Request hacia `main` y `qa`.

**Pasos del pipeline:**
1. Checkout del código.
2. Setup de Node.js 20 con caché de npm.
3. `npm ci` — instalación reproducible de dependencias.
4. `npm run build` — type-check de TypeScript + bundle de Vite. El pipeline falla si TypeScript reporta errores.

**Estrategia de ramas:**

```
main  ←  qa  ←  dev
```

| Rama | Propósito |
|---|---|
| `main` | Producción desplegada en Render / Vercel |
| `qa` | Staging para validación previa al merge a main |
| `dev` | Desarrollo activo; origen de todas las feature branches |

---

## Backend

| Entorno | URL |
|---|---|
| Desarrollo | `http://localhost:8000` |
| Producción | `https://backend-pro-gas.onrender.com` |

El backend es una API REST construida con FastAPI (Python). La base de datos es PostgreSQL en Neon (externa a Render; los datos persisten entre redeploys). La documentación interactiva de la API está disponible en `/docs` (Swagger UI).

---

## Agregar componentes UI

El proyecto usa [shadcn/ui](https://ui.shadcn.com). Los componentes se generan en `src/components/ui/`.

```bash
npx shadcn@latest add <nombre-componente>
```
