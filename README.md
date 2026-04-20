# Pro-Gas ERP — Frontend

Backoffice web interno para una empresa distribuidora de gas en cilindros. Permite gestionar inventario, registrar pedidos de clientes, controlar entregas de proveedor y realizar el cierre diario de caja del chofer.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| UI | Shadcn/ui + Tailwind CSS v3 |
| HTTP | Axios |
| Router | React Router v7 |
| Iconos | Lucide React |
| Notificaciones | Sonner |

---

## Requisitos previos

- **Node.js** ≥ 18 (probado en v22)
- **npm** ≥ 9
- Backend Pro-Gas corriendo y accesible (ver sección de variables de entorno)

---

## Instalación y desarrollo

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd erp-frontend

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL del backend

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto (no se sube al repositorio):

```env
# URL base del backend. Si se deja vacío, el proxy de Vite redirige /api/* a localhost:8000
VITE_API_URL=http://localhost:8000
```

> En producción esta variable se configura directamente en la plataforma de deploy (Vercel, Render, etc.).

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo TypeScript + bundle de producción |
| `npm run preview` | Previsualizar el bundle de producción localmente |
| `npm run lint` | Análisis estático con ESLint |

---

## Módulos implementados

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Login | `/login` | Autenticación con JWT |
| Inventario | `/inventario` | Vista del stock de cilindros por formato |
| Medias Cargas | `/medias-cargas` | Registro de entregas del proveedor |
| Bitácora | `/bitacora` | Registro de pedidos y llamadas de clientes |
| Cierres Diarios | `/cierres-diarios` | Recepción de cuenta del chofer y cuadre de caja |
| Dashboard | `/dashboard` | *En desarrollo* |
| Tratados Comerciales | `/tratados-comerciales` | *Pendiente* |
| Usuarios | `/usuarios` | *Pendiente — solo super_admin* |

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `operador` | Inventario, Bitácora, Medias Cargas, Cierres Diarios |
| `super_admin` | Todo lo anterior + ajuste de stock, usuarios y contratos |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/              # Componentes Shadcn/ui
│   ├── medias-cargas/   # Componentes del módulo Medias Cargas
│   ├── AppLayout.tsx    # Layout con sidebar y topbar móvil
│   └── ProtectedRoute.tsx
├── hooks/               # Custom hooks de datos y autenticación
├── lib/
│   ├── api.ts           # Cliente Axios con interceptor JWT
│   └── utils.ts
├── pages/               # Una página por módulo
├── types/
│   └── api.ts           # Tipos TypeScript de los schemas del backend
└── App.tsx              # Configuración de rutas
```

---

## CI/CD

GitHub Actions valida automáticamente cada PR hacia `main` y `qa`:

- `npm ci` — instalación limpia de dependencias
- `npm run build` — chequeo de tipos TypeScript + bundle

**Ramas:**
- `main` → producción
- `qa` → staging
- `dev` → desarrollo activo

---

## Agregar componentes UI

El proyecto usa [Shadcn/ui](https://ui.shadcn.com). Para agregar un componente nuevo:

```bash
npx shadcn@latest add <nombre-componente>
# Ejemplo:
npx shadcn@latest add table
npx shadcn@latest add select
```

Los componentes se generan en `src/components/ui/`.
