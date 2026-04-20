import { useState } from "react";
import { Loader2, RefreshCw, Phone, Clock, MapPin, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBitacora } from "@/hooks/useBitacora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LlamadaCreate } from "@/types/api";

// ─── Validación RUT Módulo 11 ─────────────────────────────────────────────────

function validarRut(rut: string): boolean {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase().trim();
  if (clean.length < 2 || !/^\d+[0-9K]$/.test(clean)) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }

  const remainder = 11 - (sum % 11);
  const expected =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return dv === expected;
}

// ─── Utilidades de fecha ──────────────────────────────────────────────────────

function esHoy(fechaIso: string): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  return fechaIso.slice(0, 10) === hoy;
}

function horaLocal(fechaIso: string): string {
  return new Date(fechaIso).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Estado inicial del formulario ────────────────────────────────────────────

const FORM_VACIO = {
  rut: "",
  cliente_nombre: "",
  telefono: "",
  direccion: "",
  detalle_pedido: "",
};

type FormState = typeof FORM_VACIO;
type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Bitacora() {
  const { user } = useAuth();
  const { llamadas, cargando, enviando, errorCarga, errorEnvio, refetch, crearLlamada } =
    useBitacora();

  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<FormErrors>({});

  // Historial de hoy del operador actual
  const historialHoy = llamadas.filter(
    (l) => esHoy(l.fecha_hora) && l.usuario_id === user?.id
  );

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errores[field]) setErrores((prev) => ({ ...prev, [field]: undefined }));
  }

  function validar(): boolean {
    const nuevosErrores: FormErrors = {};

    if (form.rut.trim() && !validarRut(form.rut)) {
      nuevosErrores.rut = "RUT inválido (verifica el dígito verificador)";
    }
    if (!form.cliente_nombre.trim()) nuevosErrores.cliente_nombre = "El nombre es obligatorio";
    if (!form.telefono.trim()) nuevosErrores.telefono = "El teléfono es obligatorio";
    if (!form.direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria";
    if (!form.detalle_pedido.trim()) nuevosErrores.detalle_pedido = "El detalle es obligatorio";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    const payload: LlamadaCreate = {
      cliente_nombre: form.cliente_nombre.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      detalle_pedido: form.detalle_pedido.trim(),
    };

    const ok = await crearLlamada(payload);
    if (ok) setForm(FORM_VACIO);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bitácora de Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registra pedidos y consultas de clientes durante el turno
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Columna izquierda: Formulario ────────────────────────────── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Nuevo registro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* RUT (opcional) */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rut">RUT cliente (opcional)</Label>
                <Input
                  id="rut"
                  placeholder="12.345.678-9"
                  value={form.rut}
                  onChange={(e) => setField("rut", e.target.value)}
                  aria-invalid={!!errores.rut}
                />
                {errores.rut && (
                  <p className="text-xs text-destructive">{errores.rut}</p>
                )}
              </div>

              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cliente_nombre">Nombre *</Label>
                <Input
                  id="cliente_nombre"
                  placeholder="Nombre del cliente"
                  value={form.cliente_nombre}
                  onChange={(e) => setField("cliente_nombre", e.target.value)}
                  aria-invalid={!!errores.cliente_nombre}
                />
                {errores.cliente_nombre && (
                  <p className="text-xs text-destructive">{errores.cliente_nombre}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  inputMode="tel"
                  placeholder="+56 9 1234 5678"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                  aria-invalid={!!errores.telefono}
                />
                {errores.telefono && (
                  <p className="text-xs text-destructive">{errores.telefono}</p>
                )}
              </div>

              {/* Dirección */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  placeholder="Calle, número, sector"
                  value={form.direccion}
                  onChange={(e) => setField("direccion", e.target.value)}
                  aria-invalid={!!errores.direccion}
                />
                {errores.direccion && (
                  <p className="text-xs text-destructive">{errores.direccion}</p>
                )}
              </div>

              {/* Detalle del pedido */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detalle_pedido">Detalle del pedido *</Label>
                <textarea
                  id="detalle_pedido"
                  rows={4}
                  placeholder="Producto, cantidad, instrucciones de entrega…"
                  value={form.detalle_pedido}
                  onChange={(e) => setField("detalle_pedido", e.target.value)}
                  aria-invalid={!!errores.detalle_pedido}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errores.detalle_pedido && (
                  <p className="text-xs text-destructive">{errores.detalle_pedido}</p>
                )}
              </div>

              {errorEnvio && (
                <p className="text-sm text-destructive">{errorEnvio}</p>
              )}

              <Button type="submit" disabled={enviando} className="w-full">
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar llamada
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Columna derecha: Historial del día ───────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Historial de hoy</h2>
              <p className="text-xs text-muted-foreground">
                {historialHoy.length === 0
                  ? "Sin registros aún"
                  : `${historialHoy.length} ${historialHoy.length === 1 ? "llamada" : "llamadas"}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} disabled={cargando}>
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {errorCarga && (
            <p className="text-sm text-destructive">{errorCarga}</p>
          )}

          {cargando && llamadas.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historialHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
              <Phone className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No hay llamadas registradas hoy</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {historialHoy.map((llamada) => (
                <Card key={llamada.id}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">
                          {llamada.cliente_nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {horaLocal(llamada.fecha_hora)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{llamada.telefono}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{llamada.direccion}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t line-clamp-2">
                      {llamada.detalle_pedido}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
