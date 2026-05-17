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
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}

export interface UsuarioUpdate {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  estado: boolean;
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
  delta_llenos?: number;
  delta_vacios?: number;
  motivo: string;
}

// ─── Medias Cargas ───────────────────────────────────────────────────────────

export interface LineaMediaCargaCreate {
  producto_id: number;
  cantidad_llenos: number;
  precio_unitario_neto: number;
}

export interface LineaMediaCarga {
  id: number;
  producto_id: number;
  cantidad_llenos: number;
  precio_unitario_neto: number;
  subtotal_neto: number;
}

export interface MediaCargaCreate {
  numero_guia: string;
  proveedor: string;
  fecha: string;
  lineas: LineaMediaCargaCreate[];
}

export interface MediaCarga {
  id: number;
  numero_guia: string;
  proveedor: string | null;
  fecha: string;
  total_neto: number;
  total_iva: number;
  total_bruto: number;
  kilos_totales: number;
  usuario_id: number;
  lineas: LineaMediaCarga[];
}

// ─── Historial de Auditoría ──────────────────────────────────────────────────

export interface LineaHistorial {
  id: number;
  formato_producto: string;
  cantidad_llenos: number;
  cantidad_vacios: number;
  precio_unitario_neto: number;
  kilos_linea: number;
  subtotal_neto: number;
}

export interface HistorialAuditoria {
  id: number;
  media_carga_id: number | null;
  numero_guia: string;
  proveedor: string;
  fecha_documento: string;
  total_neto: number;
  total_iva: number;
  total_bruto: number;
  kilos_totales: number;
  fecha_registro: string;
  registrado_por_id: number;
  registrado_por_nombre: string;
  lineas: LineaHistorial[];
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
  created_at: string;
  closed_at: string | null;
  cerrado_por_id: number | null;
}

export interface LineaMovimientoCierre {
  producto_id: number;
  galones_vendidos: number;
  vacios_devueltos: number;
}

export interface CierreDiarioCreate {
  chofer_nombre: string;
  fecha?: string;
  total_ventas_calc?: number;
  efectivo_rendido?: number;
  vouchers_transbank?: number;
  descuentos?: number;
  lineas_movimiento: LineaMovimientoCierre[];
}

export interface CierreDiarioUpdate {
  chofer_nombre?: string;
  fecha?: string;
  efectivo_rendido?: number;
  vouchers_transbank?: number;
  descuentos?: number;
  total_ventas_calc?: number;
}

export interface CierresDiariosListParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  chofer?: string;
  is_closed?: boolean;
  page?: number;
  limit?: number;
}

export interface CerrarCierrePayload {
  stock_snapshot?: string;
}

// ─── Ventas Revendedor ───────────────────────────────────────────────────────

export interface VentaRevendedorLineaCreate {
  producto_id: number;
  cantidad: number;
  precio_unitario_factura: number;
}

export interface VentaRevendedorCreate {
  rut_cliente: string;
  nombre_cliente: string;
  fecha: string;
  descuento_pesos_por_kilo?: number;
  lineas: VentaRevendedorLineaCreate[];
}

export interface VentaRevendedorPatch {
  rut_cliente?: string;
  nombre_cliente?: string;
  fecha?: string;
}

export interface VentasRevendedorListParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  rut_cliente?: string;
  page?: number;
  limit?: number;
}

export interface VentaRevendedorLinea {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario_factura: number;
  kilos_linea: number;
  descuento_aplicado: number | null;
  subtotal_neto: number;
  precio_tipo: "revendedor" | "publico";
}

export interface VentaRevendedor {
  id: number;
  rut_cliente: string;
  nombre_cliente: string;
  fecha: string;
  created_at: string;
  total_neto: number;
  descuento_pesos_por_kilo: number;
  monto_descuento_total: number;
  total_final: number;
  total_iva: number;
  total_bruto: number;
  kilos_totales: number;
  usuario_id: number;
  lineas: VentaRevendedorLinea[];
}

// ─── Paginación genérica ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
}