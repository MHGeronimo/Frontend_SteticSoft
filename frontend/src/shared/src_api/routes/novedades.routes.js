const express = require("express");
const router = express.Router();
const novedadesController = require("../controllers/novedades.controller.js");
const novedadesValidators = require("../validators/novedades.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const { checkPermission } = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR";
const PERMISO_MODULO_NOVEDADES = "MODULO_NOVEDADES_EMPLEADOS_GESTIONAR";

// --- ENDPOINTS PÚBLICOS ---

// Devuelve solo las novedades activas para la pantalla de inicio de la app móvil
router.get(
  "/public",
  novedadesController.listarNovedadesPublicas
);

// --- ENDPOINTS DE SOPORTE PARA OTROS MÓDULOS ---

// Devuelve solo las novedades activas para el formulario de citas.
router.get(
  "/agendables",
  authMiddleware,
  checkPermission("MODULO_CITAS_CLIENTE"),
  novedadesController.listarNovedadesAgendables
);

// Devuelve los días disponibles de una novedad. ✅ Validador añadido.
router.get(
  "/:idNovedad/dias-disponibles", 
  authMiddleware, 
  checkPermission(PERMISO_MODULO_CITAS), 
  novedadesValidators.idNovedadValidator,
  novedadesController.listarDiasDisponibles
);

// Devuelve las horas disponibles de una novedad. ✅ Validador añadido.
router.get(
  "/:idNovedad/horas-disponibles", 
  authMiddleware, 
  checkPermission(PERMISO_MODULO_CITAS), 
  novedadesValidators.idNovedadValidator,
  novedadesController.listarHorasDisponibles
);

// Devuelve los empleados de una novedad. ✅ Validador añadido.
router.get(
  "/:idNovedad/empleados", 
  authMiddleware, 
  checkPermission(PERMISO_MODULO_CITAS), 
  novedadesValidators.idNovedadValidator,
  novedadesController.listarEmpleadosPorNovedad
);

// Devuelve todos los usuarios con rol "Empleado" para el formulario de novedades.
router.get(
  "/empleados-disponibles",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesController.listarEmpleadosParaAsignar
);


// --- RUTAS CRUD PARA GESTIÓN DE NOVEDADES ---

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.crearNovedadValidators,
  novedadesController.crearNovedad
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesController.listarNovedades
);

router.get(
  "/:idNovedad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.idNovedadValidator,
  novedadesController.obtenerNovedadPorId
);

router.patch(
  "/:idNovedad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.actualizarNovedadValidators,
  novedadesController.actualizarNovedad
);

router.patch(
  "/:idNovedad/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.cambiarEstadoNovedadValidators,
  novedadesController.cambiarEstadoNovedad
);

router.delete(
  "/:idNovedad",
  authMiddleware,
  checkPermission(PERMISO_MODULO_NOVEDADES),
  novedadesValidators.idNovedadValidator,
  novedadesController.eliminarNovedadFisica
);

module.exports = router;

