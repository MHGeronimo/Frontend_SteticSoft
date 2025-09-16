const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js");
const db = require("../models");
const { Op } = db.Sequelize;

// Expresión regular: letras, números y espacios (incluye tildes y ñ)
const regexNombre = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;

const regexImagen = /\.(jpg|jpeg|png|webp)$/i;

const crearServicioValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del servicio es obligatorio.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(regexNombre).withMessage("El nombre solo puede contener letras, números y espacios.")
    .custom(async (value) => {
      const servicio = await db.Servicio.findOne({ where: { nombre: value } });
      if (servicio) {
        return Promise.reject("Ya existe un servicio con este nombre.");
      }
    }),

  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage("La descripción debe ser texto."),

  body("precio")
    .notEmpty().withMessage("El precio es obligatorio.")
    .isDecimal({ decimal_digits: "0,2" }).withMessage("El precio debe tener hasta 2 decimales.")
    .custom((value) => parseFloat(value) >= 0).withMessage("El precio no puede ser negativo."),

  body("idCategoriaServicio")
    .notEmpty().withMessage("La categoría es obligatoria.")
    .isInt({ gt: 0 }).withMessage("El ID de la categoría es inválido.")
    .custom(async (value) => {
      const categoria = await db.CategoriaServicio.findByPk(value);
      if (!categoria || !categoria.estado) {
        return Promise.reject("La categoría seleccionada no existe o no está activa.");
      }
    }),

  body("imagen")
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage("La URL de la imagen debe ser texto.")
    .matches(regexImagen).withMessage("La imagen debe ser .jpg, .jpeg, .png o .webp."),

  handleValidationErrors,
];

const actualizarServicioValidators = [
  param("idServicio").isInt({ gt: 0 }).withMessage("El ID del servicio en la URL es inválido."),

  body("nombre")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre no puede ser un texto vacío.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(regexNombre).withMessage("El nombre solo puede contener letras, números y espacios.")
    .custom(async (value, { req }) => {
      const servicio = await db.Servicio.findOne({
        where: {
          nombre: value,
          idServicio: { [Op.ne]: req.params.idServicio },
        },
      });
      if (servicio) {
        return Promise.reject("Este nombre ya está en uso por otro servicio.");
      }
    }),

  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage("La descripción debe ser texto."),

  body("precio")
    .optional()
    .isDecimal({ decimal_digits: "0,2" }).withMessage("El precio debe tener hasta 2 decimales.")
    .custom((value) => parseFloat(value) >= 0).withMessage("El precio no puede ser negativo."),

  body("idCategoriaServicio")
    .optional()
    .isInt({ gt: 0 }).withMessage("El ID de la categoría es inválido.")
    .custom(async (value) => {
      const categoria = await db.CategoriaServicio.findByPk(value);
      if (!categoria || !categoria.estado) {
        return Promise.reject("La categoría seleccionada no existe o no está activa.");
      }
    }),

  body("imagen")
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage("La URL de la imagen debe ser texto.")
    .matches(regexImagen).withMessage("La imagen debe ser .jpg, .jpeg, .png o .webp."),

  handleValidationErrors,
];

const cambiarEstadoServicioValidators = [
  param("idServicio")
    .isInt({ gt: 0 }).withMessage("El ID del servicio debe ser un entero positivo."),

  body("estado")
    .exists({ checkFalsy: false }).withMessage("El campo 'estado' es obligatorio.")
    .custom((value) => {
      if (
        value === true ||
        value === false ||
        value === "true" ||
        value === "false" ||
        value === "Activo" ||
        value === "Inactivo"
      ) {
        return true;
      }
      throw new Error("El valor de 'estado' debe ser true, false, 'Activo' o 'Inactivo'.");
    }),

  handleValidationErrors,
];

const idServicioValidator = [
  param("idServicio")
    .isInt({ gt: 0 }).withMessage("El ID del servicio debe ser un entero positivo.")
    .notEmpty().withMessage("El ID del servicio no puede estar vacío."),
  handleValidationErrors,
];

const listarServiciosValidator = [
  query("busqueda")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/)
    .withMessage("La búsqueda contiene caracteres no permitidos."),
  query("estado")
    .optional()
    .custom((value) => {
      if (
        value === "true" ||
        value === "false" ||
        value === true ||
        value === false ||
        value === "Activo" ||
        value === "Inactivo"
      ) {
        return true;
      }
      throw new Error("El estado debe ser true, false, 'Activo' o 'Inactivo'.");
    }),
  query("idCategoriaServicio")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("El id de categoría debe ser un entero positivo."),
  handleValidationErrors,
];

module.exports = {
  crearServicioValidators,
  actualizarServicioValidators,
  cambiarEstadoServicioValidators,
  idServicioValidator,
  listarServiciosValidator,
};
