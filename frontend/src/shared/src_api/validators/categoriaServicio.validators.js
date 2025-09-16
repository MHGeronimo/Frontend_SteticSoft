// src/validators/categoriaServicio.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearCategoriaServicioValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la categoría de servicio es obligatorio.")
    .isString()
    .withMessage("El nombre de la categoría de servicio debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage("El nombre de la categoría de servicio debe tener entre 3 y 45 caracteres.")
    .custom(async (value) => {
      const nombreNormalizado = value.trim().toLowerCase();

      const categoriaExistente = await db.CategoriaServicio.findOne({
        where: db.Sequelize.where(
          db.Sequelize.fn("lower", db.Sequelize.col("nombre")),
          nombreNormalizado
        ),
      });

      if (categoriaExistente) {
        return Promise.reject(
          `Ya existe una categoría con el nombre "${categoriaExistente.nombre}".`
        );
      }
    }),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria.")
    .isString()
    .withMessage("La descripción debe ser texto.")
    .isLength({ max: 200 })
    .withMessage("La descripción no debe exceder los 200 caracteres."),

  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),

  handleValidationErrors,
];

const actualizarCategoriaServicioValidators = [
  param("idCategoriaServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID de la categoría de servicio debe ser un entero positivo."),

  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre de la categoría no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El nombre de la categoría de servicio debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage("El nombre de la categoría de servicio debe tener entre 3 y 45 caracteres.")
    .custom(async (value, { req }) => {
      if (value) {
        const idCategoriaServicio = Number(req.params.idCategoriaServicio);
        const nombreNormalizado = value.trim().toLowerCase();

        const categoriaExistente = await db.CategoriaServicio.findOne({
          where: {
            [db.Sequelize.Op.and]: [
              db.Sequelize.where(
                db.Sequelize.fn("lower", db.Sequelize.col("nombre")),
                nombreNormalizado
              ),
              { idCategoriaServicio: { [db.Sequelize.Op.ne]: idCategoriaServicio } }
            ]
          }
        });

        if (categoriaExistente) {
          return Promise.reject(
            `Ya existe una categoría con el nombre "${categoriaExistente.nombre}".`
          );
        }
      }
    }),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria.")
    .isString()
    .withMessage("La descripción debe ser texto.")
    .isLength({ max: 200 })
    .withMessage("La descripción no debe exceder los 200 caracteres."),

  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),

  handleValidationErrors,
];

const idCategoriaServicioValidator = [
  param("idCategoriaServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID de la categoría de servicio debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoCategoriaServicioValidators = [
  param("idCategoriaServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID de la categoría de servicio debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearCategoriaServicioValidators,
  actualizarCategoriaServicioValidators,
  idCategoriaServicioValidator,
  cambiarEstadoCategoriaServicioValidators,
};
