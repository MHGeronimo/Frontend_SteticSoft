// src/routes/cliente.routes.js  
const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/cliente.controller.js");
const clienteValidators = require("../validators/cliente.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CLIENTES = "MODULO_CLIENTES_GESTIONAR";
const PERMISO_MODULO_CITAS = "MODULO_CITAS_GESTIONAR"; // Quien agenda citas necesita buscar clientes

// Ruta para que un cliente obtenga su propio perfil
router.get(
  "/me",
  authMiddleware,
  clienteController.getMiPerfil
);

// Ruta para que un cliente actualice su propio perfil
router.put(
  "/me",
  authMiddleware,
  clienteValidators.updateMiPerfilValidators,
  clienteController.updateMiPerfil
);

router.get(
  "/buscar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CITAS),
  clienteController.buscarClientes // Necesitaremos crear esta función en el controlador
);

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.clienteCreateValidators,
  clienteController.crearCliente
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteController.listarClientes
);

router.get(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.obtenerClientePorId
);

router.get(
  "/todos",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteController.obtenerTodosLosClientes
);

router.put(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.clienteUpdateValidators,
  clienteController.actualizarCliente
);

// NUEVA RUTA: Cambiar el estado de un cliente
router.patch(
  "/:idCliente/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.cambiarEstadoClienteValidators,
  clienteController.cambiarEstadoCliente
);

router.patch(
  "/:idCliente/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.anularCliente
);

router.patch(
  "/:idCliente/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.habilitarCliente
);

router.delete(
  "/:idCliente",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CLIENTES),
  clienteValidators.idClienteValidator,
  clienteController.eliminarClienteFisico
);

module.exports = router;
