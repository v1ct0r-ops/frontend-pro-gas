import { useState, useMemo } from "react";
import { FileDown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { descargarPdfHistorial } from "@/services/mediasCargas";
import type { HistorialAuditoria } from "@/types/api";

interface Props {
  historial: HistorialAuditoria[];
  cargando: boolean;
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFechaDoc(fechaStr: string): string {
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatFechaRegistro(isoStr: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoStr));
}

export default function HistorialTable({ historial, cargando }: Props) {
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroGuia, setFiltroGuia] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [descargando, setDescargando] = useState<Set<number>>(new Set());

  const filtrados = useMemo(() => {
    return historial.filter((item) => {
      const matchProveedor =
        !filtroProveedor ||
        item.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase());
      const matchGuia =
        !filtroGuia ||
        item.numero_guia.toLowerCase().includes(filtroGuia.toLowerCase());
      const matchDesde = !filtroDesde || item.fecha_documento >= filtroDesde;
      const matchHasta = !filtroHasta || item.fecha_documento <= filtroHasta;
      return matchProveedor && matchGuia && matchDesde && matchHasta;
    });
  }, [historial, filtroProveedor, filtroGuia, filtroDesde, filtroHasta]);

  async function handleDescargarPdf(id: number, numeroGuia: string) {
    setDescargando((prev) => new Set(prev).add(id));
    try {
      await descargarPdfHistorial(id, numeroGuia);
    } catch {
      toast.error("No se pudo descargar el PDF");
    } finally {
      setDescargando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de auditoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="filtro-proveedor">Proveedor</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="filtro-proveedor"
                className="pl-8"
                placeholder="Buscar proveedor..."
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-guia">N° Guía</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="filtro-guia"
                className="pl-8"
                placeholder="Buscar N° guía..."
                value={filtroGuia}
                onChange={(e) => setFiltroGuia(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-desde">Desde</Label>
            <Input
              id="filtro-desde"
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-hasta">Hasta</Label>
            <Input
              id="filtro-hasta"
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
            {historial.length === 0
              ? "Aún no hay registros en el historial."
              : "Sin resultados para los filtros aplicados."}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    Fecha doc.
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    Proveedor
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    N° Guía
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    Kilos
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    Neto
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    IVA
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    Bruto
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    Registrado
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                      {formatFechaDoc(item.fecha_documento)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.proveedor}</td>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                      {item.numero_guia}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                      {item.kilos_totales.toLocaleString("es-CL")} kg
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                      {formatCLP(item.total_neto)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                      {formatCLP(item.total_iva)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap font-medium">
                      {formatCLP(item.total_bruto)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground block leading-tight">
                        {item.registrado_por_nombre}
                      </span>
                      <span className="text-xs text-muted-foreground/60 block leading-tight">
                        {formatFechaRegistro(item.fecha_registro)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Descargar PDF"
                        disabled={descargando.has(item.id)}
                        onClick={() => handleDescargarPdf(item.id, item.numero_guia)}
                      >
                        {descargando.has(item.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtrados.length > 0 && (
          <p className="text-xs text-right text-muted-foreground">
            {filtrados.length} de {historial.length} registro{historial.length !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
