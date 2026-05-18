import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listarVentasRevendedor,
  crearVentaRevendedor as svcCrear,
  editarVentaRevendedor as svcEditar,
  eliminarVentaRevendedor as svcEliminar,
  descargarPdfVentaRevendedor,
} from "@/services/ventasRevendedor";
import type {
  VentaRevendedor,
  VentaRevendedorCreate,
  VentaRevendedorPatch,
  VentasRevendedorListParams,
} from "@/types/api";

export const VENTAS_REVENDEDOR_LIMIT = 20;

type PydanticError = { msg?: string };

export function useVentasRevendedor() {
  // ── Lista paginada ────────────────────────────────────────────────────────
  const [ventas, setVentas] = useState<VentaRevendedor[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltrosInternal] = useState<VentasRevendedorListParams>({});

  // ── Estados async ─────────────────────────────────────────────────────────
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / VENTAS_REVENDEDOR_LIMIT));

  // ── Fetch lista ───────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const resp = await listarVentasRevendedor({
        ...filtros,
        page: pagina,
        limit: VENTAS_REVENDEDOR_LIMIT,
      });
      setVentas(resp.items);
      setTotal(resp.total);
    } catch {
      setErrorCarga("No se pudo cargar el historial de ventas.");
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function setFiltros(nuevos: VentasRevendedorListParams) {
    setFiltrosInternal(nuevos);
    setPagina(1);
  }

  // ── crearVenta ────────────────────────────────────────────────────────────
  async function crearVenta(payload: VentaRevendedorCreate): Promise<VentaRevendedor | null> {
    setEnviando(true);
    try {
      const venta = await svcCrear(payload);
      await refetch();
      return venta;
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      let msg: string;
      if (Array.isArray(detail)) {
        msg = (detail as PydanticError[]).map((e) => e.msg ?? "Error").join(". ");
      } else if (typeof detail === "string") {
        msg = detail;
      } else {
        msg = "Error al registrar la venta. Intenta de nuevo.";
      }
      toast.error(msg);
      return null;
    } finally {
      setEnviando(false);
    }
  }

  // ── editarVenta ───────────────────────────────────────────────────────────
  async function editarVenta(id: number, payload: VentaRevendedorPatch): Promise<boolean> {
    setEnviando(true);
    try {
      await svcEditar(id, payload);
      await refetch();
      return true;
    } catch {
      toast.error("No se pudo editar la venta.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  // ── eliminarVenta ─────────────────────────────────────────────────────────
  async function eliminarVenta(id: number): Promise<boolean> {
    setEnviando(true);
    try {
      await svcEliminar(id);
      await refetch();
      return true;
    } catch {
      toast.error("No se pudo eliminar la venta.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  // ── descargarPdf ──────────────────────────────────────────────────────────
  async function descargarPdf(id: number): Promise<void> {
    try {
      await descargarPdfVentaRevendedor(id);
    } catch {
      toast.error("No se pudo descargar el PDF.");
    }
  }

  return {
    ventas,
    total,
    totalPages,
    pagina,
    setPagina,
    filtros,
    setFiltros,
    cargando,
    enviando,
    errorCarga,
    refetch,
    crearVenta,
    editarVenta,
    eliminarVenta,
    descargarPdf,
  };
}
