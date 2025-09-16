// src/service/producto.service.js

import Producto from "../models/producto.model.js"; // Asegúrate de que esta ruta a tu modelo Producto sea correcta
import { productoSchema } from "../schemas/producto.validators.js"; // Asegúrate de que esta ruta a tu esquema de validación sea correcta

/**
 * Crea un nuevo producto en la base de datos.
 * Realiza una validación de los datos de entrada usando productoSchema.
 * @param {Object} data - Los datos del producto a crear.
 * @returns {Promise<Object>} El producto creado.
 * @throws {Error} Si la validación falla o el producto no puede ser creado.
 */
export async function crearProducto(data) {
  // Valida los datos de entrada con el esquema definido
  const { error } = productoSchema.validate(data);
  if (error) {
    // Si hay errores de validación, lanza un error con el mensaje detallado
    throw new Error(error.details[0].message);
  }
  // Crea el producto en la base de datos usando el modelo Sequelize
  const producto = await Producto.create(data);
  return producto;
}

/**
 * Obtiene todos los productos de la base de datos.
 * @returns {Promise<Array<Object>>} Una lista de todos los productos.
 */
export async function obtenerProductos() {
  // Busca y retorna todos los productos
  return await Producto.findAll();
}

/**
 * Obtiene un producto específico por su ID.
 * @param {string} id - El ID del producto a buscar.
 * @returns {Promise<Object>} El producto encontrado.
 * @throws {Error} Si el producto no es encontrado.
 */
export async function obtenerProductoPorId(id) {
  // Busca un producto por su clave primaria (ID)
  const producto = await Producto.findByPk(id);
  if (!producto) {
    // Si no se encuentra el producto, lanza un error
    throw new Error("Producto no encontrado.");
  }
  return producto;
}

/**
 * Actualiza un producto existente en la base de datos.
 * Realiza una validación de los datos de entrada usando productoSchema.
 * @param {string} id - El ID del producto a actualizar.
 * @param {Object} data - Los nuevos datos para el producto.
 * @returns {Promise<Object>} El producto actualizado.
 * @throws {Error} Si la validación falla, el producto no es encontrado o no puede ser actualizado.
 */
export async function actualizarProducto(id, data) {
  // Valida los datos de entrada para la actualización
  const { error } = productoSchema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  // Busca el producto por ID antes de intentar actualizarlo
  const producto = await Producto.findByPk(id);
  if (!producto) {
    throw new Error("Producto no encontrado.");
  }
  // Actualiza el producto con los nuevos datos
  await producto.update(data);
  return producto;
}

/**
 * Elimina un producto de la base de datos.
 * @param {string} id - El ID del producto a eliminar.
 * @returns {Promise<Object>} Un mensaje de confirmación de eliminación.
 * @throws {Error} Si el producto no es encontrado o no puede ser eliminado.
 */
export async function eliminarProducto(id) {
  // Busca el producto por ID antes de intentar eliminarlo
  const producto = await Producto.findByPk(id);
  if (!producto) {
    throw new Error("Producto no encontrado.");
  }
  // Elimina el producto
  await producto.destroy();
  return { mensaje: "Producto eliminado correctamente." };
}
