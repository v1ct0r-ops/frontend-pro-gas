import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { buscarClientes } from "@/services/clientes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Cliente } from "@/types/api";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

interface ClienteAutocompleteProps {
  onSelect: (cliente: Cliente) => void;
}

export function ClienteAutocomplete({ onSelect }: ClienteAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [abierto, setAbierto] = useState(false);

  // Identifica la última request emitida para descartar respuestas obsoletas.
  const requestIdRef = useRef(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Debounce + búsqueda con descarte de respuestas obsoletas.
  useEffect(() => {
    const texto = query.trim();
    if (texto.length < MIN_CHARS) {
      setResultados([]);
      setCargando(false);
      setError(false);
      return;
    }

    const id = ++requestIdRef.current;
    const controller = new AbortController();
    setCargando(true);
    setError(false);

    const timer = setTimeout(async () => {
      try {
        const data = await buscarClientes(texto, 10, controller.signal);
        if (id !== requestIdRef.current) return; // llegó tarde: descartar
        setResultados(data);
        setAbierto(true);
      } catch {
        if (controller.signal.aborted || id !== requestIdRef.current) return;
        setError(true);
        setResultados([]);
        setAbierto(true);
      } finally {
        if (id === requestIdRef.current) setCargando(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Cerrar el dropdown al hacer click fuera.
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function handleSelect(cliente: Cliente) {
    onSelect(cliente);
    setQuery("");
    setResultados([]);
    setAbierto(false);
    requestIdRef.current++; // invalida cualquier request en vuelo
  }

  function limpiar() {
    setQuery("");
    setResultados([]);
    setError(false);
    setAbierto(false);
    requestIdRef.current++;
  }

  const textoLimpio = query.trim();
  const mostrarSinResultados =
    abierto && !cargando && !error && textoLimpio.length >= MIN_CHARS && resultados.length === 0;

  return (
    <div className="flex flex-col gap-1.5" ref={contenedorRef}>
      <Label htmlFor="buscar-cliente">Buscar cliente del maestro (opcional)</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id="buscar-cliente"
          autoComplete="off"
          placeholder="RUT o nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (resultados.length > 0 || error) setAbierto(true);
          }}
          className="pl-9 pr-9"
        />
        {cargando ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={limpiar}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {abierto && (resultados.length > 0 || mostrarSinResultados || error) && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-64 overflow-y-auto">
            {error ? (
              <p className="px-3 py-2.5 text-sm text-destructive">
                No se pudo buscar. Puedes ingresar los datos a mano.
              </p>
            ) : mostrarSinResultados ? (
              <p className="px-3 py-2.5 text-sm text-muted-foreground">
                Sin resultados. Ingresa el cliente manualmente abajo.
              </p>
            ) : (
              resultados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{c.nombre}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{c.rut}</span>
                  </span>
                  {c.descuento_pesos_por_kilo > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {new Intl.NumberFormat("es-CL").format(c.descuento_pesos_por_kilo)} $/kg
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Elegir un cliente rellena RUT, nombre y descuento. Igual puedes editarlos a mano.
      </p>
    </div>
  );
}
