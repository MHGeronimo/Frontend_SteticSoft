import Joi from "joi";

export const productoSchema = Joi.object({
    nombre: Joi.string()
        .max(30) // CAMBIO CLAVE: Límite de 30 caracteres
        .required()
        .messages({
            "string.base": "El nombre debe ser un texto.",
            "string.max": "El nombre no debe superar los 30 caracteres.", // Mensaje actualizado
            "any.required": "El nombre es obligatorio."
        }),
    precio: Joi.number()
        .min(0)
        .precision(2)
        .required()
        .messages({
            "number.base": "El precio debe ser un número.",
            "number.min": "El precio no puede ser negativo.",
            "any.required": "El precio es obligatorio."
        }),
    cantidad: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            "number.base": "La cantidad debe ser un número entero.",
            "number.min": "La cantidad no puede ser negativa.",
            "any.required": "La cantidad es obligatoria."
        }),
    marca: Joi.string()
        .max(45)
        .required()
        .messages({
            "string.base": "La marca debe ser un texto.",
            "string.max": "La marca no debe superar los 45 caracteres.",
            "any.required": "La marca es obligatoria."
        }),
    estadoAI: Joi.number()
        .valid(0, 1)
        .required()
        .messages({
            "number.base": "El estado debe ser un número.",
            "any.only": "El estado debe ser 0 (inactivo) o 1 (activo).",
            "any.required": "El estado es obligatorio."
        }),
    IDCat_producto: Joi.number()
        .integer()
        .required()
        .messages({
            "number.base": "El código de categoría debe ser un número.",
            "any.required": "El código de categoría es obligatorio."
        }),
    descripcion: Joi.string()
        .allow(null, '')
        .max(500)
        .messages({
            "string.max": "La descripción no debe superar los 500 caracteres."
        }),
    Imagenes: Joi.string()
      .allow(null, '')
      .optional()
});
