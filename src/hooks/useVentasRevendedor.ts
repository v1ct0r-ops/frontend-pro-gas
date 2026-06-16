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

const PAGE_SIZE = 5;

type PydanticError = { msg?: string };

export function useVentasRevendedor() {
  // ── Lista paginada ────────────────────────────────────────────────────────
  const [ventas, setVentas] = useState<VentaRevendedor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [filtros, setFiltrosInternal] = useState<VentasRevendedorListParams>({});

  // ── Estados async ─────────────────────────────────────────────────────────
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // ── Fetch lista ───────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const resp = await listarVentasRevendedor({
        ...filtros,
        page,
        page_size: PAGE_SIZE,
      });
      setVentas(resp.items);
      setTotal(resp.total);
      setTotalPages(resp.total_pages);
    } catch {
      setErrorCarga("No se pudo cargar el historial de ventas.");
    } finally {
      setCargando(false);
    }
  }, [filtros, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function setFiltros(nuevos: VentasRevendedorListParams) {
    setFiltrosInternal(nuevos);
    setPage(1);
  }

  // ── crearVenta ────────────────────────────────────────────────────────────
  async function crearVenta(payload: VentaRevendedorCreate): Promise<VentaRevendedor | null> {
    setEnviando(true);
    try {
      const venta = await svcCrear(payload);
      setPage(1);
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
    page,
    setPage,
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
