import { useState } from "react";
import { toast } from "sonner";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pagination } from "@/components/ui/Pagination";
import type { Rol, Usuario, UsuarioCreate, UsuarioUpdate } from "@/types/api";
import { UserPlus, Pencil, X, UserX, UserCheck, Trash2 } from "lucide-react";

const ROLES: Rol[] = ["operador", "super_admin"];

type ModoFormulario = "crear" | "editar";

interface FormState {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  estado: boolean;
}

const FORM_VACIO: FormState = {
  nombre: "",
  email: "",
  password: "",
  rol: "operador",
  estado: true,
};

export default function Usuarios() {
  const {
    usuarios,
    totalPages,
    page,
    setPage,
    cargando,
    error,
    crearUsuario,
    editarUsuario,
    eliminarUsuario,
    toggleEstado,
    extractBackendMessage,
  } = useUsuarios();
  const { user, hasRole } = useAuth();
  const esSuperAdmin = hasRole("super_admin");

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modo, setModo] = useState<ModoFormulario>("crear");
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [loading, setLoading] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [loadingAccion, setLoadingAccion] = useState<number | null>(null);

  function abrirCrear() {
    setModo("crear");
    setUsuarioEditando(null);
    setForm(FORM_VACIO);
    setErrorForm(null);
    setPanelAbierto(true);
  }

  function abrirEditar(u: Usuario) {
    setModo("editar");
    setUsuarioEditando(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol,
      estado: u.estado,
    });
    setErrorForm(null);
    setPanelAbierto(true);
  }

  function cerrarPanel() {
    setPanelAbierto(false);
    setUsuarioEditando(null);
    setForm(FORM_VACIO);
    setErrorForm(null);
  }

  function setField<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    if (!form.nombre.trim() || !form.email.trim()) {
      setErrorForm("Nombre y email son obligatorios.");
      return;
    }
    if (modo === "crear" && !form.password.trim()) {
      setErrorForm("La contraseña es obligatoria al crear un usuario.");
      return;
    }

    setLoading(true);
    try {
      if (modo === "crear") {
        const payload: UsuarioCreate = {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rol: form.rol,
        };
        await crearUsuario(payload);
      } else if (usuarioEditando) {
        const payload: UsuarioUpdate = {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol: form.rol,
          estado: form.estado,
        };
        if (form.password.trim() !== "") {
          payload.password = form.password;
        }
        await editarUsuario(usuarioEditando.id, payload);
      }
      cerrarPanel();
    } catch (err: unknown) {
      const backendMsg = extractBackendMessage(err);
      setErrorForm(backendMsg || "Ocurrió un error. Verifica los datos e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleEstado(u: Usuario) {
    setLoadingAccion(u.id);
    try {
      await toggleEstado(u);
      toast.success(u.estado ? `${u.nombre} inhabilitado.` : `${u.nombre} reactivado.`);
    } catch (err: unknown) {
      const backendMsg = extractBackendMessage(err);
      toast.error(backendMsg || "No se pudo cambiar el estado del usuario.");
    } finally {
      setLoadingAccion(null);
    }
  }

  async function handleEliminar() {
    if (!usuarioAEliminar) return;
    setLoadingAccion(usuarioAEliminar.id);
    try {
      await eliminarUsuario(usuarioAEliminar.id);
      toast.success(`Usuario ${usuarioAEliminar.nombre} eliminado.`);
    } catch (err: unknown) {
      const backendMsg = extractBackendMessage(err);
      toast.error(backendMsg || "No se pudo eliminar el usuario.");
    } finally {
      setLoadingAccion(null);
      setUsuarioAEliminar(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de cuentas del sistema
          </p>
        </div>
        {esSuperAdmin && (
          <Button onClick={abrirCrear} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        )}
      </div>

      {panelAbierto && (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {modo === "crear" ? "Crear usuario" : "Editar usuario"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={cerrarPanel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setField("nombre", e.target.value)}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="juan@empresa.cl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    Contraseña
                    {modo === "editar" && (
                      <span className="text-muted-foreground font-normal ml-1">
                        (dejar vacío para no cambiar)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rol">Rol</Label>
                  <select
                    id="rol"
                    value={form.rol}
                    onChange={(e) => setField("rol", e.target.value as Rol)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r === "super_admin" ? "Super Admin" : "Operador"}
                      </option>
                    ))}
                  </select>
                </div>
                {modo === "editar" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="estado">Estado</Label>
                    <select
                      id="estado"
                      value={form.estado ? "activo" : "inactivo"}
                      onChange={(e) => setField("estado", e.target.value === "activo")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                )}
              </div>

              {errorForm && (
                <p className="text-sm text-destructive">{errorForm}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={cerrarPanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando…" : modo === "crear" ? "Crear usuario" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando usuarios…
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    {esSuperAdmin && (
                      <th className="px-4 py-3" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const esMismaSesion = u.id === user?.id;
                    const ocupado = loadingAccion === u.id;
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{u.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.rol === "super_admin" ? "default" : "secondary"}>
                            {u.rol === "super_admin" ? "Super Admin" : "Operador"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.estado ? "outline" : "destructive"}>
                            {u.estado ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        {esSuperAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirEditar(u)}
                                aria-label={`Editar ${u.nombre}`}
                                disabled={ocupado}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleEstado(u)}
                                disabled={esMismaSesion || ocupado}
                                aria-label={u.estado ? `Inhabilitar ${u.nombre}` : `Reactivar ${u.nombre}`}
                                title={esMismaSesion ? "No puedes inhabilitar tu propia cuenta" : undefined}
                              >
                                {u.estado ? (
                                  <UserX className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-emerald-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setUsuarioAEliminar(u)}
                                disabled={esMismaSesion || ocupado}
                                aria-label={`Eliminar ${u.nombre}`}
                                title={esMismaSesion ? "No puedes eliminar tu propia cuenta" : undefined}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AlertDialog
        open={!!usuarioAEliminar}
        onOpenChange={(open) => { if (!open) setUsuarioAEliminar(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a <strong>{usuarioAEliminar?.nombre}</strong> del sistema.
              Si tiene registros asociados, la operación puede ser rechazada por el backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
