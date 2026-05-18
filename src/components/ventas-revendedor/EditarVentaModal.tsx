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
import type { VentaRevendedor, VentaRevendedorPatch } from "@/types/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  venta: VentaRevendedor | null;
  enviando: boolean;
  onClose: () => void;
  onGuardar: (id: number, payload: VentaRevendedorPatch) => Promise<boolean>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditarVentaModal({ venta, enviando, onClose, onGuardar }: Props) {
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venta) return;
    setRut(venta.rut_cliente);
    setNombre(venta.nombre_cliente);
    setFecha(toDatetimeLocal(venta.fecha));
    setError(null);
  }, [venta]);

  async function handleGuardar() {
    if (!venta) return;
    if (!rut.trim() || !nombre.trim() || !fecha) {
      setError("Todos los campos son requeridos.");
      return;
    }
    setError(null);
    const payload: VentaRevendedorPatch = {
      rut_cliente: rut.trim(),
      nombre_cliente: nombre.trim(),
      fecha: fecha.length === 16 ? `${fecha}:00` : fecha,
    };
    const ok = await onGuardar(venta.id, payload);
    if (ok) {
      onClose();
    } else {
      setError("No se pudo guardar. Verifica los datos e intenta de nuevo.");
    }
  }

  return (
    <Dialog open={venta !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar venta
            {venta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                #{venta.id}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-venta-rut">RUT cliente</Label>
            <Input
              id="edit-venta-rut"
              placeholder="12345678-9"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-venta-nombre">Nombre / razón social</Label>
            <Input
              id="edit-venta-nombre"
              placeholder="Distribuidora Ejemplo SpA"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-venta-fecha">Fecha de la venta</Label>
            <Input
              id="edit-venta-fecha"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground rounded-md bg-muted/40 px-3 py-2">
            Los montos (neto, IVA, bruto, descuento) son inmutables y no pueden modificarse
            desde este formulario.
          </p>

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
