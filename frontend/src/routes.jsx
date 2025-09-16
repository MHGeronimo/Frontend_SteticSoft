// src/routes.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Link, Navigate } from "react-router-dom";

// Layouts
import AdminSidebar from "./shared/components/layout/AdminSidebar";
import Navbar from "./shared/components/layout/Navbar";

// Contexto y Rutas Privadas
import PrivateRoute from "./shared/components/auth/PrivateRoute";

// ---- Páginas Públicas ------
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./features/auth";
import { HomePage, PublicProductosPage, PublicServiciosPage, NovedadesPage } from './features/home';

// ---- Páginas de Administrador ------
import { DashboardPage } from './features/dashboard';
import { ListaRolesPage } from './features/roles';
import { ListaUsuariosPage } from "./features/usuarios";
import { ListaAbastecimientoPage } from './features/abastecimiento';
import { ListaClientesPage } from "./features/clientes";
import { ListaProveedoresPage } from "./features/proveedores";
import { ListaCategoriasProductoPage } from './features/categoriasProductoAdmin';
import { ListaProductosAdminPage } from "./features/productosAdmin";
import { ListaServiciosAdminPage } from "./features/serviciosAdmin";
import { ListaCategoriasServicioPage } from "./features/categoriasServicioAdmin";
import { CalendarioCitasPage, AgendarCitaPage } from './features/citas';
import { ConfigHorariosPage } from "./features/novedades";
import { ListaComprasPage, FormCompraPage } from "./features/compras";
import { ListaVentasPage, ProcesoVentaPage } from "./features/ventas";

// --- Componentes de Layout ---

const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const AdminLayout = () => (
  <div className="admin-page-layout">
    <AdminSidebar />
    <main className="admin-main-content-area">
      <Outlet />
    </main>
  </div>
);

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<PublicProductosPage />} />
          <Route path="/servicios" element={<PublicServiciosPage />} />
          <Route path="/novedades-publicas" element={<NovedadesPage />} />
        </Route>

        {/* Autenticación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* --- ESTRUCTURA UNIFICADA DE RUTAS DE ADMINISTRADOR --- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route element={<PrivateRoute requiredPermission="MODULO_DASHBOARD_VER" />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_ROLES_GESTIONAR" />}>
            <Route path="roles" element={<ListaRolesPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_USUARIOS_GESTIONAR" />}>
            <Route path="usuarios" element={<ListaUsuariosPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_ABASTECIMIENTOS_GESTIONAR" />}>
            <Route path="abastecimiento" element={<ListaAbastecimientoPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_CLIENTES_GESTIONAR" />}>
            <Route path="clientes" element={<ListaClientesPage />} />
          </Route>
          
          <Route element={<PrivateRoute requiredPermission="MODULO_PROVEEDORES_GESTIONAR" />}>
            <Route path="proveedores" element={<ListaProveedoresPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR" />}>
            <Route path="categorias-producto" element={<ListaCategoriasProductoPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_PRODUCTOS_GESTIONAR" />}>
            <Route path="productos-admin" element={<ListaProductosAdminPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_SERVICIOS_GESTIONAR" />}>
            <Route path="servicios-admin" element={<ListaServiciosAdminPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_CATEGORIAS_SERVICIOS_GESTIONAR" />}>
            <Route path="categorias-servicio" element={<ListaCategoriasServicioPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_CITAS_GESTIONAR" />}>
            <Route path="citas" element={<CalendarioCitasPage />} />
            <Route path="/admin/citas/agendar" element={<AgendarCitaPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_NOVEDADES_EMPLEADOS_GESTIONAR" />}>
            <Route path="horarios" element={<ConfigHorariosPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_COMPRAS_GESTIONAR" />}>
            <Route path="compras" element={<ListaComprasPage />} />
            <Route path="compras/agregar" element={<FormCompraPage />} />
          </Route>

          <Route element={<PrivateRoute requiredPermission="MODULO_VENTAS_GESTIONAR" />}>
            <Route path="ventas" element={<ListaVentasPage />} />
            <Route path="ventas/proceso" element={<ProcesoVentaPage />} />
          </Route>
        </Route>

        {/* Ruta para páginas no encontradas */}
        <Route path="*" element={<div><h2>Página no encontrada (404)</h2><Link to="/">Ir al Inicio</Link></div>} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;