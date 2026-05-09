import { useState, useMemo } from "react";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useVentasRevendedor } from "@/hooks/useVentasRevendedor";
import { useInventario } from "@/hooks/useInventario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Producto } from "@/types/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

const fmtKg = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n) + " kg";

// ─── Tipos locales ────────────────────────────────────────────────────────────

type LineaForm = {
  uid: number;
  productoId: string;
  cantidad: string;
  precioUnitario: string;
};

type LineaCalculo = LineaForm & {
  prod: Producto | undefined;
  cantNum: number;
  precioNum: number;
  kilos: number;
  subtotal: number;
  valida: boolean;
};

let _uid = 0;
const newLinea = (): LineaForm => ({ uid: ++_uid, productoId: "", cantidad: "", precioUnitario: "" });

// ─── Página ───────────────────────────────────────────────────────────────────

export default function VentasRevendedor() {
  const { registrarVenta, enviando, errorEnvio } = useVentasRevendedor();
  const { productos, cargando: cargandoProductos, refetch: refetchInventario } = useInventario();

  const [rutCliente, setRutCliente] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [descuentoPorKg, setDescuentoPorKg] = useState("");
  const [lineas, setLineas] = useState<LineaForm[]>([newLinea()]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState<{
    id: number;
    kilos_totales: number;
    monto_descuento: number;
    total_bruto: number;
  } | null>(null);

  // Calculo enriquecido de cada línea
  const lineasConCalculo: LineaCalculo[] = useMemo(
    () =>
      lineas.map((l) => {
        const prod = productos.find((p) => p.id === Number(l.productoId));
        const cantNum = Number(l.cantidad) || 0;
        const precioNum = Number(l.precioUnitario) || 0;
        return {
          ...l,
          prod,
          cantNum,
          precioNum,
          kilos: prod ? cantNum * prod.peso_kg : 0,
          subtotal: cantNum * precioNum,
          valida: !!l.productoId && cantNum > 0 && precioNum > 0,
        };
      }),
    [lineas, productos]
  );

  const lineasValidas = lineasConCalculo.filter((l) => l.valida);
  const totalKilos = lineasConCalculo.reduce((a, c) => a + c.kilos, 0);
  const totalVenta = lineasConCalculo.reduce((a, c) => a + c.subtotal, 0);

  const descuentoNum = Math.round(Number(descuentoPorKg) || 0);
  const montoDescuento = totalKilos * descuentoNum;
  const totalNetoRebajado = Math.max(0, totalVenta - montoDescuento);
  const iva = Math.round(totalNetoRebajado * 0.19);
  const totalBruto = totalNetoRebajado + iva;

  const puedeConfirmar = !!rutCliente.trim() && !!nombreCliente.trim() && lineasValidas.length > 0;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function agregarLinea() {
    setLineas((prev) => [...prev, newLinea()]);
  }

  function eliminarLinea(uid: number) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.uid !== uid) : prev));
  }

  function actualizarLinea(uid: number, campo: keyof Omit<LineaForm, "uid">, valor: string) {
    setLineas((prev) => prev.map((l) => (l.uid === uid ? { ...l, [campo]: valor } : l)));
  }

  function resetForm() {
    setRutCliente("");
    setNombreCliente("");
    setDescuentoPorKg("");
    setLineas([newLinea()]);
  }

  async function handleConfirmar() {
    const resultado = await registrarVenta({
      rut_cliente: rutCliente.trim(),
      nombre_cliente: nombreCliente.trim(),
      fecha: new Date().toISOString(),
      descuento_pesos_por_kilo: descuentoNum,
      lineas: lineasValidas.map((l) => ({
        producto_id: Number(l.productoId),
        cantidad: l.cantNum,
        precio_unitario_factura: l.precioNum,
      })),
    });
    if (resultado) {
      setUltimaVenta({
        id: resultado.id,
        kilos_totales: resultado.kilos_totales,
        monto_descuento: resultado.monto_descuento,
        total_bruto: resultado.total_bruto,
      });
      resetForm();
      setConfirmOpen(false);
      toast.success(`Venta #${resultado.id} registrada`, {
        description: `${fmtKg(resultado.kilos_totales)} · ${fmtCLP(resultado.total_bruto)} total bruto`,
      });
      refetchInventario();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Venta a Revendedor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Facturación con descuento automático por tratado comercial
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchInventario} disabled={cargandoProductos}>
          <RefreshCw className={`h-3.5 w-3.5 ${cargandoProductos ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-col gap-6 max-w-3xl">

        {/* ══ DATOS DEL CLIENTE ════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rut-cliente">RUT del cliente</Label>
                <Input
                  id="rut-cliente"
                  placeholder="12.345.678-9"
                  value={rutCliente}
                  onChange={(e) => setRutCliente(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre-cliente">Nombre / razón social</Label>
                <Input
                  id="nombre-cliente"
                  placeholder="Distribuciones Ejemplo SpA"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ DETALLE DE PRODUCTOS ══════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detalle de productos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">

            {/* Tabla con scroll horizontal en móvil */}
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Cabecera */}
                <div
                  className="grid gap-x-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-1.5 mb-2"
                  style={{ gridTemplateColumns: "minmax(0,1fr) 80px 110px 90px 90px 36px" }}
                >
                  <span>Formato</span>
                  <span className="text-right">Cant.</span>
                  <span className="text-right">Precio/cil.</span>
                  <span className="text-right">Kilos</span>
                  <span className="text-right">Subtotal</span>
                  <span />
                </div>

                {/* Filas */}
                <div className="flex flex-col gap-2">
                  {lineasConCalculo.map((l) => (
                    <div
                      key={l.uid}
                      className="grid items-center gap-x-2"
                      style={{ gridTemplateColumns: "minmax(0,1fr) 80px 110px 90px 90px 36px" }}
                    >
                      <select
                        value={l.productoId}
                        onChange={(e) => actualizarLinea(l.uid, "productoId", e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">Producto…</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.formato} ({p.peso_kg} kg) · {p.stock_llenos} disp.
                          </option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={l.cantidad}
                        onChange={(e) => actualizarLinea(l.uid, "cantidad", e.target.value)}
                        className="h-10 text-right tabular-nums"
                      />

                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={l.precioUnitario}
                        onChange={(e) => actualizarLinea(l.uid, "precioUnitario", e.target.value)}
                        className="h-10 text-right tabular-nums"
                      />

                      <span className="text-right text-sm tabular-nums text-muted-foreground">
                        {l.kilos > 0 ? fmtKg(l.kilos) : "—"}
                      </span>

                      <span className="text-right text-sm tabular-nums font-medium">
                        {l.subtotal > 0 ? (
                          fmtCLP(l.subtotal)
                        ) : (
                          <span className="text-muted-foreground font-normal">—</span>
                        )}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={() => eliminarLinea(l.uid)}
                        disabled={lineas.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={agregarLinea} className="self-start">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar línea
            </Button>

            {/* Descuento por kilo */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descuento-kg">Descuento ($ por kg)</Label>
              <Input
                id="descuento-kg"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={descuentoPorKg}
                onChange={(e) => setDescuentoPorKg(e.target.value)}
                className="h-10 text-right tabular-nums max-w-[160px]"
              />
              {descuentoNum > 0 && (
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat("es-CL").format(descuentoNum)} $/kg aplicado al total de kilos
                </p>
              )}
            </div>

            {/* Ticket de previsualización */}
            <div className="border-t pt-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total kilos</span>
                <span className="tabular-nums font-medium">
                  {totalKilos > 0 ? fmtKg(totalKilos) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total neto</span>
                <span className="tabular-nums font-medium">
                  {totalVenta > 0 ? fmtCLP(totalVenta) : "—"}
                </span>
              </div>
              {descuentoNum > 0 && (
                <>
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Monto descuento</span>
                    <span className="tabular-nums font-medium">
                      − {fmtCLP(montoDescuento)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Neto rebajado</span>
                    <span className="tabular-nums font-medium">{fmtCLP(totalNetoRebajado)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IVA (19%)</span>
                <span className="tabular-nums">{totalNetoRebajado > 0 ? fmtCLP(iva) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-1.5 mt-0.5">
                <span>Total bruto a pagar</span>
                <span className="tabular-nums">
                  {totalBruto > 0 ? fmtCLP(totalBruto) : "—"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Previsualización — el servidor recalcula los valores definitivos.
              </p>
            </div>

            {errorEnvio && <p className="text-sm text-destructive">{errorEnvio}</p>}

            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!puedeConfirmar || enviando}
              className="w-full"
            >
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar venta
            </Button>
          </CardContent>
        </Card>

        {/* Banner de última venta confirmada */}
        {ultimaVenta && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 text-sm">
            <p className="font-semibold text-green-800 dark:text-green-200 mb-1">
              Venta #{ultimaVenta.id} registrada correctamente
            </p>
            <p className="text-green-700 dark:text-green-300">
              {fmtKg(ultimaVenta.kilos_totales)} · {fmtCLP(ultimaVenta.total_bruto)} total bruto (con IVA)
            </p>
            {ultimaVenta.monto_descuento > 0 && (
              <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">
                Descuento aplicado: {fmtCLP(ultimaVenta.monto_descuento)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ══ ALERTDIALOG: Confirmar venta ════════════════════════════════════ */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !enviando && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar venta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 text-sm">
                <p>
                  Cliente: <strong>{nombreCliente}</strong>{" "}
                  <span className="text-muted-foreground">({rutCliente})</span>
                </p>
                <div className="rounded-md border divide-y">
                  {lineasValidas.map((l) => (
                    <div
                      key={l.uid}
                      className="flex items-center justify-between px-3 py-2 gap-2"
                    >
                      <div>
                        <p className="font-medium">{l.prod?.formato ?? `Prod. #${l.productoId}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.cantNum} cil. · {fmtKg(l.kilos)}
                        </p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="text-xs text-muted-foreground">{fmtCLP(l.precioNum)}/u.</p>
                        <p className="font-medium">{fmtCLP(l.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2 flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total kilos</span>
                    <span className="tabular-nums font-medium">{fmtKg(totalKilos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total neto</span>
                    <span className="tabular-nums">{fmtCLP(totalVenta)}</span>
                  </div>
                  {descuentoNum > 0 && (
                    <>
                      <div className="flex justify-between text-destructive">
                        <span>Descuento ({new Intl.NumberFormat("es-CL").format(descuentoNum)} $/kg)</span>
                        <span className="tabular-nums font-medium">− {fmtCLP(montoDescuento)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Neto rebajado</span>
                        <span className="tabular-nums">{fmtCLP(totalNetoRebajado)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (19%)</span>
                    <span className="tabular-nums">{fmtCLP(iva)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-0.5">
                    <span>Total bruto a pagar</span>
                    <span className="tabular-nums">{fmtCLP(totalBruto)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  El servidor recalcula los valores definitivos. El stock se ajustará automáticamente.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmar} disabled={enviando}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar y registrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
