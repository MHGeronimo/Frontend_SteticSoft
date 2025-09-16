// src/validators/auth.validators.js
const { body } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Expresiones Regulares para Validación Estricta ---
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const numericOnlyRegex = /^\d+$/;
const alphanumericRegex = /^[a-zA-Z0-9]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const addressRegex = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\-_]+$/;

const registrarUsuarioValidators = [
  // --- Campos de Usuario (Cuenta) ---
  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido.")
    .matches(emailRegex).withMessage("El correo electrónico no tiene un formato válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("El correo electrónico ya está registrado para una cuenta.");
      }
    }),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres.")
    .matches(passwordRegex).withMessage(
      "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial."
    ),

  // --- Campos de Cliente (Perfil) ---
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio.")
    .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),
  body("apellido")
    .trim()
    .notEmpty().withMessage("El apellido es obligatorio.")
    .isLength({ min: 2, max: 100 }).withMessage("El apellido debe tener entre 2 y 100 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),
  body("telefono")
    .trim()
    .notEmpty().withMessage("El teléfono es obligatorio.")
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números."),
  body("tipoDocumento")
    .trim()
    .notEmpty().withMessage("El tipo de documento es obligatorio.")
    .isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"])
    .withMessage("El tipo de documento no es válido."),
  body("numeroDocumento")
    .trim()
    .notEmpty().withMessage("El número de documento es obligatorio.")
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres.")
    .custom((value, { req }) => {
      const docType = req.body.tipoDocumento;
      if (docType === "Cédula de Ciudadanía" || docType === "Tarjeta de Identidad" || docType === "Cédula de Extranjería") {
        if (!numericOnlyRegex.test(value)) { throw new Error("Para este tipo de documento, ingrese solo números."); }
      } else if (docType === "Pasaporte") {
        if (!alphanumericRegex.test(value)) { throw new Error("Para Pasaporte, ingrese solo letras y números."); }
      }
      return true;
    })
    .custom(async (value) => {
      const clienteExistente = await db.Cliente.findOne({ where: { numeroDocumento: value } });
      if (clienteExistente) {
        return Promise.reject("El número de documento ya está registrado para otro cliente.");
      }
    }),
  body("fechaNacimiento")
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      if (age < 18) { throw new Error("El usuario debe ser mayor de 18 años."); }
      return true;
    })
    .toDate(),
  body("direccion")
    .trim()
    .notEmpty().withMessage("La dirección es obligatoria.")
    .isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.")
    .matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),
  handleValidationErrors,
];

const loginValidators = [
  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("Debe ser un correo electrónico válido.")
    .normalizeEmail(),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria."),
  handleValidationErrors,
];

const solicitarRecuperacionValidators = [
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio para la recuperación.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
  handleValidationErrors,
];

const resetearContrasenaValidators = [
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
  body("token")
    .trim()
    .notEmpty()
    .withMessage("El código de recuperación es obligatorio.")
    .isNumeric()
    .withMessage("El código debe ser numérico.")
    .isLength({ min: 6, max: 6 })
    .withMessage("El código debe tener exactamente 6 dígitos."),
  body("nuevaContrasena")
    .notEmpty()
    .withMessage("La nueva contraseña es obligatoria.")
    .isString()
    .withMessage("La nueva contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
  body("confirmarNuevaContrasena")
    .notEmpty()
    .withMessage("La confirmación de la nueva contraseña es obligatoria.")
    .custom((value, { req }) => {
      if (value !== req.body.nuevaContrasena) {
        throw new Error(
          "La confirmación de la contraseña no coincide con la nueva contraseña."
        );
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  registrarUsuarioValidators,
  loginValidators,
  solicitarRecuperacionValidators,
  resetearContrasenaValidators,
};