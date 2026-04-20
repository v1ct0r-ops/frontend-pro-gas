import { useState } from "react";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Producto, AjusteStockRequest } from "@/types/api";

// Paleta de colores por capacidad: 5kg Sky · 11kg Violet · 15kg Blue · 45kg Orange · Grúa Rose
const BARRA_COLOR: Record<number, string> = {
  5: "bg-sky-500",
  11: "bg-violet-500",
  15: "bg-blue-500",
  45: "bg-orange-500",
};

function barraColor(producto: Producto): string {
  if (/gr[úu]a/i.test(producto.formato)) return "bg-rose-500";
  return BARRA_COLOR[producto.peso_kg] ?? "bg-slate-400";
}

interface AjusteForm {
  llenos: string;
  vacios: string;
  motivo: string;
  guardando: boolean;
}

interface CilindroCardProps {
  producto: Producto;
  // Llamado después de guardar un ajuste exitoso para refrescar la grilla
  onAjusteGuardado: () => Promise<void>;
}

export default function CilindroCard({ producto, onAjusteGuardado }: CilindroCardProps) {
  const { hasRole } = useAuth();
  const esSuperAdmin = hasRole("super_admin");

  // Nunca mostrar valores negativos en pantalla
  const llenos = Math.max(0, producto.stock_llenos);
  const vacios = Math.max(0, producto.stock_vacios);

  const [editando, setEditando] = useState(false);
  const [ajuste, setAjuste] = useState<AjusteForm>({
    llenos: "",
    vacios: "",
    motivo: "",
    guardando: false,
  });

  function abrirAjuste() {
    setAjuste({ llenos: String(llenos), vacios: String(vacios), motivo: "", guardando: false });
    setEditando(true);
  }

  function cerrarAjuste() {
    setEditando(false);
  }

  async function guardarAjuste() {
    if (!ajuste.motivo.trim()) {
      toast.error("Debes ingresar un motivo para el ajuste.");
      return;
    }

    const body: AjusteStockRequest = {
      stock_llenos: parseInt(ajuste.llenos, 10) || 0,
      stock_vacios: parseInt(ajuste.vacios, 10) || 0,
      motivo: ajuste.motivo.trim(),
    };

    setAjuste((prev) => ({ ...prev, guardando: true }));
    try {
      await apiClient.patch(`/api/v1/inventario/${producto.id}/ajuste`, body);
      toast.success("Stock actualizado correctamente.");
      cerrarAjuste();
      // Propaga el refresco al padre para sincronizar toda la grilla
      await onAjusteGuardado();
    } catch {
      toast.error("Error al guardar el ajuste. Intenta de nuevo.");
      setAjuste((prev) => ({ ...prev, guardando: false }));
    }
  }

  return (
    <Card className={`overflow-hidden transition-shadow ${editando ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"}`}>
      {/* Barra de color identificadora del formato */}
      <div className={`h-2 w-full ${barraColor(producto)}`} />

      <CardContent className="flex flex-col gap-3 pt-4 pb-4">
        {/* Encabezado: nombre y capacidad */}
        <div>
          <p className="font-semibold text-sm leading-tight">{producto.formato}</p>
          <p className="text-xs text-muted-foreground">{producto.peso_kg} kg</p>
        </div>

        {/* Contadores de stock */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 leading-none">
              {llenos}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Llenos</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 leading-none">
              {vacios}
            </p>
            <p className="text-xs text-slate-500 mt-1">Vacíos</p>
          </div>
        </div>

        {/* Precio público — muestra "—" si el campo no viene en la respuesta */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Precio público</p>
          <p className="text-sm font-medium">
            {producto.precio_publico_base != null
              ? `$${producto.precio_publico_base.toLocaleString("es-CL")}`
              : "—"}
          </p>
        </div>

        {/* Botón de ajuste — solo rol super_admin */}
        {esSuperAdmin && !editando && (
          <Button
            variant="outline"
            size="sm"
            className="w-full min-h-[44px]"
            onClick={abrirAjuste}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Ajustar stock
          </Button>
        )}

        {/* Panel de ajuste inline — se despliega dentro de la tarjeta */}
        {esSuperAdmin && editando && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Llenos</Label>
              <Input
                type="number"
                min="0"
                value={ajuste.llenos}
                onChange={(e) => setAjuste((p) => ({ ...p, llenos: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Vacíos</Label>
              <Input
                type="number"
                min="0"
                value={ajuste.vacios}
                onChange={(e) => setAjuste((p) => ({ ...p, vacios: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">
                Motivo <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Ej: conteo físico"
                value={ajuste.motivo}
                onChange={(e) => setAjuste((p) => ({ ...p, motivo: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            {/* Guardar y cancelar — mínimo 44px para uso táctil */}
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                className="flex-1 min-h-[44px]"
                disabled={ajuste.guardando}
                onClick={guardarAjuste}
              >
                {ajuste.guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
                disabled={ajuste.guardando}
                onClick={cerrarAjuste}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
