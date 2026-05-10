import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inventario from "@/pages/Inventario";
import MediasCargas from "@/pages/MediasCargas";
import Bitacora from "@/pages/Bitacora";
import CierresDiarios from "@/pages/CierresDiarios";
import VentasRevendedor from "@/pages/VentasRevendedor";
import Usuarios from "@/pages/Usuarios";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Todas las rutas protegidas viven dentro del layout con sidebar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/medias-cargas" element={<MediasCargas />} />
          <Route path="/bitacora" element={<Bitacora />} />
          <Route path="/cierres-diarios" element={<CierresDiarios />} />
          
          {/* Rutas exclusivas de super_admin */}
          <Route element={<ProtectedRoute requiredRole="super_admin" />}>
            <Route path="/ventas-revendedor" element={<VentasRevendedor />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
