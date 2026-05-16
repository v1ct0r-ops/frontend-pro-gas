import { useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VENTAS_REVENDEDOR_LIMIT } from "@/hooks/useVentasRevendedor";
import type { VentaRevendedor, VentasRevendedorListParams } from "@/types/api";

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  ventas: VentaRevendedor[];
  total: number;
  pagina: number;
  totalPages: number;
  cargando: boolean;
  onPageChange: (page: number) => void;
  onBuscar: (filtros: VentasRevendedorListParams) => void;
  onEditar: (venta: VentaRevendedor) => void;
  onEliminar: (venta: VentaRevendedor) => void;
  onDescargarPdf: (id: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VentasRevendedorTable({
  ventas,
  total,
  pagina,
  totalPages,
  cargando,
  onPageChange,
  onBuscar,
  onEditar,
  onEliminar,
  onDescargarPdf,
}: Props) {
  const { hasRole } = useAuth();
  const esSuperAdmin = hasRole("super_admin");

  // ── Estado local del formulario de filtros ────────────────────────────────
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [filtroRut, setFiltroRut] = useState("");

  function aplicarFiltros() {
    onBuscar({
      fecha_desde: filtroDesde ? `${filtroDesde}T00:00:00` : undefined,
      fecha_hasta: filtroHasta ? `${filtroHasta}T23:59:59` : undefined,
      rut_cliente: filtroRut.trim() || undefined,
    });
  }

  function limpiarFiltros() {
    setFiltroDesde("");
    setFiltroHasta("");
    setFiltroRut("");
    onBuscar({});
  }

  const inicio = (pagina - 1) * VENTAS_REVENDEDOR_LIMIT + 1;
  const fin = Math.min(pagina * VENTAS_REVENDEDOR_LIMIT, total);

  return (
    <div className="flex flex-col gap-3">

      {/* ── Barra de filtros ─────────────────────────────────────────────── */}
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
          <Label className="text-xs">RUT cliente</Label>
          <Input
            placeholder="Buscar…"
            value={filtroRut}
            onChange={(e) => setFiltroRut(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
            className="h-8 text-sm w-36"
          />
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

      {/* ── Estado de carga / vacío ──────────────────────────────────────── */}
      {cargando && ventas.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !cargando && ventas.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay ventas que coincidan con los filtros.
        </p>
      ) : (
        <>
          {/* ── Tabla ──────────────────────────────────────────────────── */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                    Fecha venta
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap">
                    Kilos
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap">
                    Neto
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap">
                    Descuento
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap">
                    Total bruto
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ventas.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-muted/30">

                    {/* Fecha */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-medium">{formatFecha(v.fecha)}</span>
                      <span className="block text-xs text-muted-foreground">
                        Reg. {formatFechaCorta(v.created_at)}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{v.nombre_cliente}</span>
                      <span className="block text-xs text-muted-foreground">{v.rut_cliente}</span>
                    </td>

                    {/* Kilos */}
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
                        v.kilos_totales
                      )}{" "}
                      kg
                    </td>

                    {/* Neto */}
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {formatCLP(v.total_neto)}
                    </td>

                    {/* Descuento */}
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {v.monto_descuento_total > 0 ? (
                        <span className="text-destructive">
                          − {formatCLP(v.monto_descuento_total)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Total bruto */}
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold whitespace-nowrap">
                      {formatCLP(v.total_bruto)}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        {/* PDF — todos los roles */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onDescargarPdf(v.id)}
                          title="Descargar PDF"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>

                        {/* Editar — solo super_admin */}
                        {esSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onEditar(v)}
                            title="Editar identificación"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Eliminar — solo super_admin */}
                        {esSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                            onClick={() => onEliminar(v)}
                            title="Eliminar venta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total > 0
                ? `${inicio}–${fin} de ${total} venta${total !== 1 ? "s" : ""}`
                : "Sin resultados"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(pagina - 1)}
                disabled={pagina <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 tabular-nums">
                {pagina} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(pagina + 1)}
                disabled={pagina >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
