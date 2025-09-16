// src/routes/index.js
const express = require("express");
const router = express.Router();

// Importar las rutas de las entidades
const rolRoutes = require("./rol.routes.js");
const permisoRoutes = require("./permiso.routes.js");
const usuarioRoutes = require("./usuario.routes.js"); 
const authRoutes = require("./auth.routes.js"); 
const estadoRoutes = require("./estado.routes.js");
const clienteRoutes = require("./cliente.routes.js");
const empleadoRoutes = require("./empleado.routes.js");
const especialidadRoutes = require("./especialidad.routes.js");
const proveedorRoutes = require("./proveedor.routes.js");
const categoriaProductoRoutes = require("./categoriaProducto.routes.js");
const categoriaServicioRoutes = require("./categoriaServicio.routes.js");
const productoRoutes = require("./producto.routes.js");
const compraRoutes = require("./compra.routes.js");
const ventaRoutes = require("./venta.routes.js");
const citaRoutes = require("./cita.routes.js");
const servicioRoutes = require("./servicio.routes.js");
const abastecimientoRoutes = require("./abastecimiento.routes.js");
const novedadesRoutes = require("./novedades.routes.js");
const dashboardRoutes = require("./dashboard.routes.js");

// ... y así para otras entidades

// Montar las rutas de las entidades en el router principal
router.use("/auth", authRoutes); 
router.use("/dashboard", dashboardRoutes);
router.use("/roles", rolRoutes);
router.use("/permisos", permisoRoutes);
router.use("/usuarios", usuarioRoutes); 
router.use("/estados", estadoRoutes);
router.use("/clientes", clienteRoutes);
router.use("/empleados", empleadoRoutes);
router.use("/especialidades", especialidadRoutes);
router.use("/proveedores", proveedorRoutes);
router.use("/categorias-producto", categoriaProductoRoutes);
router.use("/categorias-servicio", categoriaServicioRoutes);
router.use("/productos", productoRoutes);
router.use("/compras", compraRoutes);
router.use("/ventas", ventaRoutes);
router.use("/citas", citaRoutes);
router.use("/servicios", servicioRoutes);
router.use("/abastecimientos", abastecimientoRoutes);
router.use("/novedades", novedadesRoutes);
router.use("/api/movil", require("./mobile.routes"));
// ...

router.get("/", (req, res) => {
  res.status(200).json({
    message: "API de SteticSoft V1 - Punto de entrada /api funcionando.",
    status: "ok",
  });
});

module.exports = router;
