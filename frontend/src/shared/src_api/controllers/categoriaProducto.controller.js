const categoriaProductoService = require("../services/categoriaProducto.service.js");
 
/**
 * Crea una nueva categoría de producto.
 */
const crearCategoriaProducto = async (req, res, next) => {
  try {
    const nuevaCategoria =
      await categoriaProductoService.crearCategoriaProducto(req.body);
    res.status(201).json({
      success: true,
      message: "Categoría de producto creada exitosamente.",
      data: nuevaCategoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las categorías de producto.
 */
const listarCategoriasProducto = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    
    // Filtro por estado
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }

    // Filtro de búsqueda general
    if (req.query.search) {
      opcionesDeFiltro.search = req.query.search;
    }

    const categorias =
      await categoriaProductoService.obtenerTodasLasCategoriasProducto(
        opcionesDeFiltro
      );
    res.status(200).json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una categoría de producto específica por su ID.
 */
const obtenerCategoriaProductoPorId = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const categoria =
      await categoriaProductoService.obtenerCategoriaProductoPorId(
        Number(idCategoria)
      );
    res.status(200).json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) una categoría de producto existente por su ID.
 */
const actualizarCategoriaProducto = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const categoriaActualizada =
      await categoriaProductoService.actualizarCategoriaProducto(
        Number(idCategoria),
        req.body
      );
    res.status(200).json({
      success: true,
      message: "Categoría de producto actualizada exitosamente.",
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de una categoría de producto.
 */
const cambiarEstadoCategoriaProducto = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const categoriaActualizada =
      await categoriaProductoService.cambiarEstadoCategoriaProducto(
        Number(idCategoria),
        estado
      );
    res.status(200).json({
      success: true,
      message: `Estado de la categoría de producto ID ${idCategoria} cambiado a ${estado} exitosamente.`,
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una categoría de producto (borrado lógico, estado = false).
 */
const anularCategoriaProducto = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const categoriaAnulada =
      await categoriaProductoService.anularCategoriaProducto(
        Number(idCategoria)
      );
    res.status(200).json({
      success: true,
      message: "Categoría de producto anulada (deshabilitada) exitosamente.",
      data: categoriaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una categoría de producto (estado = true).
 */
const habilitarCategoriaProducto = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    const categoriaHabilitada =
      await categoriaProductoService.habilitarCategoriaProducto(
        Number(idCategoria)
      );
    res.status(200).json({
      success: true,
      message: "Categoría de producto habilitada exitosamente.",
      data: categoriaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una categoría de producto por su ID.
 */
const eliminarCategoriaProductoFisica = async (req, res, next) => {
  try {
    const { idCategoria } = req.params;
    await categoriaProductoService.eliminarCategoriaProductoFisica(
      Number(idCategoria)
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las categorías de producto públicas (activas).
 */
const listarCategoriasPublicas = async (req, res, next) => {
  try {
    const categorias =
      await categoriaProductoService.obtenerCategoriasPublicas();
    res.status(200).json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCategoriaProducto,
  listarCategoriasProducto,
  obtenerCategoriaProductoPorId,
  actualizarCategoriaProducto,
  anularCategoriaProducto,
  habilitarCategoriaProducto,
  eliminarCategoriaProductoFisica,
  cambiarEstadoCategoriaProducto,
  listarCategoriasPublicas,
};