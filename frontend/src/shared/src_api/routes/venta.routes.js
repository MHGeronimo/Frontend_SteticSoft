// src/routes/venta.routes.js
const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/venta.controller.js");
const ventaValidators = require("../validators/venta.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_VENTAS = "MODULO_VENTAS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission("MODULO_VENTAS_CLIENTE"),
  ventaValidators.crearVentaValidators,
  ventaController.crearVenta
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaController.listarVentas
);

router.get(
  "/:idVenta",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.idVentaValidator,
  ventaController.obtenerVentaPorId
);

// Ruta para actualizar estado del proceso
router.put(
  "/:idVenta/estado-proceso",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.actualizarEstadoProcesoVentaValidators,
  ventaController.actualizarEstadoVenta
);

// NUEVA RUTA: Cambiar solo el estado booleano general de una venta
router.patch(
  "/:idVenta/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.cambiarEstadoVentaValidators,
  ventaController.cambiarEstadoGeneralVenta
);

router.patch(
  "/:idVenta/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.idVentaValidator,
  ventaController.anularVenta
);

router.patch(
  "/:idVenta/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.idVentaValidator,
  ventaController.habilitarVenta
);

router.delete(
  "/:idVenta",
  authMiddleware,
  checkPermission(PERMISO_MODULO_VENTAS),
  ventaValidators.idVentaValidator,
  ventaController.eliminarVentaFisica
);

router.get(
  "/movil/mis-ventas",
  authMiddleware,
  ventaController.listarVentasClienteMovil
);

router.get(
  "/movil/:idVenta",
  authMiddleware,
  ventaValidators.idVentaValidator,
  ventaController.obtenerVentaPorIdClienteMovil
);

module.exports = router;