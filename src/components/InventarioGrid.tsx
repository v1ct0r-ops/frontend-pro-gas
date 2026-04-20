import { Package } from "lucide-react";
import CilindroCard from "@/components/CilindroCard";
import type { Producto } from "@/types/api";

interface InventarioGridProps {
  productos: Producto[];
  // refetch del hook padre — se pasa a cada tarjeta para sincronizar post-ajuste
  refetch: () => Promise<void>;
}

export default function InventarioGrid({ productos, refetch }: InventarioGridProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No hay productos registrados en inventario.</p>
      </div>
    );
  }

  return (
    // 1 col móvil → 2 sm → 3 lg → 5 xl (una tarjeta por formato en escritorio)
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {productos.map((producto) => (
        <CilindroCard
          key={producto.id}
          producto={producto}
          onAjusteGuardado={refetch}
        />
      ))}
    </div>
  );
}
