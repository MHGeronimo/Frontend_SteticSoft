// src/routes/empleado.routes.js
const express = require("express");
const router = express.Router();
const empleadoController = require("../controllers/empleado.controller.js");
const empleadoValidators = require("../validators/empleado.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_EMPLEADOS = "MODULO_EMPLEADOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.crearEmpleadoValidators,
  empleadoController.crearEmpleado
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoController.listarEmpleados
);

// Nueva ruta para obtener solo empleados activos
router.get(
  "/activos",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoController.listarEmpleadosActivos
);

// Ruta para que los clientes vean empleados disponibles para citas
router.get(
  "/disponibles",
  authMiddleware,
  checkPermission("MODULO_CITAS_CLIENTE"),
  empleadoController.listarEmpleadosActivos
);

router.get(
  "/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.obtenerEmpleadoPorId
);

router.put(
  "/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.actualizarEmpleadoValidators,
  empleadoController.actualizarEmpleado
);

// NUEVA RUTA: Cambiar el estado de un empleado
router.patch(
  "/:idEmpleado/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.cambiarEstadoEmpleadoValidators,
  empleadoController.cambiarEstadoEmpleado
);

router.patch(
  "/:idEmpleado/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.anularEmpleado
);

router.patch(
  "/:idEmpleado/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.habilitarEmpleado
);

router.delete(
  "/:idEmpleado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.eliminarEmpleadoFisico
);

router.get(
  "/:idEmpleado/especialidades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.idEmpleadoValidator,
  empleadoController.listarEspecialidadesDeEmpleado
);

router.post(
  "/:idEmpleado/especialidades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.gestionarEspecialidadesEmpleadoValidators,
  empleadoController.asignarEspecialidadesAEmpleado
);

router.delete(
  "/:idEmpleado/especialidades",
  authMiddleware,
  checkPermission(PERMISO_MODULO_EMPLEADOS),
  empleadoValidators.gestionarEspecialidadesEmpleadoValidators,
  empleadoController.quitarEspecialidadesDeEmpleado
);

module.exports = router;
