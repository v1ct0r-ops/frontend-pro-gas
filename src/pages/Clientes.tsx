import { useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Cliente, ClienteCreate, ClienteUpdate } from "@/types/api";
import { UserPlus, Pencil, Trash2, X } from "lucide-react";

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

type ModoFormulario = "crear" | "editar";

interface FormState {
  rut: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  descuento_pesos_por_kilo: string;
  estado: boolean;
}

const FORM_VACIO: FormState = {
  rut: "",
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  descuento_pesos_por_kilo: "",
  estado: true,
};

export default function Clientes() {
  const { clientes, totalPages, page, setPage, cargando, error, crearCliente, editarCliente, eliminarCliente } =
    useClientes();
  const { hasRole } = useAuth();
  const esSuperAdmin = hasRole("super_admin");

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modo, setModo] = useState<ModoFormulario>("crear");
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [loading, setLoading] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [clienteParaEliminar, setClienteParaEliminar] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);

  function abrirCrear() {
    setModo("crear");
    setClienteEditando(null);
    setForm(FORM_VACIO);
    setErrorForm(null);
    setPanelAbierto(true);
  }

  function abrirEditar(c: Cliente) {
    setModo("editar");
    setClienteEditando(c);
    setForm({
      rut: c.rut,
      nombre: c.nombre,
      email: c.email ?? "",
      telefono: c.telefono ?? "",
      direccion: c.direccion ?? "",
      descuento_pesos_por_kilo: String(c.descuento_pesos_por_kilo ?? 0),
      estado: c.estado,
    });
    setErrorForm(null);
    setPanelAbierto(true);
  }

  function cerrarPanel() {
    setPanelAbierto(false);
    setClienteEditando(null);
    setForm(FORM_VACIO);
    setErrorForm(null);
  }

  function setField<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    if (!form.rut.trim() || !form.nombre.trim()) {
      setErrorForm("RUT y nombre son obligatorios.");
      return;
    }

    const descuento = Math.round(Number(form.descuento_pesos_por_kilo) || 0);
    if (descuento < 0) {
      setErrorForm("El descuento no puede ser negativo.");
      return;
    }

    setLoading(true);
    try {
      if (modo === "crear") {
        const payload: ClienteCreate = {
          rut: form.rut.trim(),
          nombre: form.nombre.trim(),
          descuento_pesos_por_kilo: descuento,
        };
        if (form.email.trim()) payload.email = form.email.trim();
        if (form.telefono.trim()) payload.telefono = form.telefono.trim();
        if (form.direccion.trim()) payload.direccion = form.direccion.trim();
        await crearCliente(payload);
      } else if (clienteEditando) {
        const payload: ClienteUpdate = {
          rut: form.rut.trim(),
          nombre: form.nombre.trim(),
          email: form.email.trim() || null,
          telefono: form.telefono.trim() || null,
          direccion: form.direccion.trim() || null,
          descuento_pesos_por_kilo: descuento,
          estado: form.estado,
        };
        await editarCliente(clienteEditando.id, payload);
      }
      cerrarPanel();
    } catch {
      setErrorForm("Ocurrió un error. Verifica los datos (¿RUT válido?) e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarConfirmar() {
    if (!clienteParaEliminar) return;
    setErrorDialog(null);
    setEliminando(true);
    try {
      await eliminarCliente(clienteParaEliminar.id);
      setClienteParaEliminar(null);
    } catch {
      setErrorDialog("No se pudo eliminar el cliente. Intenta nuevamente.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maestro de clientes revendedores
          </p>
        </div>
        {esSuperAdmin && (
          <Button onClick={abrirCrear} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        )}
      </div>

      {/* Panel de formulario */}
      {panelAbierto && (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {modo === "crear" ? "Crear cliente" : "Editar cliente"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={cerrarPanel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={form.rut}
                    onChange={(e) => setField("rut", e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre / razón social</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setField("nombre", e.target.value)}
                    placeholder="Distribuciones Ejemplo SpA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="cliente@empresa.cl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => setField("telefono", e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={form.direccion}
                    onChange={(e) => setField("direccion", e.target.value)}
                    placeholder="Av. Siempre Viva 123"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="descuento">Descuento ($ por kg)</Label>
                  <Input
                    id="descuento"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={form.descuento_pesos_por_kilo}
                    onChange={(e) => setField("descuento_pesos_por_kilo", e.target.value)}
                    placeholder="0"
                    className="text-right tabular-nums"
                  />
                </div>
                {modo === "editar" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="estado">Estado</Label>
                    <select
                      id="estado"
                      value={form.estado ? "activo" : "inactivo"}
                      onChange={(e) => setField("estado", e.target.value === "activo")}
                      className={SELECT_CLS}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                )}
              </div>

              {errorForm && <p className="text-sm text-destructive">{errorForm}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={cerrarPanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando…" : modo === "crear" ? "Crear cliente" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Cargando clientes…</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay clientes registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">RUT</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Desc. $/kg</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    {esSuperAdmin && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium tabular-nums">{c.rut}</td>
                      <td className="px-4 py-3">{c.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{c.telefono ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.descuento_pesos_por_kilo > 0 ? fmtCLP(c.descuento_pesos_por_kilo) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.estado ? "outline" : "destructive"}>
                          {c.estado ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      {esSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEditar(c)}
                              aria-label={`Editar ${c.nombre}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setErrorDialog(null);
                                setClienteParaEliminar(c);
                              }}
                              aria-label={`Eliminar ${c.nombre}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Confirmación de soft-delete */}
      <AlertDialog
        open={clienteParaEliminar !== null}
        onOpenChange={(open) => {
          if (!open && !eliminando) setClienteParaEliminar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-sm">
                {clienteParaEliminar && (
                  <p className="text-muted-foreground">
                    Se dará de baja a <strong>{clienteParaEliminar.nombre}</strong>{" "}
                    <span className="tabular-nums">({clienteParaEliminar.rut})</span>. Dejará de
                    aparecer en las búsquedas, pero su historial se conserva.
                  </p>
                )}
                {errorDialog && <p className="text-destructive">{errorDialog}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleEliminarConfirmar();
              }}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
