// src/validators/cita.validators.js
const { body, param, query } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");
const moment = require("moment-timezone");

const idValidator = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID debe ser un entero positivo."),
  handleValidationErrors,
];

const crearCitaValidators = [
  body("fechaHora")
    .notEmpty().withMessage("La fecha y hora son obligatorias.")
    .isISO8601().withMessage("El formato de fecha y hora no es válido.")
    .toDate(),

  body("clienteId")
    .notEmpty().withMessage("El ID del cliente es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),

  body("usuarioId") // Corresponde al empleado
    .notEmpty().withMessage("El ID del empleado es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del empleado debe ser un entero positivo."),
  
  body("idServicios")
    .isArray({ min: 1 }).withMessage("Debe seleccionar al menos un servicio."),
  
  body("novedadId")
    .notEmpty().withMessage("El ID de la novedad es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),

  body("estadoCitaId")
    .notEmpty().withMessage("El estado de la cita es obligatorio.")
    .isInt({ gt: 0 }),
    
  handleValidationErrors,
];
const actualizarCitaValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("El formato de fecha debe ser YYYY-MM-DD."),
  body("horaInicio")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("El formato de hora debe ser HH:mm o HH:mm:ss."),
  body("idCliente").optional().isInt({ gt: 0 }),
  body("idUsuario").optional().isInt({ gt: 0 }),
  body("idNovedad").optional().isInt({ gt: 0 }),
  body("servicios").optional().isArray(),
  // --- ✅ CORRECCIÓN AQUÍ ---
  // Se valida 'idEstado' como un número entero positivo, en lugar de 'estado' como texto.
  body("idEstado")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("El ID del estado debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoCitaValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  // --- ✅ CORRECCIÓN AQUÍ ---
  // Se valida 'idEstado' como un número entero requerido.
  body("idEstado")
    .notEmpty()
    .withMessage("El ID del estado es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del estado debe ser un entero positivo."),
  handleValidationErrors,
];

const buscarValidators = [
  query("search")
    .optional()
    .isString()
    .withMessage("El término de búsqueda debe ser un texto.")
    .isLength({ min: 2 })
    .withMessage("El término de búsqueda debe tener al menos 2 caracteres."),
  handleValidationErrors,
];

const obtenerDisponibilidadValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la novedad debe ser un entero positivo."),
  query("mes")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("El mes debe ser un número entre 1 y 12."),
  query("anio")
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage("El año debe ser válido."),
  query("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato YYYY-MM-DD."),
  handleValidationErrors,
];

module.exports = {
  idValidator,
  crearCitaValidators,
  actualizarCitaValidators,
  cambiarEstadoCitaValidators,
  buscarValidators,
  obtenerDisponibilidadValidators,
};