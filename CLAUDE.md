# Pro-Gas ERP — Frontend

Sistema ERP interno para empresa distribuidora de gas en cilindros.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| UI | Shadcn/ui (style: default, baseColor: slate) |
| Estilos | Tailwind CSS v3 + tailwindcss-animate |
| HTTP | Axios — cliente centralizado en `src/lib/api.ts` |
| Router | react-router-dom (ya instalado) |
| Icons | lucide-react + @radix-ui/react-icons |

## Estructura de carpetas (estado actual)

```
src/
  components/
    ui/                     # Shadcn/ui: button, card, input, label, sonner, badge, alert-dialog
    medias-cargas/
      MediasCargaForm.tsx   # Formulario de entrega de proveedor
    AppLayout.tsx           # Layout principal con sidebar + topbar móvil
    CilindroCard.tsx        # Tarjeta de cilindro en inventario
    InventarioGrid.tsx      # Grid de inventario
    ProtectedRoute.tsx      # Guard de rutas privadas (usa Outlet)
  hooks/
    useAuth.ts              # Context + hook de autenticación global
    useBitacora.ts          # Fetch y POST de bitácora de clientes
    useInventario.ts        # Fetch de productos con refetch
    useMediasCargas.ts      # POST de medias cargas
    useCierreDiarios.ts     # Fetch, POST crear y PATCH cerrar de cierres diarios
  lib/
    api.ts                  # ⭐ Cliente Axios con interceptor JWT automático
    utils.ts                # cn() helper de Shadcn
  pages/
    Login.tsx               # ✅ Fase 1
    Inventario.tsx          # ✅ Fase 2
    MediasCargas.tsx        # ✅ Fase 3
    Bitacora.tsx            # ✅ Fase 4
    CierresDiarios.tsx      # ✅ Fase 5
    Dashboard.tsx           # Placeholder — pendiente reemplazar
  services/
    api.ts                  # Archivo legacy — NO usar, usar src/lib/api.ts
  types/
    api.ts                  # Tipos TypeScript de todos los schemas del backend
  App.tsx                   # Router principal con todas las rutas
  main.tsx                  # Entry point — monta AuthProvider + BrowserRouter
  index.css                 # Variables CSS de Shadcn/ui (light + dark)
  vite-env.d.ts             # Tipos de import.meta.env
```

## Alias de paths

`@` → `./src` (configurado en `vite.config.ts`)

```ts
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/api"
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Base URL del backend. En dev se puede dejar vacío (usa proxy Vite). |

Archivo `.env.local` (no commitear):
```
VITE_API_URL=http://localhost:8000
```

En producción (Vercel/Render): `VITE_API_URL=https://backend-pro-gas.onrender.com`

## Backend API

**Base URL dev:** `http://localhost:8000`
**Base URL prod:** `https://backend-pro-gas.onrender.com`
**Auth:** `Authorization: Bearer <jwt_token>`
**BD:** PostgreSQL en Neon (externa a Render, los datos persisten entre redeploys)

### Endpoints disponibles

| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|-----------|
| POST | `/api/v1/auth/login` | Login → retorna JWT | público |
| GET | `/api/v1/inventario/` | Lista productos con stock_llenos y stock_vacios | operador |
| PATCH | `/api/v1/inventario/{id}/ajuste` | Ajuste manual de stock | super_admin |
| GET | `/api/v1/bitacora/` | Lista llamadas registradas | operador |
| POST | `/api/v1/bitacora/` | Registrar llamada | operador |
| GET | `/api/v1/medias-cargas/` | Lista entregas de proveedor | operador |
| POST | `/api/v1/medias-cargas/` | Registrar entrega proveedor | operador |
| GET | `/api/v1/medias-cargas/{id}` | Detalle entrega proveedor | operador |
| GET | `/api/v1/cierres-diarios/` | Lista cierres de caja | operador |
| POST | `/api/v1/cierres-diarios/` | Crear cierre diario | operador |
| GET | `/api/v1/cierres-diarios/{id}` | Detalle cierre | operador |
| PATCH | `/api/v1/cierres-diarios/{id}/cerrar` | Sellar cierre (inmutable tras esto) | operador |
| GET | `/api/v1/tratados-comerciales/` | Lista contratos mayorista | operador |
| POST | `/api/v1/tratados-comerciales/` | Crear contrato | super_admin |
| PATCH | `/api/v1/tratados-comerciales/{id}` | Editar contrato | super_admin |
| DELETE | `/api/v1/tratados-comerciales/{id}` | Eliminar contrato | super_admin |
| POST | `/api/v1/tratados-comerciales/calcular-precio` | Precio según RUT | operador |
| GET | `/api/v1/usuarios/` | Lista usuarios | super_admin |
| POST | `/api/v1/usuarios/` | Crear usuario | super_admin |
| PATCH | `/api/v1/usuarios/{id}` | Editar usuario | super_admin |

### Roles

- `operador` — acceso general a operaciones del día a día
- `super_admin` — acceso completo incluyendo ajustes, usuarios y contratos

### Comportamientos reales del backend (verificados en producción)

**Auth — login:**
- Usa `Content-Type: application/x-www-form-urlencoded` (no JSON)
- JWT payload contiene: `sub` (user ID como string), `rol` (string)
- El campo `nombre` no viene en el JWT; se usa el email como nombre hasta tener endpoint `/me`

**Inventario:**
- `GET /api/v1/inventario/` puede retornar array directo `[]` o `{ items: [] }` — manejar ambos

**Bitácora — schema real verificado:**
```
POST body:  { cliente_nombre, telefono, direccion, detalle_pedido }
GET item:   { id, cliente_nombre, telefono, direccion, detalle_pedido, fecha_hora, usuario_id }
```
- El campo de fecha es `fecha_hora` (no `created_at`)
- El campo de usuario es `usuario_id` (number, no `creado_por` string)
- `detalle_pedido` es requerido (no opcional)

**Cierres Diarios — schema real verificado:**
```
POST body:  { chofer_nombre, fecha (ISO string), total_ventas_calc, efectivo_rendido, vouchers_transbank, descuentos }
GET item:   { id, chofer_nombre, fecha, efectivo_rendido, vouchers_transbank, descuentos,
              total_ventas_calc, is_closed, diferencia, estado_cuadre, stock_snapshot, usuario_id }
```
- **No existe** endpoint PATCH `/{id}` para editar — solo se puede crear (POST) y sellar (PATCH `/cerrar`)
- El endpoint de sellado es **PATCH** `/cerrar`, no POST
- `is_closed: boolean` (no `estado: string`) — lógica de UI se basa en este campo
- `diferencia` y `estado_cuadre` son `null` mientras el cierre está abierto; el backend los calcula al sellar
- `stock_snapshot` se almacena como string JSON en el backend
- El hook añade `fecha: new Date().toISOString()` automáticamente al crear — no exponer en `CierreDiarioCreate`
- Los formatos de productos se ordenan: numéricos ascendente primero (5kg → 11kg → 45kg), no numéricos al final (gruas)
- Fórmula de cuadre del frontend: `(total_ventas_calc - descuentos) - (efectivo_rendido + vouchers_transbank)`

## Proxy Vite (desarrollo)

`vite.config.ts` redirige `/api/*` → `http://localhost:8000`. En dev se puede omitir `VITE_API_URL`.

## Estado de fases

| Fase | Módulo | Estado |
|------|--------|--------|
| 1 | Login + Auth (JWT, ProtectedRoute, AppLayout) | ✅ Completo |
| 2 | Inventario (grid de cilindros, ajuste super_admin) | ✅ Completo |
| 3 | Medias Cargas (formulario de entrega proveedor) | ✅ Completo |
| 4 | Bitácora de Clientes (form + historial del día) | ✅ Completo |
| 5 | Cierres Diarios (recepción cuenta chofer, cuadre, sellado) | ✅ Completo |
| 6 | Tratados Comerciales | 🔲 Pendiente |
| 7 | Usuarios (super_admin) | 🔲 Pendiente |
| 8 | Dashboard real con métricas | 🔲 Pendiente |

## Shadcn/ui

Configurado en `components.json`. Componentes instalados: `button`, `card`, `input`, `label`, `sonner`, `badge`, `alert-dialog`.

Para agregar más:
```bash
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add dialog
```
Los componentes se generan en `src/components/ui/`.

> ⚠️ El paquete `shadcn-ui` está deprecado — usar `npx shadcn@latest add <componente>`

## Patrones establecidos en el proyecto

**Hook de datos:**
```ts
export function useXxx() {
  const [items, setItems] = useState<Xxx[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => { ... }, []);
  useEffect(() => { refetch(); }, [refetch]);
  return { items, cargando, error, refetch };
}
```

**Formularios:**
- Estado local con objeto plano (`useState`)
- Validación manual antes del submit (sin react-hook-form)
- `loading` y `error` explícitos separados del estado de carga de datos
- `noValidate` en el `<form>` para manejar validación en JS

**Select nativo:**
- No hay componente `Select` de Shadcn instalado aún
- Usar `<select>` nativo con estas clases Tailwind:
```
"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
```

**Textarea:**
- Mismas clases base que Input pero sin `h-10`, agregar `resize-none`

**Respuestas de lista del backend:**
- Algunos endpoints retornan `[]` directo y otros `{ items: [] }` — siempre manejar ambos:
```ts
const lista = Array.isArray(data) ? data : data.items;
```

## Reglas del proyecto

- TypeScript estricto — sin `any`
- Usar componentes Shadcn/ui para todo lo visual
- Formularios con estados de `loading` y `error` explícitos
- No inventar endpoints — solo los documentados arriba
- **Antes de implementar un módulo: verificar el schema real del backend** — los tipos en `src/types/api.ts` son una aproximación. Si el backend devuelve un 422 con campos desconocidos, corregir primero `types/api.ts` y dejar que TypeScript propague los errores
- Trabajar de a una fase por conversación para conservar contexto
- Leer archivos existentes antes de crear nuevos
- Sin comentarios obvios en el código

## CI/CD

GitHub Actions en `.github/workflows/ci-frontend.yml`:
- Dispara en PR hacia `main` y `qa`
- Corre `npm ci` + `npm run build` (TypeScript check + bundle)

Ramas: `main` (producción) → `qa` (staging) → `dev` (desarrollo activo)
