import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  listarCierres,
  crearCierre as svcCrear,
  editarCierre as svcEditar,
  cerrarCierre as svcCerrar,
  eliminarCierre as svcEliminar,
  anularCierre as svcAnular,
  descargarPdfCierre,
} from "@/services/cierresDiarios";
import type {
  CierreDiario,
  CierreDiarioCreate,
  CierreDiarioUpdate,
  CierresDiariosListParams,
} from "@/types/api";

const PAGE_SIZE = 5;

function inicioHoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function finHoy() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function useCierreDiarios() {
  // ── Tabla paginada ────────────────────────────────────────────────────────
  const [cierres, setCierres] = useState<CierreDiario[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [filtros, setFiltrosInternal] = useState<CierresDiariosListParams>({});

  // ── Cierre abierto del día (para el formulario/card de sellado) ───────────
  // undefined = cargando todavía; null = no existe hoy
  const [cierreAbiertoHoy, setCierreAbiertoHoy] = useState<CierreDiario | null | undefined>(
    undefined
  );

  // ── Estados async ─────────────────────────────────────────────────────────
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // ── Fetch tabla ───────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const resp = await listarCierres({ ...filtros, page, page_size: PAGE_SIZE });
      setCierres(resp.items);
      setTotal(resp.total);
      setTotalPages(resp.total_pages);
    } catch {
      setErrorCarga("No se pudo cargar los cierres diarios.");
    } finally {
      setCargando(false);
    }
  }, [filtros, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // ── Fetch cierre abierto de hoy (consulta independiente) ─────────────────
  const refetchHoy = useCallback(async () => {
    try {
      const resp = await listarCierres({
        fecha_desde: inicioHoy(),
        fecha_hasta: finHoy(),
        is_closed: false,
        page_size: 1,
      });
      setCierreAbiertoHoy(resp.items[0] ?? null);
    } catch {
      setCierreAbiertoHoy(null);
    }
  }, []);

  useEffect(() => {
    refetchHoy();
  }, [refetchHoy]);

  // ── setFiltros: resetea la página al cambiar filtros ──────────────────────
  function setFiltros(nuevosFiltros: CierresDiariosListParams) {
    setFiltrosInternal(nuevosFiltros);
    setPage(1);
  }

  // ── crearCierre ───────────────────────────────────────────────────────────
  async function crearCierre(payload: CierreDiarioCreate): Promise<CierreDiario | null> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const cierre = await svcCrear({ ...payload, fecha: new Date().toISOString() });
      setPage(1);
      await Promise.all([refetch(), refetchHoy()]);
      return cierre;
    } catch {
      setErrorEnvio("No se pudo registrar el cierre.");
      return null;
    } finally {
      setEnviando(false);
    }
  }

  // ── editarCierre ──────────────────────────────────────────────────────────
  async function editarCierre(id: number, payload: CierreDiarioUpdate): Promise<boolean> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await svcEditar(id, payload);
      await refetch();
      return true;
    } catch (err) {
      // HR-F-06: surface el motivo real del backend (403 inmutabilidad,
      // 409 correlatividad, 400 stock) en vez de un mensaje genérico.
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined;
      const msg = detail ?? "No se pudo editar el cierre.";
      setErrorEnvio(msg);
      toast.error(msg);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  // ── cerrarCierre — el backend calcula snapshot server-side ────────────────
  async function cerrarCierre(id: number): Promise<boolean> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await svcCerrar(id);
      await Promise.all([refetch(), refetchHoy()]);
      return true;
    } catch {
      setErrorEnvio("No se pudo sellar el cierre.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  // ── eliminarCierre ────────────────────────────────────────────────────────
  async function eliminarCierre(id: number): Promise<boolean> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await svcEliminar(id);
      await Promise.all([refetch(), refetchHoy()]);
      return true;
    } catch {
      setErrorEnvio("No se pudo eliminar el cierre.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  // ── anularCierre ──────────────────────────────────────────────────────────
  async function anularCierre(id: number, motivo: string): Promise<boolean> {
    setEnviando(true);
    try {
      await svcAnular(id, motivo);
      await Promise.all([refetch(), refetchHoy()]);
      return true;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        toast.error("Solo puedes anular el último cierre registrado.");
      } else if (status === 400) {
        toast.error("Anulación imposible: stock insuficiente para revertir el inventario.");
      } else if (status === 403) {
        toast.error("No tienes permiso para anular cierres sellados.");
      } else {
        toast.error("No se pudo anular el cierre.");
      }
      return false;
    } finally {
      setEnviando(false);
    }
  }

  // ── descargarPdf ──────────────────────────────────────────────────────────
  async function descargarPdf(id: number): Promise<void> {
    try {
      await descargarPdfCierre(id);
    } catch {
      toast.error("No se pudo descargar el PDF.");
    }
  }

  return {
    // Tabla
    cierres,
    total,
    totalPages,
    page,
    setPage,
    filtros,
    setFiltros,
    // Hoy
    cierreAbiertoHoy,
    // Estados
    cargando,
    enviando,
    errorCarga,
    errorEnvio,
    // Acciones
    refetch,
    crearCierre,
    editarCierre,
    cerrarCierre,
    eliminarCierre,
    anularCierre,
    descargarPdf,
  };
}
