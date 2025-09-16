// src/controllers/venta.controller.js
const ventaService = require("../services/venta.service.js");
const { BadRequestError, NotFoundError } = require("../errors");
const db = require("../models");

/**
 * Crea una nueva venta.
 */
const crearVenta = async (req, res, next) => {
  try {
    const nuevaVenta = await ventaService.crearVenta(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Venta creada exitosamente.",
      data: nuevaVenta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las ventas.
 */
const listarVentas = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.idEstado) {
      const idEstado = Number(req.query.idEstado);
      if (!isNaN(idEstado) && idEstado > 0) {
        opcionesDeFiltro.idEstado = idEstado;
      }
    }
    if (req.query.clienteId) {
      const idCliente = Number(req.query.clienteId);
      if (!isNaN(idCliente) && idCliente > 0) {
        opcionesDeFiltro.idCliente = idCliente;
      }
    }
    if (req.query.dashboardId) {
      const idDashboard = Number(req.query.dashboardId);
      if (!isNaN(idDashboard) && idDashboard > 0) {
        opcionesDeFiltro.idDashboard = idDashboard;
      }
    }
    const ventas = await ventaService.obtenerTodasLasVentas(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: ventas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una venta específica por su ID.
 */
const obtenerVentaPorId = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const venta = await ventaService.obtenerVentaPorId(Number(idVenta));
    res.status(200).json({
      success: true,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el estado del PROCESO de una venta.
 */
const actualizarEstadoVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const { idEstado } = req.body;
    const ventaActualizada = await ventaService.actualizarEstadoProcesoVenta(
      Number(idVenta),
      { idEstado }
    );
    res.status(200).json({
      success: true,
      message: "Estado de la venta actualizado exitosamente.",
      data: ventaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una venta.
 */
const anularVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaAnulada = await ventaService.anularVenta(Number(idVenta));
    res.status(200).json({
      success: true,
      message: "Venta anulada exitosamente. El inventario ha sido ajustado si aplica.",
      data: ventaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una venta.
 */
const habilitarVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaHabilitada = await ventaService.habilitarVenta(Number(idVenta));
    res.status(200).json({
      success: true,
      message: "Venta habilitada exitosamente. El inventario ha sido ajustado si aplica.",
      data: ventaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una venta por su ID.
 */
const eliminarVentaFisica = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    await ventaService.eliminarVentaFisica(Number(idVenta));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Maneja el cambio del estado general (booleano) de una venta.
 * @param {import("express").Request} req - La solicitud de Express.
 * @param {import("express").Response} res - La respuesta de Express.
 * @param {import("express").NextFunction} next - La función next.
 */
const cambiarEstadoGeneralVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const { estado } = req.body;
    if (estado === undefined) {
      throw new BadRequestError("El campo 'estado' es requerido.");
    }

    const nuevoIdEstado = estado ? 1 : 2; // Asume 1=Activa/EnProceso, 2=Anulada
    const ventaActualizada = await ventaService.actualizarEstadoProcesoVenta(
      Number(idVenta),
      { idEstado: nuevoIdEstado }
    );
    res.status(200).json({
      success: true,
      message: "Estado general de la venta actualizado exitosamente.",
      data: ventaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

const listarVentasClienteMovil = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.idUsuario;
    const cliente = await db.Cliente.findOne({ where: { idUsuario: idUsuario } });

    if (!cliente) {
      throw new NotFoundError("No se encontró un perfil de cliente para este usuario.");
    }

    const ventas = await ventaService.findVentasByClienteIdMovil(cliente.idCliente);
    res.status(200).json({
      success: true,
      data: ventas,
    });
  } catch (error) {
    next(error);
  }
};

const obtenerVentaPorIdClienteMovil = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const idUsuario = req.user.idUsuario;
    const venta = await ventaService.obtenerVentaPorIdClienteMovil(Number(idVenta), idUsuario);
    res.status(200).json({
      success: true,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearVenta,
  listarVentas,
  obtenerVentaPorId,
  actualizarEstadoVenta,
  anularVenta,
  habilitarVenta,
  eliminarVentaFisica,
  cambiarEstadoGeneralVenta,
  listarVentasClienteMovil,
  obtenerVentaPorIdClienteMovil,
};