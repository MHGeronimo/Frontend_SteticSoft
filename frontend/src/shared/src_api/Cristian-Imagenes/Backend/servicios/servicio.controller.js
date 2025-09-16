// src/controllers/servicio.controller.js
import { createServicioSchema, updateServicioSchema, servicioIdSchema } from '../schemas/servicio.validators.js'; // Asegúrate de la ruta correcta
import * as servicioService from '../service/servicio.service.js'; // Importa todas las funciones del servicio
import { z } from 'zod'; // Importa Zod para manejar errores de validación

/**
 * Controlador para crear un nuevo servicio.
 * POST /api/servicios
 */
export const createServicio = async (req, res, next) => {
  try {
    // 1. Obtener la ruta del archivo de imagen
    const imagenPath = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // 2. Unir los datos del cuerpo con la ruta de la imagen para la validación
    const dataToValidate = {
      ...req.body,
      precio: parseFloat(req.body.precio),
      estadoAI: parseInt(req.body.estadoAI),
      CodigoCat: parseInt(req.body.CodigoCat),
      Imagenes: imagenPath
    };

    // 3. Validar los datos de entrada con Zod
    const validatedData = createServicioSchema.parse(dataToValidate);

    // 4. Llamar al servicio para crear el servicio
    const newServicio = await servicioService.createServicio(validatedData);

    // 5. Enviar una respuesta exitosa
    res.status(201).json({
      message: "Servicio creado exitosamente.",
      data: newServicio,
    });
  } catch (error) {
    // 6. Manejo de errores de validación y del servicio
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Datos de entrada inválidos.",
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        })),
      });
    }
    next(error); // Pasar el error al siguiente middleware (manejador de errores global)
  }
};

/**
 * Controlador para obtener todos los servicios.
 * GET /api/servicios
 * Opcional: /api/servicios?includeCategory=true
 */
export const getAllServicios = async (req, res, next) => {
  try {
    // Verificar si se solicita incluir la categoría
    const includeCategory = req.query.includeCategory === 'true';

    const servicios = await servicioService.getAllServicios(includeCategory);

    res.status(200).json({
      message: "Servicios obtenidos exitosamente.",
      data: servicios,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener un servicio por ID.
 * GET /api/servicios/:id
 * Opcional: /api/servicios/:id?includeCategory=true
 */
export const getServicioById = async (req, res, next) => {
  try {
    // 1. Validar el ID de la ruta con Zod
    const { id } = servicioIdSchema.parse(req.params);
    // Verificar si se solicita incluir la categoría
    const includeCategory = req.query.includeCategory === 'true';

    // 2. Llamar al servicio para obtener el servicio
    const servicio = await servicioService.getServicioById(id, includeCategory);

    res.status(200).json({
      message: "Servicio obtenido exitosamente.",
      data: servicio,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "ID inválido.",
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        })),
      });
    }
    next(error);
  }
};

/**
 * Controlador para actualizar un servicio.
 * PUT /api/servicios/:id
 */
export const updateServicio = async (req, res, next) => {
    try {
        // ✅ AÑADIDO: Logs de depuración para verificar la entrada de datos
        console.log('--- Inicio de la función updateServicio ---');
        console.log('Parámetros de la URL (ID):', req.params.id);
        console.log('Cuerpo de la solicitud (req.body):', req.body);

        // 1. Validar el ID de la ruta
        const { id } = servicioIdSchema.parse(req.params);

        // 2. Determinar la ruta de la imagen
        let imagenPath;
        if (req.file) {
            // Si se subió un nuevo archivo, usamos esa ruta
            imagenPath = req.file.path.replace(/\\/g, "/");
        } else {
            // Si no se subió un nuevo archivo, conservamos el valor que venía en el body.
            // Esto permite mantener la imagen original si solo se actualizan otros campos.
            imagenPath = req.body.Imagenes;
        }

        // 3. Crear el objeto de datos completo para la validación
        // Combinamos el body con la ruta de la imagen y convertimos los valores
        const dataToValidate = {
            ...req.body,
            precio: req.body.precio ? parseFloat(req.body.precio) : undefined,
            estadoAI: req.body.estadoAI !== undefined && req.body.estadoAI !== null ? parseInt(req.body.estadoAI) : undefined,
            CodigoCat: req.body.CodigoCat ? parseInt(req.body.CodigoCat) : undefined,
            Imagenes: imagenPath
        };
        
        // 4. Validar los datos combinados con Zod
        // ✅ AÑADIDO: Log para ver los datos después de la validación
        console.log('Datos validados para la actualización:', dataToValidate);
        const validatedData = updateServicioSchema.parse(dataToValidate);

        // 5. Llamar al servicio para actualizar el servicio
        const updatedServicio = await servicioService.updateServicio(id, validatedData);
        // ✅ AÑADIDO: Log para confirmar el resultado del servicio
        console.log('Servicio actualizado en la base de datos:', updatedServicio);

        res.status(200).json({
            message: "Servicio actualizado exitosamente.",
            data: updatedServicio,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // ✅ AÑADIDO: Log de error de Zod para depuración
            console.error('Error de validación de Zod:', error.errors);
            return res.status(400).json({
                message: "Datos de entrada inválidos.",
                errors: error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message
                })),
            });
        }
        // ✅ AÑADIDO: Log para otros errores inesperados
        console.error('Error inesperado en updateServicio:', error);
        next(error);
    }
};

/**
 * Controlador para eliminar un servicio.
 * DELETE /api/servicios/:id
 */
export const deleteServicio = async (req, res, next) => {
  try {
    // 1. Validar el ID de la ruta
    const { id } = servicioIdSchema.parse(req.params);

    // 2. Llamar al servicio para eliminar el servicio
    await servicioService.deleteServicio(id);

    res.status(200).json({
      message: "Servicio eliminado exitosamente.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "ID inválido.",
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        })),
      });
    }
    next(error);
  }
};