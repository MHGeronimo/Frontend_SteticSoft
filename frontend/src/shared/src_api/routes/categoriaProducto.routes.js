// src/routes/categoriaProducto.routes.js  
const express = require("express");
const router = express.Router();
const categoriaProductoController = require("../controllers/categoriaProducto.controller.js");
const categoriaProductoValidators = require("../validators/categoriaProducto.validators.js");
 
const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_CATEGORIAS_PRODUCTOS =
  "MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR";

router.get("/public", categoriaProductoController.listarCategoriasPublicas);

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.crearCategoriaProductoValidators,
  categoriaProductoController.crearCategoriaProducto
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoController.listarCategoriasProducto
);

router.get(
  "/:idCategoria",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.obtenerCategoriaProductoPorId
);

router.put(
  "/:idCategoria",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.actualizarCategoriaProductoValidators,
  categoriaProductoController.actualizarCategoriaProducto
);

// NUEVA RUTA: Cambiar el estado de una categoría de producto
router.patch(
  "/:idCategoria/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.cambiarEstadoCategoriaProductoValidators,
  categoriaProductoController.cambiarEstadoCategoriaProducto
);

router.patch(
  "/:idCategoria/anular",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.anularCategoriaProducto
);

router.patch(
  "/:idCategoria/habilitar",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.habilitarCategoriaProducto
);

router.delete(
  "/:idCategoria",
  authMiddleware,
  checkPermission(PERMISO_MODULO_CATEGORIAS_PRODUCTOS),
  categoriaProductoValidators.idCategoriaProductoValidator,
  categoriaProductoController.eliminarCategoriaProductoFisica
);

module.exports = router;
