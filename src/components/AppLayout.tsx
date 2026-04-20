import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Phone,
  Truck,
  Calculator,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  Flame,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// Módulos visibles para todos los roles autenticados
const NAV_GENERAL = [
  { to: "/dashboard",       label: "Dashboard",           icon: LayoutDashboard },
  { to: "/inventario",      label: "Inventario",          icon: Package         },
  { to: "/bitacora",        label: "Bitácora",            icon: Phone           },
  { to: "/medias-cargas",   label: "Medias Cargas",       icon: Truck           },
  { to: "/cierres-diarios", label: "Cierres Diarios",     icon: Calculator      },
];

// Módulos exclusivos de super_admin
const NAV_ADMIN = [
  { to: "/tratados-comerciales", label: "Contratos",  icon: FileText },
  { to: "/usuarios",             label: "Usuarios",   icon: Users    },
];

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const esSuperAdmin = hasRole("super_admin");

  // Controla el sidebar en móvil
  const [menuAbierto, setMenuAbierto] = useState(false);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Clases para cada link del sidebar
  function claseNavLink({ isActive }: { isActive: boolean }) {
    return [
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    ].join(" ");
  }

  const contenidoSidebar = (
    <div className="flex flex-col h-full">
      {/* Logo / marca */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b">
        <Flame className="h-6 w-6 text-orange-500 shrink-0" />
        <span className="font-bold text-base tracking-tight">Pro-Gas ERP</span>
      </div>

      {/* Links de navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {NAV_GENERAL.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={claseNavLink} onClick={cerrarMenu}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Sección admin — solo super_admin */}
        {esSuperAdmin && (
          <>
            <p className="text-xs text-muted-foreground font-medium px-3 pt-4 pb-1 uppercase tracking-wider">
              Administración
            </p>
            {NAV_ADMIN.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={claseNavLink} onClick={cerrarMenu}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Usuario y logout */}
      <div className="px-3 py-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary uppercase">
              {user?.nombre?.charAt(0) ?? "U"}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-medium truncate">{user?.nombre ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.rol ?? ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar desktop — siempre visible en lg+ ── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card">
        {contenidoSidebar}
      </aside>

      {/* ── Overlay sidebar móvil ── */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={cerrarMenu}
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r shadow-xl",
          "transition-transform duration-200 lg:hidden",
          menuAbierto ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {contenidoSidebar}
      </aside>

      {/* ── Área principal ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar — solo visible en móvil */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b bg-card shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-sm">Pro-Gas ERP</span>
          </div>
        </header>

        {/* Contenido de cada ruta */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
