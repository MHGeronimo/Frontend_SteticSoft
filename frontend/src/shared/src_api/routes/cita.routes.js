// src/routes/cita.routes.js
const express = require("express");
const router = express.Router();
const citaController = require("../controllers/cita.controller.js");
const {
  idValidator,
  crearCitaValidators,
  actualizarCitaValidators,
  cambiarEstadoCitaValidators,
  buscarValidators,
  obtenerDisponibilidadValidators,
} = require("../validators/cita.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR";

// Endpoints de Gestión de Citas (CRUD)
router.get(
  "/mis-citas",
  authMiddleware,
  checkPermission("MODULO_CITAS_CLIENTE"), // Permiso específico para clientes
  citaController.listarMisCitas
);

// Ruta para que un cliente cree su propia cita
router.post(
  "/mis-citas",
  authMiddleware,
  checkPermission("MODULO_CITAS_CLIENTE"),
  crearCitaValidators,
  citaController.crearMiCita
);

// Ruta para que un cliente vea el detalle de una de sus citas
router.get(
  "/mis-citas/:id",
  authMiddleware,
  checkPermission("MODULO_CITAS_CLIENTE"),
  idValidator,
  citaController.obtenerMiCitaPorId
);

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  crearCitaValidators,
  citaController.crearCita
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaController.listarCitas
);

// Endpoint para obtener los estados posibles de una cita
router.get(
  "/estados", // La URL final será /api/citas/estados
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  citaController.obtenerEstadosCita
);

router.get(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  idValidator,
  citaController.obtenerCitaPorId
);

router.patch(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  actualizarCitaValidators,
  citaController.actualizarCita
);

router.patch(
  "/:id/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  cambiarEstadoCitaValidators,
  citaController.cambiarEstadoCita
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  idValidator,
  citaController.eliminarCitaFisica
);

// Endpoints de Consulta para el Formulario
router.get(
  "/novedades/:id/dias-disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  obtenerDisponibilidadValidators,
  citaController.obtenerDiasDisponiblesPorNovedad
);

router.get(
  "/novedades/:id/horas-disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  obtenerDisponibilidadValidators,
  citaController.obtenerHorariosDisponiblesPorNovedad
);

router.get(
  "/novedades/:id/empleados",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  idValidator,
  citaController.obtenerEmpleadosPorNovedad
);

router.get(
  "/clientes",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  buscarValidators,
  citaController.buscarClientes
);

router.get(
  "/servicios",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  buscarValidators,
  citaController.obtenerServiciosDisponibles
);

module.exports = router;
