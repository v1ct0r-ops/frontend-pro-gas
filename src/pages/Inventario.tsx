import { Loader2, RefreshCw } from "lucide-react";
import { useInventario } from "@/hooks/useInventario";
import { Button } from "@/components/ui/button";
import InventarioGrid from "@/components/InventarioGrid";

export default function Inventario() {
  const { productos, cargando, error, refetch } = useInventario();

  // Carga inicial
  if (cargando && productos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error al cargar — muestra mensaje y opción de reintentar
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive text-center">{error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Encabezado con contador de formatos y botón de actualizar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {productos.length} formato{productos.length !== 1 ? "s" : ""} de cilindro
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={cargando}>
          <RefreshCw className={`mr-2 h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Grilla de tarjetas — refetch se propaga para sincronizar tras ajustes o medias cargas */}
      <InventarioGrid productos={productos} refetch={refetch} />
    </div>
  );
}
