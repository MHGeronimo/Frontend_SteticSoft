// src/controllers/servicio.controller.js
const { handleValidationErrors } = require("../middlewares/validation.middleware");
const { 
  validateServicio, 
  validateServicioUpdate,  // ✅ Añadir esto
  listarServiciosValidator,
  cambiarEstadoServicioValidators,
  idServicioValidator
} = require("../validators/servicio.validators");
const servicioService = require("../services/servicio.service.js");

const crearServicio = async (req, res, next) => {
  try {
    // ✅ Los campos textuales vienen en req.body
    // ✅ La imagen viene en req.file (si se subió)
    const servicioData = { ...req.body };

    // ✅ Manejar imagen de Cloudinary si existe
    if (req.file) {
      servicioData.imagen = req.file.secure_url;
      servicioData.imagenPublicId = req.file.public_id;
    }

    const nuevo = await servicioService.crearServicio(servicioData);
    res.status(201).json({ success: true, message: "Servicio creado.", data: nuevo });
  } catch (error) {
    next(error);
  }
};

const listarServicios = async (req, res, next) => {
    try {
        const filtros = {
            busqueda: req.query.busqueda,
            estado: req.query.estado,
            idCategoriaServicio: req.query.idCategoriaServicio,
        };
        const servicios = await servicioService.obtenerTodosLosServicios(filtros);
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ NUEVA FUNCIÓN: Responde a la ruta /disponibles
 */
const listarServiciosDisponibles = async (req, res, next) => {
    try {
        const servicios = await servicioService.obtenerServiciosDisponibles();
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
        next(error);
    }
};

const listarServiciosPublicos = async (req, res, next) => {
    try {
        const servicios = await servicioService.obtenerTodosLosServicios({ estado: true });  // ✅ Corregido
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
        next(error);
    }
};

const obtenerServicioPorId = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const servicio = await servicioService.obtenerServicioPorId(Number(idServicio));
        res.status(200).json({ success: true, data: servicio });
    } catch (error) {
        next(error);
    }
};
const actualizarServicio = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const servicioData = { ...req.body };

        // ✅ Manejar imagen de Cloudinary si existe
        if (req.file) {
            servicioData.imagen = req.file.secure_url;
            servicioData.imagenPublicId = req.file.public_id;
        }

        const actualizado = await servicioService.actualizarServicio(Number(idServicio), servicioData);
        res.status(200).json({ success: true, message: "Servicio actualizado.", data: actualizado });
    } catch (error) {
        next(error);
    }
};
const cambiarEstadoServicio = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const { estado } = req.body;
        const actualizado = await servicioService.cambiarEstadoServicio(Number(idServicio), estado);
        res.status(200).json({ success: true, message: "Estado del servicio cambiado.", data: actualizado });
    } catch (error) {
        next(error);
    }
};
const eliminarServicioFisico = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        await servicioService.eliminarServicioFisico(Number(idServicio));
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
  crearServicio,
 listarServicios,
  listarServiciosPublicos,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
  listarServiciosDisponibles,
};
