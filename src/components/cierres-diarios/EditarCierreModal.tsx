import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CierreDiario, CierreDiarioUpdate } from "@/types/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function toInt(raw: string): number {
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  cierre: CierreDiario | null;
  enviando: boolean;
  onClose: () => void;
  onGuardar: (id: number, payload: CierreDiarioUpdate) => Promise<boolean>;
}

// ─── FilaResumen ──────────────────────────────────────────────────────────────

function FilaResumen({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : bold ? "font-semibold" : ""}>
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "font-semibold" : muted ? "text-muted-foreground" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditarCierreModal({ cierre, enviando, onClose, onGuardar }: Props) {
  const [totalVentas, setTotalVentas]   = useState("");
  const [efectivo, setEfectivo]         = useState("");
  const [transbank, setTransbank]       = useState("");
  const [descuentos, setDescuentos]     = useState("");
  const [error, setError]               = useState<string | null>(null);

  // Cargar valores actuales cuando se abre el modal
  useEffect(() => {
    if (!cierre) return;
    setTotalVentas(String(cierre.total_ventas_calc));
    setEfectivo(String(cierre.efectivo_rendido));
    setTransbank(String(cierre.vouchers_transbank));
    setDescuentos(String(cierre.descuentos));
    setError(null);
  }, [cierre]);

  // Cálculo de cuadre en tiempo real
  const tvNum   = toInt(totalVentas);
  const efNum   = toInt(efectivo);
  const tbNum   = toInt(transbank);
  const descNum = toInt(descuentos);

  const esperado  = tvNum - descNum;
  const rendido   = efNum + tbNum;
  const diferencia = esperado - rendido;

  async function handleGuardar() {
    if (!cierre) return;
    setError(null);

    const payload: CierreDiarioUpdate = {
      total_ventas_calc:  tvNum,
      efectivo_rendido:   efNum,
      vouchers_transbank: tbNum,
      descuentos:         descNum,
    };

    const ok = await onGuardar(cierre.id, payload);
    if (ok) {
      onClose();
    } else {
      setError("No se pudo guardar. Verifica los datos e intenta de nuevo.");
    }
  }

  return (
    <Dialog open={cierre !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar cierre
            {cierre && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {cierre.chofer_nombre}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* ── Campos de montos ─────────────────────────────────────────── */}
          <div className="grid gap-3">
            <div className="grid grid-cols-[1fr_140px] items-center gap-3">
              <Label htmlFor="edit-total-ventas" className="text-sm">Total ventas</Label>
              <Input
                id="edit-total-ventas"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={totalVentas}
                onChange={(e) => setTotalVentas(e.target.value)}
                className="text-right tabular-nums h-9"
              />
            </div>

            <div className="grid grid-cols-[1fr_140px] items-center gap-3">
              <Label htmlFor="edit-efectivo" className="text-sm">Efectivo entregado</Label>
              <Input
                id="edit-efectivo"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={efectivo}
                onChange={(e) => setEfectivo(e.target.value)}
                className="text-right tabular-nums h-9"
              />
            </div>

            <div className="grid grid-cols-[1fr_140px] items-center gap-3">
              <Label htmlFor="edit-transbank" className="text-sm">Cierre Transbank</Label>
              <Input
                id="edit-transbank"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={transbank}
                onChange={(e) => setTransbank(e.target.value)}
                className="text-right tabular-nums h-9"
              />
            </div>

            <div className="grid grid-cols-[1fr_140px] items-center gap-3">
              <Label htmlFor="edit-descuentos" className="text-sm">Descuento chofer</Label>
              <Input
                id="edit-descuentos"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={descuentos}
                onChange={(e) => setDescuentos(e.target.value)}
                className="text-right tabular-nums h-9"
              />
            </div>
          </div>

          {/* ── Resumen de cuadre (live) ──────────────────────────────────── */}
          <div className="rounded-md border bg-muted/40 p-3 flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Cuadre proyectado
            </p>
            <FilaResumen label="Total ventas" value={formatCLP(tvNum)} />
            {descNum > 0 && (
              <FilaResumen label="Descuentos" value={`− ${formatCLP(descNum)}`} muted />
            )}
            <FilaResumen label="Cobrado esperado" value={formatCLP(esperado)} bold />
            <div className="border-t my-1" />
            <FilaResumen label="Rendido (ef. + TB)" value={formatCLP(rendido)} muted />
            <div className="border-t my-1" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Diferencia</span>
              <span
                className={`tabular-nums ${
                  diferencia > 0
                    ? "text-red-600"
                    : diferencia < 0
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {diferencia > 0
                  ? `+ ${formatCLP(diferencia)}`
                  : diferencia < 0
                  ? `− ${formatCLP(Math.abs(diferencia))}`
                  : formatCLP(0)}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={enviando}>
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
