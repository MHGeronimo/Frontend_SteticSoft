const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Validador para CREAR un producto ---
const crearProductoValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del producto es obligatorio.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(/^[\w\sáéíóúÁÉÍÓÚñÑ-]+$/).withMessage("El nombre contiene caracteres inválidos."),

  body("descripcion")
    .trim()
    .notEmpty().withMessage("La descripción es obligatoria.")
    .isLength({ max: 300 }).withMessage("La descripción no puede superar los 300 caracteres."),

    body("tipoUso")
    .notEmpty().withMessage("El tipo de uso es obligatorio.")
    .isIn(["Interno", "Externo"]).withMessage("El tipo de uso debe ser 'Interno' o 'Externo'."),
  body("precio")
    .trim()
    .notEmpty().withMessage("El precio es obligatorio.")
    .toFloat()
    .isFloat({ gt: 0 }).withMessage("El precio debe ser un número mayor que cero."),

  body("vidaUtilDias")
    .notEmpty().withMessage("La vida útil es obligatoria.")
    .toInt()
    .isInt({ gt: 0 }).withMessage("La vida útil debe ser un número entero mayor que cero."),

  body("existencia")
  .notEmpty().withMessage("La existencia es obligatoria.")
  .toInt()
  .isInt({ min: 0 }).withMessage("La existencia debe ser un número entero no negativo."),


  body("stockMinimo")
    .trim()
    .notEmpty().withMessage("El stock mínimo es obligatorio.")
    .toInt()
    .isInt({ min: 0 }).withMessage("El stock mínimo debe ser un número entero no negativo."),

  body("stockMaximo")
    .trim()
    .notEmpty().withMessage("El stock máximo es obligatorio.")
    .toInt()
    .isInt({ min: 0 }).withMessage("El stock máximo debe ser un número entero no negativo.")
    .custom((value, { req }) => {
      if (parseInt(value) < parseInt(req.body.stockMinimo)) {
        throw new Error("El stock máximo no puede ser menor que el stock mínimo.");
      }
      return true;
    }),

  // Imagen: opcional, pero validamos tipo y tamaño si se incluye
  body("imagen")
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error("El formato de imagen no es válido.");
        }
        if (req.file.size > 2 * 1024 * 1024) {
          throw new Error("La imagen no debe superar los 2MB.");
        }
      }
      return true;
    }),

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR un producto ---
const actualizarProductoValidators = [
  param("idProducto").isInt({ gt: 0 }).withMessage("ID de producto inválido."),

    body("nombre")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre del producto no puede estar vacío.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(/^[\w\sáéíóúÁÉÍÓÚñÑ-]+$/).withMessage("El nombre contiene caracteres inválidos."),

  body("descripcion")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 300 }),

  body("tipoUso")
    .optional()
    .isIn(["Interno", "Externo"]).withMessage("El tipo de uso debe ser 'Interno' o 'Externo'."),

  body("vidaUtilDias")
    .optional()
    .toInt()
    .isInt({ gt: 0 }).withMessage("La vida útil debe ser un número entero mayor que cero."),

  body("precio")
    .optional()
    .toFloat()
    .isFloat({ gt: 0 }),

  body("existencia")
    .optional()
    .toInt()
    .isInt({ min: 0 }),

  body("stockMinimo")
    .optional()
    .toInt()
    .isInt({ min: 0 }),

  body("stockMaximo")
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .custom((value, { req }) => {
      if (req.body.stockMinimo && parseInt(value) < parseInt(req.body.stockMinimo)) {
        throw new Error("El stock máximo no puede ser menor que el stock mínimo.");
      }
      return true;
    }),

  body("imagen")
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error("El formato de imagen no es válido.");
        }
        if (req.file.size > 2 * 1024 * 1024) {
          throw new Error("La imagen no debe superar los 2MB.");
        }
      }
      return true;
    }),

  handleValidationErrors,
];

const idProductoValidator = [
  param("idProducto")
    .isInt({ gt: 0 })
    .withMessage("El ID del producto debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoProductoValidators = [
  param("idProducto").isInt({ gt: 0 }).withMessage("ID de producto inválido."),
  body("estado")
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano."),
  handleValidationErrors,
];

module.exports = {
  crearProductoValidators,
  actualizarProductoValidators,
  idProductoValidator,
  cambiarEstadoProductoValidators,
};
