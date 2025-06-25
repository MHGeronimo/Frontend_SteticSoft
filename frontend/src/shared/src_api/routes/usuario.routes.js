// src/routes/usuario.routes.js
const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario.controller.js");
const usuarioValidators = require("../validators/usuario.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_USUARIOS = "MODULO_USUARIOS_GESTIONAR";

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.crearUsuarioValidators,
  usuarioController.crearUsuario
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioController.listarUsuarios
);

router.get(
  "/:idUsuario",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.idUsuarioValidator,
  usuarioController.obtenerUsuarioPorId
);

router.put(
  "/:idUsuario",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.actualizarUsuarioValidators,
  usuarioController.actualizarUsuario
);

// NUEVA RUTA: Cambiar el estado de un usuario
router.patch(
  "/:idUsuario/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.cambiarEstadoUsuarioValidators,
  usuarioController.cambiarEstadoUsuario
);

router.patch(
  "/:idUsuario/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.idUsuarioValidator,
  usuarioController.anularUsuario
);

router.patch(
  "/:idUsuario/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.idUsuarioValidator,
  usuarioController.habilitarUsuario
);

router.delete(
  "/:idUsuario",
  authMiddleware,
  checkPermission(PERMISO_MODULO_USUARIOS),
  usuarioValidators.idUsuarioValidator,
  usuarioController.eliminarUsuarioFisico
);

// Ruta para verificar la unicidad del correo
router.post(
  "/verificar-correo",
  // authMiddleware, // Podría ser necesario si solo usuarios logueados pueden verificar, o abierto si es para registro.
                     // Por ahora, lo dejaré abierto para flexibilidad en formularios de creación.
  usuarioValidators.verificarCorreoUnicoValidators,
  usuarioController.verificarCorreoUnicoController
);

module.exports = router;
