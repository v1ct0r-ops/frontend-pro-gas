import { ChevronLeft, ChevronRight, FileDown, Loader2, Lock, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CierreDiario, EstadoCuadre } from "@/types/api";
import { CIERRES_LIMIT } from "@/hooks/useCierreDiarios";

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

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── CuadreBadge ─────────────────────────────────────────────────────────────

function CuadreBadge({ estado }: { estado: EstadoCuadre }) {
  const cls: Record<EstadoCuadre, string> = {
    exacto:   "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    faltante: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    sobrante: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  };
  const labels: Record<EstadoCuadre, string> = {
    exacto: "Exacto",
    faltante: "Faltante",
    sobrante: "Sobrante",
  };
  return (
    <Badge variant="outline" className={cls[estado]}>
      {labels[estado]}
    </Badge>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  cierres: CierreDiario[];
  total: number;
  pagina: number;
  totalPages: number;
  cargando: boolean;
  onPageChange: (page: number) => void;
  onEditar: (cierre: CierreDiario) => void;
  onCerrar: (cierre: CierreDiario) => void;
  onEliminar: (cierre: CierreDiario) => void;
  onDescargarPdf: (id: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CierresDiariosTable({
  cierres,
  total,
  pagina,
  totalPages,
  cargando,
  onPageChange,
  onEditar,
  onCerrar,
  onEliminar,
  onDescargarPdf,
}: Props) {
  const { hasRole } = useAuth();
  const esSuperAdmin = hasRole("super_admin");

  const inicio = (pagina - 1) * CIERRES_LIMIT + 1;
  const fin = Math.min(pagina * CIERRES_LIMIT, total);

  if (cargando && cierres.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cargando && cierres.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No hay cierres que coincidan con los filtros.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Fecha turno</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Chofer</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total ventas</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Rendido</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Cuadre</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cierres.map((c) => {
              const rendido = c.efectivo_rendido + c.vouchers_transbank;
              const esEditable = !c.is_closed;

              return (
                <tr key={c.id} className="transition-colors hover:bg-muted/30">
                  {/* Fecha */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-medium">{formatFecha(c.fecha)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatHora(c.fecha)}
                    </span>
                  </td>

                  {/* Chofer */}
                  <td className="px-3 py-2.5">{c.chofer_nombre}</td>

                  {/* Total ventas */}
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {formatCLP(c.total_ventas_calc)}
                  </td>

                  {/* Rendido */}
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatCLP(rendido)}
                  </td>

                  {/* Estado */}
                  <td className="px-3 py-2.5 text-center">
                    {c.is_closed ? (
                      <Badge variant="destructive" className="text-xs">Sellado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                    )}
                  </td>

                  {/* Cuadre */}
                  <td className="px-3 py-2.5 text-center">
                    {c.estado_cuadre ? (
                      <CuadreBadge estado={c.estado_cuadre} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-0.5">
                      {/* PDF — todos los roles */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onDescargarPdf(c.id)}
                        title="Descargar PDF"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>

                      {/* Editar — solo super_admin, solo si abierto */}
                      {esSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onEditar(c)}
                          disabled={!esEditable}
                          title={esEditable ? "Editar cierre" : "Cierre sellado"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Sellar — solo super_admin, solo si abierto */}
                      {esSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700"
                          onClick={() => onCerrar(c)}
                          disabled={!esEditable}
                          title={esEditable ? "Sellar cierre" : "Cierre sellado"}
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Eliminar — solo super_admin, solo si abierto */}
                      {esSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                          onClick={() => onEliminar(c)}
                          disabled={!esEditable}
                          title={esEditable ? "Eliminar cierre" : "Cierre sellado"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total > 0
            ? `${inicio}–${fin} de ${total} cierre${total !== 1 ? "s" : ""}`
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
    </div>
  );
}
