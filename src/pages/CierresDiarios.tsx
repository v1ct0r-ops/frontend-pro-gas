import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCierreDiarios } from "@/hooks/useCierreDiarios";
import { CierresDiariosTable } from "@/components/cierres-diarios/CierresDiariosTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import apiClient from "@/lib/api";
import type { CierreDiario, EstadoCuadre, Producto, Usuario } from "@/types/api";

// ─── Tipos locales ────────────────────────────────────────────────────────────

type LineaVenta = {
  id: number;
  formato: string;
  cantidad: string;
  precio: string;
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fechaLegible(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function calcCuadre(ventas: number, desc: number, transbank: number, efectivo: number) {
  const esperado = ventas - desc;
  const real = transbank + efectivo;
  const diff = esperado - real;
  const estado: EstadoCuadre = diff === 0 ? "exacto" : diff > 0 ? "faltante" : "sobrante";
  return { esperado, real, diff, estado };
}

// ─── CuadreBadge ─────────────────────────────────────────────────────────────

function CuadreBadge({ estado }: { estado: EstadoCuadre }) {
  const map = {
    exacto:   "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    faltante: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    sobrante: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  };
  const labels = { exacto: "Exacto", faltante: "Faltante", sobrante: "Sobrante" };
  return <Badge variant="outline" className={map[estado]}>{labels[estado]}</Badge>;
}

// ─── PanelCuadre ─────────────────────────────────────────────────────────────

function PanelCuadre({ ventas, desc, transbank, efectivo }: {
  ventas: number; desc: number; transbank: number; efectivo: number;
}) {
  const { esperado, diff, estado } = calcCuadre(ventas, desc, transbank, efectivo);
  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        Cuadre — calculado automáticamente
      </p>
      <Row label="Total ventas" value={formatCLP(ventas)} />
      {desc > 0 && <Row label="Descuentos" value={`− ${formatCLP(desc)}`} muted />}
      <Row label="Cobrado esperado" value={formatCLP(esperado)} bold />
      <div className="border-t my-1" />
      <Row label="Cierre Transbank" value={`− ${formatCLP(transbank)}`} muted />
      <Row label="Efectivo chofer" value={`− ${formatCLP(efectivo)}`} muted />
      <div className="border-t my-1" />
      <div className="flex items-center justify-between">
        <span className="font-semibold">Diferencia</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-semibold">
            {diff !== 0 ? `${diff > 0 ? "+" : "−"} ${formatCLP(Math.abs(diff))}` : formatCLP(0)}
          </span>
          <CuadreBadge estado={estado} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }: {
  label: string; value: string; muted?: boolean; bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-muted-foreground" : bold ? "font-medium" : ""}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-medium" : muted ? "text-muted-foreground" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

let nextId = 1;
function newLinea(formato = ""): LineaVenta {
  return { id: nextId++, formato, cantidad: "", precio: "" };
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CierresDiarios() {
  const {
    cierres,
    total,
    totalPages,
    pagina,
    setPagina,
    filtros,
    setFiltros,
    cierreAbiertoHoy,
    cargando,
    enviando,
    errorCarga,
    refetch,
    crearCierre,
    cerrarCierre,
    eliminarCierre,
    descargarPdf,
  } = useCierreDiarios();

  // ── Estado del formulario de creación ─────────────────────────────────────
  const [lineas, setLineas]         = useState<LineaVenta[]>([newLinea()]);
  const [chofer, setChofer]         = useState("");
  const [transbank, setTransbank]   = useState("");
  const [descuentos, setDescuentos] = useState("");
  const [efectivo, setEfectivo]     = useState("");
  const [choferes, setChoferes]     = useState<Usuario[]>([]);
  const productosRef                = useRef<Producto[]>([]);

  // ── Dialogs ───────────────────────────────────────────────────────────────
  const [cierreParaCerrar, setCierreParaCerrar]   = useState<CierreDiario | null>(null);
  const [cierreParaEliminar, setCierreParaEliminar] = useState<CierreDiario | null>(null);
  const [errorDialog, setErrorDialog]             = useState<string | null>(null);

  // ── Filtros locales (antes de aplicar) ────────────────────────────────────
  const [filtroChofer, setFiltroChofer]       = useState(filtros.chofer ?? "");
  const [filtroDesde, setFiltroDesde]         = useState(filtros.fecha_desde?.slice(0, 10) ?? "");
  const [filtroHasta, setFiltroHasta]         = useState(filtros.fecha_hasta?.slice(0, 10) ?? "");
  const [filtroEstado, setFiltroEstado]       = useState<"" | "true" | "false">(
    filtros.is_closed === true ? "true" : filtros.is_closed === false ? "false" : ""
  );

  // Cargar productos del inventario
  useEffect(() => {
    apiClient
      .get<Producto[] | { items: Producto[] }>("/api/v1/inventario/")
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data.items;
        productosRef.current = lista;
        if (lista.length > 0) {
          const sorted = [...lista].sort((a, b) => {
            const nA = parseInt(a.formato);
            const nB = parseInt(b.formato);
            if (isNaN(nA) && isNaN(nB)) return a.formato.localeCompare(b.formato);
            if (isNaN(nA)) return 1;
            if (isNaN(nB)) return -1;
            return nA - nB;
          });
          setLineas(sorted.map((p) => newLinea(p.formato)));
        }
      })
      .catch(() => {});
  }, []);

  // Cargar choferes (silencioso si 403)
  useEffect(() => {
    apiClient
      .get<Usuario[] | { items: Usuario[] }>("/api/v1/usuarios/")
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data.items;
        setChoferes(lista.filter((u) => u.estado));
      })
      .catch(() => {});
  }, []);

  // ── Cálculos del formulario en tiempo real ────────────────────────────────

  const subtotales    = lineas.map((l) => (Number(l.cantidad) || 0) * (Number(l.precio) || 0));
  const totalVentas   = subtotales.reduce((a, b) => a + b, 0);
  const transbankNum  = Number(transbank)  || 0;
  const descuentosNum = Number(descuentos) || 0;
  const efectivoNum   = Number(efectivo)   || 0;

  // ── Reset formulario ──────────────────────────────────────────────────────

  function resetForm() {
    setChofer("");
    setTransbank("");
    setDescuentos("");
    setEfectivo("");
    const prods = productosRef.current;
    if (prods.length > 0) {
      const sorted = [...prods].sort((a, b) => {
        const nA = parseInt(a.formato);
        const nB = parseInt(b.formato);
        if (isNaN(nA) && isNaN(nB)) return a.formato.localeCompare(b.formato);
        if (isNaN(nA)) return 1;
        if (isNaN(nB)) return -1;
        return nA - nB;
      });
      setLineas(sorted.map((p) => newLinea(p.formato)));
    } else {
      setLineas([newLinea()]);
    }
  }

  // ── Helpers de líneas ─────────────────────────────────────────────────────

  function setLinea(id: number, field: keyof LineaVenta, value: string) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, newLinea()]);
  }

  function eliminarLinea(id: number) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  // ── Acciones ─────────────────────────────────────────────────────────────

  async function handleRegistrar() {
    const cierre = await crearCierre({
      chofer_nombre:      chofer.trim() || "Sin asignar",
      total_ventas_calc:  totalVentas,
      efectivo_rendido:   efectivoNum,
      vouchers_transbank: transbankNum,
      descuentos:         descuentosNum,
    });
    if (cierre) {
      resetForm();
      toast.success("Cierre registrado", { description: "Revisa el cuadre y sella." });
    }
  }

  async function handleCerrar() {
    if (!cierreParaCerrar) return;
    setErrorDialog(null);
    const ok = await cerrarCierre(cierreParaCerrar.id);
    if (ok) {
      setCierreParaCerrar(null);
      toast.success("Cierre sellado", { description: "El documento ha quedado congelado." });
    } else {
      setErrorDialog("No se pudo sellar. Intenta de nuevo.");
    }
  }

  async function handleEliminar() {
    if (!cierreParaEliminar) return;
    setErrorDialog(null);
    const ok = await eliminarCierre(cierreParaEliminar.id);
    if (ok) {
      setCierreParaEliminar(null);
      toast.success("Cierre eliminado.");
    } else {
      setErrorDialog("No se pudo eliminar. Intenta de nuevo.");
    }
  }

  // ── Aplicar filtros ───────────────────────────────────────────────────────

  function aplicarFiltros() {
    setFiltros({
      chofer:      filtroChofer.trim() || undefined,
      fecha_desde: filtroDesde ? `${filtroDesde}T00:00:00` : undefined,
      fecha_hasta: filtroHasta ? `${filtroHasta}T23:59:59` : undefined,
      is_closed:   filtroEstado === "" ? undefined : filtroEstado === "true",
    });
  }

  function limpiarFiltros() {
    setFiltroChofer("");
    setFiltroDesde("");
    setFiltroHasta("");
    setFiltroEstado("");
    setFiltros({});
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cierres Diarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recepción de cuenta del chofer</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={cargando}>
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {errorCarga && <p className="text-sm text-destructive mb-4">{errorCarga}</p>}

      <div className="flex flex-col gap-6 max-w-4xl">

        {/* ══ FORMULARIO (solo si no hay cierre abierto hoy) ══════════════════ */}
        {cierreAbiertoHoy === null && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registrar cierre</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {fechaLegible(new Date().toISOString())}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">

              {/* Chofer */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="chofer">Chofer del turno</Label>
                {choferes.length > 0 ? (
                  <select
                    id="chofer"
                    value={chofer}
                    onChange={(e) => setChofer(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">Seleccionar…</option>
                    {choferes.map((u) => (
                      <option key={u.id} value={u.nombre}>{u.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="chofer"
                    placeholder="Nombre del chofer"
                    value={chofer}
                    onChange={(e) => setChofer(e.target.value)}
                  />
                )}
              </div>

              {/* Tabla de ventas */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Ventas por formato</p>
                <div
                  className="grid gap-x-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-1.5"
                  style={{ gridTemplateColumns: "1fr 90px 90px 90px 28px" }}
                >
                  <span>Formato</span>
                  <span className="text-right">Cantidad</span>
                  <span className="text-right">Precio venta</span>
                  <span className="text-right">Subtotal</span>
                  <span />
                </div>
                <div className="flex flex-col gap-1.5">
                  {lineas.map((linea, i) => (
                    <div
                      key={linea.id}
                      className="grid items-center gap-x-2"
                      style={{ gridTemplateColumns: "1fr 90px 90px 90px 28px" }}
                    >
                      <Input
                        placeholder="Formato (ej: 5kg)"
                        value={linea.formato}
                        onChange={(e) => setLinea(linea.id, "formato", e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={linea.cantidad}
                        onChange={(e) => setLinea(linea.id, "cantidad", e.target.value)}
                        className="h-9 text-right tabular-nums"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={linea.precio}
                        onChange={(e) => setLinea(linea.id, "precio", e.target.value)}
                        className="h-9 text-right tabular-nums"
                      />
                      <span className="text-right tabular-nums text-sm font-medium">
                        {subtotales[i] > 0 ? (
                          formatCLP(subtotales[i])
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarLinea(linea.id)}
                        disabled={lineas.length === 1}
                        className="flex items-center justify-center h-9 w-7 rounded text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Eliminar fila"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={agregarLinea}
                  className="self-start -ml-1 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar formato
                </Button>
                <div className="flex justify-between items-center pt-2 border-t font-semibold text-sm">
                  <span>
                    Total ventas{" "}
                    <span className="text-xs font-normal text-muted-foreground">(automático)</span>
                  </span>
                  <span className="tabular-nums">{formatCLP(totalVentas)}</span>
                </div>
              </div>

              {/* Rendición */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">Rendición del turno</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="transbank" className="w-44 shrink-0 text-sm">Cierre Transbank</Label>
                    <Input
                      id="transbank"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      value={transbank}
                      onChange={(e) => setTransbank(e.target.value)}
                      className="text-right tabular-nums max-w-[160px]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="descuentos" className="w-44 shrink-0 text-sm">Descuento chofer</Label>
                    <Input
                      id="descuentos"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      value={descuentos}
                      onChange={(e) => setDescuentos(e.target.value)}
                      className="text-right tabular-nums max-w-[160px]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="efectivo" className="w-44 shrink-0 text-sm">Efectivo entregado</Label>
                    <Input
                      id="efectivo"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      value={efectivo}
                      onChange={(e) => setEfectivo(e.target.value)}
                      className="text-right tabular-nums max-w-[160px]"
                    />
                  </div>
                </div>
              </div>

              <PanelCuadre
                ventas={totalVentas}
                desc={descuentosNum}
                transbank={transbankNum}
                efectivo={efectivoNum}
              />

              <Button onClick={handleRegistrar} disabled={enviando} className="w-full">
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar cierre
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ══ CIERRE ABIERTO, PENDIENTE DE SELLADO ════════════════════════════ */}
        {cierreAbiertoHoy && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Cierre registrado</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {fechaLegible(cierreAbiertoHoy.fecha)} · {cierreAbiertoHoy.chofer_nombre}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">Pendiente de sellado</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Total ventas</p>
                  <p className="font-semibold tabular-nums">{formatCLP(cierreAbiertoHoy.total_ventas_calc)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Descuentos</p>
                  <p className="font-semibold tabular-nums">{formatCLP(cierreAbiertoHoy.descuentos)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Transbank</p>
                  <p className="font-semibold tabular-nums">{formatCLP(cierreAbiertoHoy.vouchers_transbank)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Efectivo</p>
                  <p className="font-semibold tabular-nums">{formatCLP(cierreAbiertoHoy.efectivo_rendido)}</p>
                </div>
              </div>

              <PanelCuadre
                ventas={cierreAbiertoHoy.total_ventas_calc}
                desc={cierreAbiertoHoy.descuentos}
                transbank={cierreAbiertoHoy.vouchers_transbank}
                efectivo={cierreAbiertoHoy.efectivo_rendido}
              />

              <Button onClick={() => { setErrorDialog(null); setCierreParaCerrar(cierreAbiertoHoy); }} disabled={enviando}>
                <Lock className="mr-2 h-4 w-4" />
                Sellar cierre
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ══ HISTORIAL CON FILTROS Y TABLA ═══════════════════════════════════ */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Historial de cierres</h2>
          </div>

          {/* Barra de filtros */}
          <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Chofer</Label>
              <Input
                placeholder="Buscar…"
                value={filtroChofer}
                onChange={(e) => setFiltroChofer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Estado</Label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as "" | "true" | "false")}
                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-28"
              >
                <option value="">Todos</option>
                <option value="false">Pendientes</option>
                <option value="true">Sellados</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-8" onClick={aplicarFiltros}>
                Filtrar
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={limpiarFiltros}>
                Limpiar
              </Button>
            </div>
          </div>

          {/* Tabla */}
          <CierresDiariosTable
            cierres={cierres}
            total={total}
            pagina={pagina}
            totalPages={totalPages}
            cargando={cargando}
            onPageChange={setPagina}
            onEditar={() => toast.info("Edición disponible próximamente.")}
            onCerrar={(c) => { setErrorDialog(null); setCierreParaCerrar(c); }}
            onEliminar={(c) => { setErrorDialog(null); setCierreParaEliminar(c); }}
            onDescargarPdf={descargarPdf}
          />
        </div>
      </div>

      {/* ══ DIALOG — Sellar cierre ══════════════════════════════════════════════ */}
      <AlertDialog
        open={cierreParaCerrar !== null}
        onOpenChange={(open) => { if (!open) setCierreParaCerrar(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Sellar este cierre?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 text-sm">
                {cierreParaCerrar && (
                  <>
                    <p className="text-muted-foreground">
                      Chofer: <strong>{cierreParaCerrar.chofer_nombre}</strong>
                    </p>
                    <PanelCuadre
                      ventas={cierreParaCerrar.total_ventas_calc}
                      desc={cierreParaCerrar.descuentos}
                      transbank={cierreParaCerrar.vouchers_transbank}
                      efectivo={cierreParaCerrar.efectivo_rendido}
                    />
                  </>
                )}
                <p className="text-muted-foreground">
                  Una vez sellado, el registro quedará <strong>congelado</strong> y no podrá
                  ser modificado. El stock actual de bodega quedará registrado en el servidor.
                </p>
                {errorDialog && <p className="text-destructive">{errorDialog}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCerrar} disabled={enviando}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar y sellar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ DIALOG — Eliminar cierre ════════════════════════════════════════════ */}
      <AlertDialog
        open={cierreParaEliminar !== null}
        onOpenChange={(open) => { if (!open) setCierreParaEliminar(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este cierre?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-sm">
                {cierreParaEliminar && (
                  <p className="text-muted-foreground">
                    Se eliminará el cierre de <strong>{cierreParaEliminar.chofer_nombre}</strong>{" "}
                    del <strong>{fechaLegible(cierreParaEliminar.fecha)}</strong>.
                    Esta acción no se puede deshacer.
                  </p>
                )}
                {errorDialog && <p className="text-destructive">{errorDialog}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={enviando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
