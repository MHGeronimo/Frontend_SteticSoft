// src/schemas/servicio.validators.js
import { z } from 'zod';

// Esquema para la creación de un nuevo Servicio
export const createServicioSchema = z.object({
  nombre: z.string({
    required_error: 'El nombre del servicio es requerido.'
  })
  .min(3, "El nombre del servicio debe tener al menos 3 caracteres.")
  .max(45, "El nombre del servicio no puede exceder los 45 caracteres."),

  duracion: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "La duración debe estar en formato HH:MM:SS."),

  precio: z.number({
    required_error: 'El precio del servicio es requerido.',
    invalid_type_error: 'El precio debe ser un número.'
  })
  .positive('El precio debe ser un número positivo.')
  .max(99999999.99, "El precio excede el valor máximo permitido."),

  estadoAI: z.number({
    invalid_type_error: 'El estado debe ser un número entero.'
  })
  .int('El estado debe ser un número entero.')
  .refine(val => val === 0 || val === 1, {
      message: "El estado del servicio debe ser 0 (inactivo) o 1 (activo)."
  })
  .default(1)
  .optional(),

  descripcion: z.string()
    .max(150, "La descripción no puede exceder los 1000 caracteres.")
    .optional()
    .nullable(),

  CodigoCat: z.number({
    required_error: 'El código de categoría es requerido.',
    invalid_type_error: 'El código de categoría debe ser un número entero.'
  })
  .int('El código de categoría debe ser un número entero.')
  .positive('El código de categoría debe ser un número positivo.'),

  // -- ¡NUEVO CAMPO! --
  Imagenes: z.string({
      required_error: 'La imagen del servicio es requerida.'
  }).nonempty('La imagen del servicio no puede estar vacía.')
});

// Esquema para la actualización de un Servicio
// Todos los campos son opcionales para permitir actualizaciones parciales
export const updateServicioSchema = z.object({
  nombre: z.string()
    .min(3, "El nombre del servicio debe tener al menos 3 caracteres.")
    .max(100, "El nombre del servicio no puede exceder los 100 caracteres.")
    .optional(),

  duracion: z.string()
    .regex(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "La duración debe estar en formato HH:MM:SS.") // Cambiado a formato de hora
    .optional(),

  precio: z.number({
    invalid_type_error: 'El precio debe ser un número.'
  })
  .positive('El precio debe ser un número positivo.')
  .max(99999999.99, "El precio excede el valor máximo permitido.")
  .optional(),

  estadoAI: z.number({
    invalid_type_error: 'El estado debe ser un número entero.'
  })
  .int('El estado debe ser un número entero.')
  .refine(val => val === 0 || val === 1, {
      message: "El estado del servicio debe ser 0 (inactivo) o 1 (activo)."
  })
  .optional(),

  descripcion: z.string()
    .max(1000, "La descripción no puede exceder los 1000 caracteres.")
    .optional()
    .nullable(),

  CodigoCat: z.number({
    invalid_type_error: 'El código de categoría debe ser un número entero.'
  })
  .int('El código de categoría debe ser un número entero.')
  .positive('El código de categoría debe ser un número positivo.')
  .optional(),

  Imagenes: z.string().optional()
}).partial(); // Esto hace que todos los campos del objeto de nivel superior sean opcionales

// Esquema para validar el ID_Servicio de un servicio (por ejemplo, en parámetros de ruta)
export const servicioIdSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number({
    required_error: 'El ID del servicio es requerido.',
    invalid_type_error: 'El ID del servicio debe ser un número.'
  })
  .int('El ID del servicio debe ser un número entero.')
  .positive('El ID del servicio debe ser un número positivo.')),
});