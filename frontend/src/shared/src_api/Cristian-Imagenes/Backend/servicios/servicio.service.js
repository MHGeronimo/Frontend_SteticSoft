// src/services/servicio.service.js
import Servicio from "../models/servicio.model.js";
import Cat_Servicio from "../models/catservicio.model.js"; // Necesario para validar CodigoCat
import { NotFoundError, ConflictError, CustomError } from "../errors.js"; // Asume que tienes un archivo errors.js

/**
 * Crea un nuevo servicio.
 * @param {object} serviceData - Los datos del servicio a crear (nombre, duracion, precio, estadoAI, descripcion, CodigoCat).
 * @returns {Promise<object>} El objeto Servicio creado.
 * @throws {NotFoundError} Si la categoría de servicio (CodigoCat) no existe.
 * @throws {ConflictError} Si ya existe un servicio con el mismo nombre.
 * @throws {CustomError} Para errores internos del servidor.
 */
export const createServicio = async (serviceData) => {
  const { nombre, CodigoCat } = serviceData;

  try {
    // 1. Verificar si la categoría de servicio existe
    const categoriaExistente = await Cat_Servicio.findByPk(CodigoCat);
    if (!categoriaExistente) {
      throw new NotFoundError(`La categoría de servicio con ID ${CodigoCat} no existe.`);
    }

    // 2. Verificar si ya existe un servicio con el mismo nombre
    const existingServicio = await Servicio.findOne({ where: { nombre } });
    if (existingServicio) {
      throw new ConflictError(`Ya existe un servicio con el nombre '${nombre}'.`);
    }

    // 3. Crear el nuevo servicio
    const newServicio = await Servicio.create(serviceData);
    return newServicio;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof CustomError) {
      throw error;
    }
    console.error("Error en service.createServicio:", error);
    throw new CustomError("Error al crear el servicio.", 500);
  }
};

/**
 * Obtiene todos los servicios, opcionalmente incluyendo su categoría.
 * @param {boolean} [includeCategory=false] - Si es true, incluye los datos de la categoría de servicio.
 * @returns {Promise<Array<object>>} Un array de objetos Servicio.
 * @throws {CustomError} Para errores internos del servidor.
 */
export const getAllServicios = async (includeCategory = false) => {
  try {
    const options = {};
    if (includeCategory) {
      options.include = [{
        model: Cat_Servicio,
        as: 'categoria', // Usa el alias definido en el modelo Servicio
      }];
    }
    const servicios = await Servicio.findAll(options);
    return servicios;
  } catch (error) {
    console.error("Error en service.getAllServicios:", error);
    throw new CustomError("Error al obtener todos los servicios.", 500);
  }
};

/**
 * Obtiene un servicio por su ID.
 * @param {number} id - El ID_Servicio del servicio a buscar.
 * @param {boolean} [includeCategory=false] - Si es true, incluye los datos de la categoría de servicio.
 * @returns {Promise<object>} El objeto Servicio encontrado.
 * @throws {NotFoundError} Si el servicio no es encontrado.
 * @throws {CustomError} Para errores internos del servidor.
 */
export const getServicioById = async (id, includeCategory = false) => {
  try {
    const options = {};
    if (includeCategory) {
      options.include = [{
        model: Cat_Servicio,
        as: 'categoria',
      }];
    }
    const servicio = await Servicio.findByPk(id, options);
    if (!servicio) {
      throw new NotFoundError(`Servicio con ID ${id} no encontrado.`);
    }
    return servicio;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof CustomError) {
      throw error;
    }
    console.error("Error en service.getServicioById:", error);
    throw new CustomError("Error al obtener el servicio por ID.", 500);
  }
};

/**
 * Actualiza un servicio existente.
 * @param {number} id - El ID_Servicio del servicio a actualizar.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} El objeto Servicio actualizado.
 * @throws {NotFoundError} Si el servicio no es encontrado.
 * @throws {ConflictError} Si el nuevo nombre ya está en uso por otro servicio.
 * @throws {CustomError} Para errores internos del servidor.
 */
export const updateServicio = async (id, updateData) => {
  try {
    const servicio = await Servicio.findByPk(id);
    if (!servicio) {
      throw new NotFoundError(`Servicio con ID ${id} no encontrado para actualizar.`);
    }

    // 1. Si se intenta cambiar CodigoCat, verificar que la nueva categoría exista
    if (updateData.CodigoCat && updateData.CodigoCat !== servicio.CodigoCat) {
      const categoriaExistente = await Cat_Servicio.findByPk(updateData.CodigoCat);
      if (!categoriaExistente) {
        throw new NotFoundError(`La nueva categoría de servicio con ID ${updateData.CodigoCat} no existe.`);
      }
    }

    // 2. Si se intenta cambiar el nombre, verificar que el nuevo nombre no esté en uso por otro servicio
    if (updateData.nombre && updateData.nombre !== servicio.nombre) {
      const existingServicio = await Servicio.findOne({ where: { nombre: updateData.nombre } });
      if (existingServicio && existingServicio.ID_Servicio !== id) {
        throw new ConflictError(`Ya existe un servicio con el nombre '${updateData.nombre}'.`);
      }
    }

    // 3. Actualizar el servicio
    await servicio.update(updateData);
    return servicio;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof CustomError) {
      throw error;
    }
    console.error("Error en service.updateServicio:", error);
    throw new CustomError("Error al actualizar el servicio.", 500);
  }
};

/**
 * Elimina un servicio por su ID.
 * @param {number} id - El ID_Servicio del servicio a eliminar.
 * @returns {Promise<boolean>} True si el servicio fue eliminado.
 * @throws {NotFoundError} Si el servicio no es encontrado.
 * @throws {CustomError} Para errores internos del servidor.
 */
export const deleteServicio = async (id) => {
  try {
    const servicio = await Servicio.findByPk(id);
    if (!servicio) {
      throw new NotFoundError(`Servicio con ID ${id} no encontrado para eliminar.`);
    }

    await servicio.destroy();
    return true;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof CustomError) {
      throw error;
    }
    console.error("Error en service.deleteServicio:", error);
    throw new CustomError("Error al eliminar el servicio.", 500);
  }
};