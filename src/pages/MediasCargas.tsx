import { Loader2, RefreshCw } from "lucide-react";
import { useInventario } from "@/hooks/useInventario";
import { Button } from "@/components/ui/button";
import MediasCargaForm from "@/components/medias-cargas/MediasCargaForm";

export default function MediasCargas() {
  const { productos, cargando, error, refetch } = useInventario();

  if (cargando && productos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Medias Cargas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registra entregas de proveedor — el inventario se actualiza automáticamente
        </p>
      </div>

      <div className="max-w-4xl">
        <MediasCargaForm productos={productos} productosLoading={cargando} onSuccess={refetch} />
      </div>
    </div>
  );
}
