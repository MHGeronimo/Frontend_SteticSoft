// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller.js");
const authValidators = require("../validators/auth.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

// POST /api/auth/registrar
router.post(
  "/registrar",
  authValidators.registrarUsuarioValidators,
  authController.registrarUsuario
);

// POST /api/auth/login
router.post(
  "/login",
  authValidators.loginValidators,
  authController.loginUsuario
);

// POST /api/auth/solicitar-recuperacion
router.post(
  "/solicitar-recuperacion",
  authValidators.solicitarRecuperacionValidators,
  authController.solicitarRecuperacionContrasena
);


// POST /api/auth/resetear-contrasena - Resetear la contraseña usando un correo y el código OTP (token)
router.post(
  "/resetear-contrasena",
  authValidators.resetearContrasenaValidators, // Este validador debe ser actualizado
  authController.resetearContrasena
);

// POST /api/auth/logout
router.post("/logout", authController.logoutUsuario);

module.exports = router;
