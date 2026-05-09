import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMediasCargas } from "@/hooks/useMediasCargas";
import type { Producto } from "@/types/api";

interface ItemForm {
  producto_id: string;
  cantidad_llenos: string;
  cantidad_vacios: string;
  precio_neto: string;
}

interface Props {
  productos: Producto[];
  productosLoading?: boolean;
  onSuccess: () => void;
}

const IVA_RATE = 0.19;

const ITEM_VACIO: ItemForm = {
  producto_id: "",
  cantidad_llenos: "",
  cantidad_vacios: "",
  precio_neto: "",
};

function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MediasCargaForm({ productos, productosLoading, onSuccess }: Props) {
  const { crearMediaCarga, enviando, error } = useMediasCargas();
  const [numeroGuia, setNumeroGuia] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [items, setItems] = useState<ItemForm[]>([{ ...ITEM_VACIO }]);

  const totalNeto = items.reduce((sum, item) => {
    const precio = parseFloat(item.precio_neto) || 0;
    const llenos = parseInt(item.cantidad_llenos) || 0;
    return sum + precio * llenos;
  }, 0);
  const totalIVA = totalNeto * IVA_RATE;
  const totalBruto = totalNeto + totalIVA;

  function actualizarItem(index: number, campo: keyof ItemForm, valor: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  }

  function agregarFila() {
    setItems((prev) => [...prev, { ...ITEM_VACIO }]);
  }

  function eliminarFila(index: number) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const itemsValidos = items.filter(
      (item) =>
        item.producto_id &&
        (parseInt(item.cantidad_llenos) > 0 || parseInt(item.cantidad_vacios) > 0)
    );
    if (!numeroGuia.trim() || !proveedor.trim() || itemsValidos.length === 0) return;

    const payload = {
      numero_guia: numeroGuia.trim(),
      fecha: new Date().toISOString().slice(0, 10),
      proveedor: proveedor.trim(),
      lineas: itemsValidos.map((item) => ({
        producto_id: parseInt(item.producto_id),
        cantidad_llenos: parseInt(item.cantidad_llenos) || 0,
        cantidad_vacios: parseInt(item.cantidad_vacios) || 0,
        precio_unitario_neto: parseFloat(item.precio_neto) || 0,
      })),
    };

    const ok = await crearMediaCarga(payload);
    if (!ok) return;

    const kilosTotales = itemsValidos.reduce((sum, item) => {
      const producto = productos.find((p) => p.id === parseInt(item.producto_id));
      const llenos = parseInt(item.cantidad_llenos) || 0;
      return sum + llenos * (producto?.peso_kg ?? 0);
    }, 0);

    toast.success(`${kilosTotales} kg recibidos`, {
      description: `Guía N° ${payload.numero_guia} · ${payload.proveedor}`,
    });

    setNumeroGuia("");
    setProveedor("");
    setItems([{ ...ITEM_VACIO }]);
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registrar entrega de proveedor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="numero_guia">N° de Guía</Label>
              <Input
                id="numero_guia"
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                placeholder="Ej: GD-2024-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Nombre del proveedor"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Productos</Label>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[180px]">
                      Producto
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">
                      Llenos
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">
                      Vacíos
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-36">
                      Precio neto $
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">
                      IVA $
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">
                      Total $
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, i) => {
                    const precioNeto = parseFloat(item.precio_neto) || 0;
                    const llenos = parseInt(item.cantidad_llenos) || 0;
                    const subtotalNeto = precioNeto * llenos;
                    const iva = subtotalNeto * IVA_RATE;
                    const subtotalBruto = subtotalNeto + iva;

                    return (
                      <tr key={i} className="bg-background">
                        <td className="px-3 py-2">
                          <select
                            value={item.producto_id}
                            onChange={(e) => actualizarItem(i, "producto_id", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                          >
                            <option value="">
                              {productosLoading ? "Cargando productos…" : productos.length === 0 ? "Sin productos disponibles" : "Seleccionar..."}
                            </option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.formato} ({p.peso_kg} kg)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.cantidad_llenos}
                            onChange={(e) => actualizarItem(i, "cantidad_llenos", e.target.value)}
                            className="text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.cantidad_vacios}
                            onChange={(e) => actualizarItem(i, "cantidad_vacios", e.target.value)}
                            className="text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.precio_neto}
                            onChange={(e) => actualizarItem(i, "precio_neto", e.target.value)}
                            className="text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                          {formatCLP(iva)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums whitespace-nowrap">
                          {formatCLP(subtotalBruto)}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => eliminarFila(i)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={agregarFila}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar fila
            </Button>
          </div>

          {/* Resumen de totales */}
          <div className="rounded-md bg-muted/50 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal neto</span>
              <span className="tabular-nums">{formatCLP(totalNeto)}</span>
            </div>
            <div className="flex justify-between text-green-600 dark:text-green-500">
              <span>+ IVA (19%)</span>
              <span className="tabular-nums">{formatCLP(totalIVA)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2 mt-1">
              <span>Total bruto</span>
              <span className="tabular-nums">{formatCLP(totalBruto)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={enviando}>
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar entrega"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
