// src/shared/src_api/routes/producto.routes.js

const express = require("express");
const router = express.Router();
const productoController = require("../controllers/producto.controller.js");
const productoValidators = require("../validators/producto.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");
const { processImageUpload } = require("../middlewares/upload.middleware"); // ✅ NUEVO

// INICIO DE MODIFICACIÓN: Importar el validador correcto
const categoriaProductoValidators = require("../validators/categoriaProducto.validators.js");
// FIN DE MODIFICACIÓN

const PERMISO_MODULO_PRODUCTOS = "MODULO_PRODUCTOS_GESTIONAR";

// Ruta pública para obtener productos activos
router.get("/public", productoController.listarProductosPublicos);

// Ruta pública para obtener productos activos por categoría
router.get(
  "/public/:idCategoria",
  // INICIO DE MODIFICACIÓN: Usar el validador importado correctamente
  categoriaProductoValidators.idCategoriaProductoValidator,
  // FIN DE MODIFICACIÓN
  productoController.listarProductosPublicos
);

// Ruta para crear un nuevo producto, incluye subida de imagen.
router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  processImageUpload("imagen", "steticsoft/productos"), // ✅ Middleware Cloudinary
  productoValidators.crearProductoValidators,
  productoController.crearProducto
);

// Ruta para obtener todos los productos.
router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoController.listarProductos
);

// Ruta para obtener productos de uso interno (para abastecimiento).
router.get(
  "/interno",
  authMiddleware,
  checkPermission("MODULO_ABASTECIMIENTOS_GESTIONAR"), // Permiso del módulo que la consume
  productoController.listarProductosInternos
);

// Ruta para obtener un producto por su ID.
router.get(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.obtenerProductoPorId
);

// Ruta para actualizar un producto existente, incluye subida de imagen.
router.put(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  processImageUpload("imagen", "steticsoft/productos"), // ✅ Middleware Cloudinary
  productoValidators.actualizarProductoValidators,
  productoController.actualizarProducto
);

// Ruta para cambiar el estado de un producto (activo/inactivo).
router.patch(
  "/:idProducto/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.cambiarEstadoProductoValidators,
  productoController.cambiarEstadoProducto
);

// Ruta para anular un producto (borrado lógico).
router.patch(
  "/:idProducto/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.anularProducto
);

// Ruta para habilitar un producto.
router.patch(
  "/:idProducto/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.habilitarProducto
);

// Ruta para eliminar un producto físicamente.
router.delete(
  "/:idProducto",
  authMiddleware,
  checkPermission(PERMISO_MODULO_PRODUCTOS),
  productoValidators.idProductoValidator,
  productoController.eliminarProductoFisico
);

module.exports = router;
