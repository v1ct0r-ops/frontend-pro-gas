import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Lock, Calendar, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCierreDiarios } from "@/hooks/useCierreDiarios";
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

function esHoy(fechaIso: string) {
  return fechaIso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function fechaLegible(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function horaLocal(fechaIso: string) {
  return new Date(fechaIso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
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

// ─── Panel cuadre ─────────────────────────────────────────────────────────────

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
      <span className={`tabular-nums ${bold ? "font-medium" : muted ? "text-muted-foreground" : ""}`}>{value}</span>
    </div>
  );
}

// ─── Historial ────────────────────────────────────────────────────────────────

function CierreHistorialCard({ cierre }: { cierre: CierreDiario }) {
  const { diff, estado } = calcCuadre(
    cierre.total_ventas_calc, cierre.descuentos,
    cierre.vouchers_transbank, cierre.efectivo_rendido,
  );
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium capitalize truncate">{fechaLegible(cierre.fecha)}</span>
          </div>
          {cierre.is_closed
            ? <Badge variant="destructive" className="shrink-0 text-xs">Sellado</Badge>
            : <Badge variant="secondary" className="shrink-0 text-xs">Pendiente</Badge>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div><p className="text-muted-foreground">Ventas</p><p className="font-medium">{formatCLP(cierre.total_ventas_calc)}</p></div>
          <div><p className="text-muted-foreground">Rendido</p><p className="font-medium">{formatCLP(cierre.efectivo_rendido + cierre.vouchers_transbank)}</p></div>
          <div>
            <p className="text-muted-foreground">Cuadre</p>
            <CuadreBadge estado={(cierre.estado_cuadre as EstadoCuadre) ?? estado} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          {cierre.chofer_nombre} · {horaLocal(cierre.fecha)}
          {!cierre.is_closed && diff !== 0 && (
            <span className={diff > 0 ? " text-red-600" : " text-yellow-600"}>
              {" "}· {diff > 0 ? "Faltante" : "Sobrante"} {formatCLP(Math.abs(diff))}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
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
  const { cierres, cargando, enviando, errorCarga, refetch, crearCierre, cerrarCierre } =
    useCierreDiarios();

  const [lineas, setLineas]         = useState<LineaVenta[]>([newLinea()]);
  const [chofer, setChofer]         = useState("");
  const [transbank, setTransbank]   = useState("");
  const [descuentos, setDescuentos] = useState("");
  const [efectivo, setEfectivo]     = useState("");
  const [choferes, setChoferes]     = useState<Usuario[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sellando, setSellando]     = useState(false);
  const [errorSellado, setErrorSellado] = useState<string | null>(null);

  const productosRef = useRef<Producto[]>([]);

  // Cargar productos del inventario → inicializar filas de ventas
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
            if (isNaN(nA)) return 1;   // no numérico (gruas, etc.) va al final
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

  const cierresDeHoy      = cierres.filter((c) => esHoy(c.fecha));
  const cierreAbierto     = cierresDeHoy.find((c) => !c.is_closed) ?? null;
  const cierresHoySealed  = cierresDeHoy.filter((c) => c.is_closed);
  const cierresAnteriores = cierres.filter((c) => !esHoy(c.fecha));

  // ── Cálculos en tiempo real ───────────────────────────────────────────────

  const subtotales    = lineas.map((l) => (Number(l.cantidad) || 0) * (Number(l.precio) || 0));
  const totalVentas   = subtotales.reduce((a, b) => a + b, 0);
  const transbankNum  = Number(transbank)   || 0;
  const descuentosNum = Number(descuentos)  || 0;
  const efectivoNum   = Number(efectivo)    || 0;

  // ── Reset del formulario ──────────────────────────────────────────────────

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

  async function handleSellar() {
    if (!cierreAbierto) return;
    setSellando(true);
    setErrorSellado(null);
    try {
      const { data: invData } = await apiClient.get<Producto[] | { items: Producto[] }>("/api/v1/inventario/");
      const productos = Array.isArray(invData) ? invData : invData.items;
      const snap: Record<string, { formato: string; stock_llenos: number; stock_vacios: number }> = {};
      productos.forEach((p) => {
        snap[String(p.id)] = { formato: p.formato, stock_llenos: p.stock_llenos, stock_vacios: p.stock_vacios };
      });
      const ok = await cerrarCierre(cierreAbierto.id, { stock_snapshot: JSON.stringify(snap) });
      if (ok) {
        setDialogOpen(false);
        toast.success("Cierre sellado", { description: "El documento ha quedado congelado." });
      } else {
        setErrorSellado("No se pudo sellar. Intenta de nuevo.");
      }
    } catch {
      setErrorSellado("Error inesperado al sellar.");
    } finally {
      setSellando(false);
    }
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

      {cargando && cierres.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-2xl">

          {/* ══ FORMULARIO DE REGISTRO (solo si no hay cierre abierto) ══ */}
          {!cierreAbierto && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Registrar cierre</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {fechaLegible(new Date().toISOString())}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">

                {/* ── Chofer ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="chofer">Chofer del turno</Label>
                  {choferes.length > 0 ? (
                    <select id="chofer" value={chofer} onChange={(e) => setChofer(e.target.value)} className={SELECT_CLS}>
                      <option value="">Seleccionar…</option>
                      {choferes.map((u) => (
                        <option key={u.id} value={u.nombre}>{u.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <Input id="chofer" placeholder="Nombre del chofer" value={chofer} onChange={(e) => setChofer(e.target.value)} />
                  )}
                </div>

                {/* ── Tabla de ventas ────────────────────────────────── */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">Ventas por formato</p>

                  {/* Cabecera */}
                  <div className="grid gap-x-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-1.5"
                    style={{ gridTemplateColumns: "1fr 90px 90px 90px 28px" }}>
                    <span>Formato</span>
                    <span className="text-right">Cantidad</span>
                    <span className="text-right">Precio venta</span>
                    <span className="text-right">Subtotal</span>
                    <span />
                  </div>

                  {/* Filas de productos */}
                  <div className="flex flex-col gap-1.5">
                    {lineas.map((linea, i) => (
                      <div key={linea.id} className="grid items-center gap-x-2"
                        style={{ gridTemplateColumns: "1fr 90px 90px 90px 28px" }}>

                        {/* Formato — puede escribirse si vino vacío */}
                        <Input
                          placeholder="Formato (ej: 5kg)"
                          value={linea.formato}
                          onChange={(e) => setLinea(linea.id, "formato", e.target.value)}
                          className="h-9"
                        />

                        {/* Cantidad — ingreso manual */}
                        <Input
                          type="number" inputMode="numeric" min="0" placeholder="0"
                          value={linea.cantidad}
                          onChange={(e) => setLinea(linea.id, "cantidad", e.target.value)}
                          className="h-9 text-right tabular-nums"
                        />

                        {/* Precio venta — ingreso manual */}
                        <Input
                          type="number" inputMode="numeric" min="0" placeholder="0"
                          value={linea.precio}
                          onChange={(e) => setLinea(linea.id, "precio", e.target.value)}
                          className="h-9 text-right tabular-nums"
                        />

                        {/* Subtotal — automático */}
                        <span className="text-right tabular-nums text-sm font-medium">
                          {subtotales[i] > 0 ? formatCLP(subtotales[i]) : <span className="text-muted-foreground">—</span>}
                        </span>

                        {/* Eliminar fila */}
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

                  {/* Agregar fila */}
                  <Button type="button" variant="ghost" size="sm" onClick={agregarLinea} className="self-start -ml-1 text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar formato
                  </Button>

                  {/* Total ventas — automático */}
                  <div className="flex justify-between items-center pt-2 border-t font-semibold text-sm">
                    <span>
                      Total ventas{" "}
                      <span className="text-xs font-normal text-muted-foreground">(automático)</span>
                    </span>
                    <span className="tabular-nums">{formatCLP(totalVentas)}</span>
                  </div>
                </div>

                {/* ── Rendición ──────────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold">Rendición del turno</p>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Cierre Transbank */}
                    <div className="flex items-center gap-3">
                      <Label htmlFor="transbank" className="w-44 shrink-0 text-sm">
                        Cierre Transbank
                      </Label>
                      <Input
                        id="transbank" type="number" inputMode="numeric" min="0" placeholder="0"
                        value={transbank} onChange={(e) => setTransbank(e.target.value)}
                        className="text-right tabular-nums max-w-[160px]"
                      />
                    </div>

                    {/* Descuento chofer */}
                    <div className="flex items-center gap-3">
                      <Label htmlFor="descuentos" className="w-44 shrink-0 text-sm">
                        Descuento chofer
                      </Label>
                      <Input
                        id="descuentos" type="number" inputMode="numeric" min="0" placeholder="0"
                        value={descuentos} onChange={(e) => setDescuentos(e.target.value)}
                        className="text-right tabular-nums max-w-[160px]"
                      />
                    </div>

                    {/* Efectivo */}
                    <div className="flex items-center gap-3">
                      <Label htmlFor="efectivo" className="w-44 shrink-0 text-sm">
                        Efectivo entregado
                      </Label>
                      <Input
                        id="efectivo" type="number" inputMode="numeric" min="0" placeholder="0"
                        value={efectivo} onChange={(e) => setEfectivo(e.target.value)}
                        className="text-right tabular-nums max-w-[160px]"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Cuadre (automático) ─────────────────────────────── */}
                <PanelCuadre
                  ventas={totalVentas}
                  desc={descuentosNum}
                  transbank={transbankNum}
                  efectivo={efectivoNum}
                />

                {/* Botón registrar */}
                <Button onClick={handleRegistrar} disabled={enviando} className="w-full">
                  {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar cierre
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ══ CIERRE ABIERTO, PENDIENTE DE SELLADO ════════════════════ */}
          {cierreAbierto && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Cierre registrado</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">
                      {fechaLegible(cierreAbierto.fecha)} · {cierreAbierto.chofer_nombre}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">Pendiente de sellado</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Total ventas</p>
                    <p className="font-semibold tabular-nums">{formatCLP(cierreAbierto.total_ventas_calc)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Descuentos</p>
                    <p className="font-semibold tabular-nums">{formatCLP(cierreAbierto.descuentos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Transbank</p>
                    <p className="font-semibold tabular-nums">{formatCLP(cierreAbierto.vouchers_transbank)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Efectivo</p>
                    <p className="font-semibold tabular-nums">{formatCLP(cierreAbierto.efectivo_rendido)}</p>
                  </div>
                </div>

                <PanelCuadre
                  ventas={cierreAbierto.total_ventas_calc}
                  desc={cierreAbierto.descuentos}
                  transbank={cierreAbierto.vouchers_transbank}
                  efectivo={cierreAbierto.efectivo_rendido}
                />

                <Button onClick={() => setDialogOpen(true)} disabled={enviando}>
                  <Lock className="mr-2 h-4 w-4" />
                  Sellar cierre
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ══ CIERRES SELLADOS HOY ═════════════════════════════════════ */}
          {cierresHoySealed.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Sellados hoy</h2>
              <div className="flex flex-col gap-3">
                {cierresHoySealed.map((c) => (
                  <CierreHistorialCard key={c.id} cierre={c} />
                ))}
              </div>
            </div>
          )}

          {/* ══ HISTORIAL ═══════════════════════════════════════════════ */}
          {cierresAnteriores.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Cierres anteriores</h2>
              <div className="flex flex-col gap-3">
                {cierresAnteriores.map((c) => (
                  <CierreHistorialCard key={c.id} cierre={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ALERTDIALOG DE SELLADO ══════════════════════════════════════ */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Sellar este cierre?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 text-sm">
                {cierreAbierto && (
                  <PanelCuadre
                    ventas={cierreAbierto.total_ventas_calc}
                    desc={cierreAbierto.descuentos}
                    transbank={cierreAbierto.vouchers_transbank}
                    efectivo={cierreAbierto.efectivo_rendido}
                  />
                )}
                <p className="text-muted-foreground">
                  Una vez sellado, el registro quedará <strong>congelado</strong> y no podrá
                  ser modificado. Se capturará el stock actual de bodega.
                </p>
                {errorSellado && <p className="text-destructive">{errorSellado}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sellando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSellar} disabled={sellando}>
              {sellando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar y sellar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
