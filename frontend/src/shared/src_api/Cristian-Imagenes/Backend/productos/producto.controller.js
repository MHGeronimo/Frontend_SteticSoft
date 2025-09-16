import {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto
} from "../service/producto.service.js";
import path from 'path';
import fs from 'fs';

// 🚨 Nuevo: Importamos la función de validación
import { productoSchema } from "../schemas/producto.validators.js";

// Crear un nuevo producto
export async function crearProductoController(req, res) {
  try {
    // 🔍 Agregamos logs para depuración
    console.log("Cuerpo de la petición:", req.body);
    console.log("Archivo recibido:", req.file);
    
    // Agregamos el campo 'Imagenes' del archivo a los datos del cuerpo para validación
    const productoData = {
      ...req.body,
      Imagenes: req.file ? `/uploads/${req.file.filename}` : null
    };

    // Validar los datos con el esquema Joi
    const { error } = productoSchema.validate(productoData);
    if (error) {
      // ⚠️ Log para mostrar el error de Joi
      console.error("Error de validación de Joi:", error.details[0].message);
      
      // Si la validación falla, eliminamos el archivo subido para evitar basura
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error al eliminar el archivo subido:", unlinkError);
        }
      }
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Convertir los valores a los tipos correctos
    productoData.precio = parseFloat(productoData.precio);
    productoData.cantidad = parseInt(productoData.cantidad, 10);
    productoData.IDCat_producto = parseInt(productoData.IDCat_producto, 10);
    productoData.estadoAI = parseInt(productoData.estadoAI, 10);

    console.log("Crear Producto Controller: Datos recibidos y procesados para el servicio:", productoData);

    // Pasar los datos procesados al servicio
    const producto = await crearProducto(productoData);
    res.status(201).json(producto);
  } catch (error) {
    // Si hay un error, por ejemplo de validación, enviamos el error al cliente
    console.error("Error en crearProductoController:", error);
    res.status(400).json({ error: error.message });
  }
}

// Obtener todos los productos
export async function obtenerProductosController(req, res) {
  try {
    const productos = await obtenerProductos();
    res.json({data: productos});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener un producto por ID
export async function obtenerProductoPorIdController(req, res) {
  try {
    const producto = await obtenerProductoPorId(req.params.id);
    res.json(producto);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

// Actualizar un producto
export async function actualizarProductoController(req, res) {
  try {
    // Si se subió un nuevo archivo, eliminamos el anterior
    if (req.file) {
      // ⚠️ Nota: La eliminación del archivo anterior en el servidor está deshabilitada temporalmente para simplificar la depuración.
      // Cuando volvamos a habilitar la conexión a la base de datos, agregaremos aquí el código para eliminar la imagen anterior.
      // El resto del código funciona como antes.
    }
    
    // Creamos un objeto con los datos, convirtiendo los valores a números
    const productoData = {
      ...req.body,
      precio: parseFloat(req.body.precio),
      cantidad: parseInt(req.body.cantidad, 10),
      IDCat_producto: parseInt(req.body.IDCat_producto, 10),
      estadoAI: parseInt(req.body.estadoAI, 10),
      // Solo actualizamos la ruta de la imagen si se subió un archivo nuevo
      Imagenes: req.file ? `/uploads/${req.file.filename}` : req.body.Imagenes
    };

    // Eliminamos el ID del cuerpo, ya que está en la URL
    delete productoData.ID_Producto;

    // Validar los datos con el esquema Joi
    const { error } = productoSchema.validate(productoData);
    if (error) {
      // Si la validación falla, eliminamos la nueva imagen subida
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: error.details[0].message });
    }

    const producto = await actualizarProducto(req.params.id, productoData);
    res.json(producto);
  } catch (error) {
    console.error("Error en actualizarProductoController:", error);
    res.status(400).json({ error: error.message });
  }
}

// Eliminar un producto
export async function eliminarProductoController(req, res) {
  try {
    const resultado = await eliminarProducto(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}
