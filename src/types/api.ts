// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

export type Rol = "operador" | "super_admin";

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  estado: boolean;
}

export interface UsuarioCreate {
  username: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export interface UsuarioUpdate {
  nombre?: string;
  rol?: Rol;
  activo?: boolean;
  password?: string;
}

// ─── Inventario ──────────────────────────────────────────────────────────────

export interface Producto {
  id: number;
  formato: string;
  peso_kg: number;
  stock_llenos: number;
  stock_vacios: number;
  precio_publico_base?: number;
}

export interface AjusteStockRequest {
  stock_llenos?: number;
  stock_vacios?: number;
  motivo: string;
}

// ─── Medias Cargas ───────────────────────────────────────────────────────────

export interface MediaCargaItem {
  producto_id: number;
  cantidad_llenos: number;
  cantidad_vacios: number;
  precio_unitario_neto?: number;
}

export interface MediaCarga {
  id: number;
  numero_guia: string;
  fecha: string;
  proveedor: string;
  lineas: MediaCargaItem[];
  creado_por: string;
  created_at: string;
}

export interface MediaCargaCreate {
  numero_guia: string;
  fecha: string;
  proveedor: string;
  lineas: MediaCargaItem[];
}

// ─── Bitácora ────────────────────────────────────────────────────────────────

export interface LlamadaRegistro {
  id: number;
  cliente_nombre: string;
  telefono: string;
  direccion: string;
  detalle_pedido: string;
  fecha_hora: string;
  usuario_id: number;
}

export interface LlamadaCreate {
  cliente_nombre: string;
  telefono: string;
  direccion: string;
  detalle_pedido: string;
}

// ─── Cierres Diarios ─────────────────────────────────────────────────────────

export type EstadoCuadre = "exacto" | "faltante" | "sobrante";

export type StockSnapshotEntry = {
  formato: string;
  stock_llenos: number;
  stock_vacios: number;
};

export interface CierreDiario {
  id: number;
  chofer_nombre: string;
  fecha: string;
  efectivo_rendido: number;
  vouchers_transbank: number;
  descuentos: number;
  total_ventas_calc: number;
  is_closed: boolean;
  diferencia: number | null;
  estado_cuadre: EstadoCuadre | null;
  stock_snapshot: Record<string, StockSnapshotEntry> | null;
  usuario_id: number;
}

export interface CierreDiarioCreate {
  chofer_nombre: string;
  total_ventas_calc: number;
  efectivo_rendido: number;
  vouchers_transbank: number;
  descuentos: number;
  // fecha es inyectada por el hook con new Date().toISOString()
}

export interface CerrarCierrePayload {
  // stock_snapshot es opcional; el backend puede calcularlo server-side
  stock_snapshot?: string;
}

// ─── Tratados Comerciales ────────────────────────────────────────────────────

export interface TratadoComercial {
  id: number;
  rut: string;
  razon_social: string;
  descuento_porcentaje: number;
  precio_fijo?: number;
  activo: boolean;
  created_at: string;
}

export interface TratadoComercialCreate {
  rut: string;
  razon_social: string;
  descuento_porcentaje: number;
  precio_fijo?: number;
}

export interface TratadoComercialUpdate {
  razon_social?: string;
  descuento_porcentaje?: number;
  precio_fijo?: number;
  activo?: boolean;
}

export interface CalcularPrecioRequest {
  rut: string;
  producto_id: number;
  cantidad: number;
}

export interface CalcularPrecioResponse {
  precio_unitario: number;
  precio_total: number;
  descuento_aplicado: boolean;
}

// ─── Paginación genérica ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}