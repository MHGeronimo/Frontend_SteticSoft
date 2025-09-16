// src/controllers/cliente.controller.js
const { validationResult } = require("express-validator");
const clienteService = require("../services/cliente.service.js");
const db = require("../models"); 

/**
 * ✅ NUEVA FUNCIÓN: Busca clientes por un término de búsqueda.
 */
const buscarClientes = async (req, res, next) => {
  try {
    const { termino } = req.query; // El front-end enviará el término aquí
    if (!termino || termino.length < 3) {
      // Evitamos búsquedas vacías o demasiado cortas
      return res.status(200).json({ success: true, data: [] });
    }
    
    // Llamamos a una nueva función en el servicio que hará la búsqueda
    const clientes = await clienteService.buscarClientesPorTermino(termino);
    res.status(200).json({ success: true, data: clientes });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea un nuevo cliente.
 */
const crearCliente = async (req, res, next) => {
  // 1. Manejo de errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación detectados.",
      errors: errors.array(),
    });
  }

  // 2. Lógica de negocio
  try {
    const nuevoCliente = await clienteService.crearCliente(req.body);
    res.status(201).json({
      success: true,
      message: "Cliente creado exitosamente.",
      data: nuevoCliente,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todos los clientes, con soporte para paginación, búsqueda y filtrado por estado.
 */
const listarClientes = async (req, res, next) => {
  try {
    const { page, limit, search, estado } = req.query; 

    const opcionesDeFiltro = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined,
      where: {},
    };

    if (estado === "true") {
      opcionesDeFiltro.where.estado = true;
    } else if (estado === "false") {
      opcionesDeFiltro.where.estado = false;
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      opcionesDeFiltro.where[db.Sequelize.Op.or] = [
        { nombre: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { apellido: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { correo: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { telefono: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { numeroDocumento: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
      ];
    }
    const { totalItems, clientes, currentPage, totalPages } = await clienteService.obtenerTodosLosClientes(
      opcionesDeFiltro
    );

    res.status(200).json({
      success: true,
      message: "Clientes obtenidos exitosamente.",
      data: clientes,
      pagination: {
        totalItems,
        currentPage,
        totalPages,
        itemsPerPage: opcionesDeFiltro.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un cliente específico por su ID.
 */
const obtenerClientePorId = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const cliente = await clienteService.obtenerClientePorId(Number(idCliente));
    res.status(200).json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un cliente existente por su ID.
 */
const actualizarCliente = async (req, res, next) => {
  // 1. Manejo de errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación detectados.",
      errors: errors.array(),
    });
  }

  // 2. Lógica de negocio
  try {
    const { idCliente } = req.params;
    const clienteActualizado = await clienteService.actualizarCliente(
      Number(idCliente),
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Cliente actualizado exitosamente.",
      data: clienteActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de un cliente.
 */
const cambiarEstadoCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const { estado } = req.body; 

    const clienteActualizado = await clienteService.cambiarEstadoCliente(
      Number(idCliente),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del cliente ID ${idCliente} cambiado a ${estado} exitosamente.`,
      data: clienteActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un cliente (borrado lógico, estado = false).
 */
const anularCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const clienteAnulado = await clienteService.anularCliente(
      Number(idCliente)
    );
    res.status(200).json({
      success: true,
      message: "Cliente anulado (deshabilitado) exitosamente.",
      data: clienteAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un cliente (estado = true).
 */
const habilitarCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const clienteHabilitado = await clienteService.habilitarCliente(
      Number(idCliente)
    );
    res.status(200).json({
      success: true,
      message: "Cliente habilitado exitosamente.",
      data: clienteHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un cliente por su ID.
 */
const eliminarClienteFisico = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    await clienteService.eliminarClienteFisico(Number(idCliente));
    res.status(204).send(); 
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los clientes (sin paginación, para selects, etc).
 */
const obtenerTodosLosClientes = async (req, res, next) => {
  try {
    const clientes = await clienteService.obtenerTodosLosClientes();
    res.status(200).json({
      success: true,
      message: "Todos los clientes obtenidos exitosamente.",
      data: clientes,
    });
  } catch (error) {
    next(error);
  }
};

const getMiPerfil = async (req, res, next) => {
  try {
    // El perfil del cliente ya fue adjuntado en el login
    const clienteInfo = req.user.clienteInfo;
    if (!clienteInfo) {
      return res.status(404).json({ success: false, message: "Perfil de cliente no encontrado para este usuario." });
    }
    res.status(200).json({ success: true, data: clienteInfo });
  } catch (error) {
    next(error);
  }
};

const updateMiPerfil = async (req, res, next) => {
  try {
    const idCliente = req.user.clienteInfo?.idCliente;
    if (!idCliente) {
      return res.status(404).json({ success: false, message: "Perfil de cliente no encontrado para este usuario." });
    }
    const clienteActualizado = await clienteService.actualizarPerfilCliente(idCliente, req.body);
    res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente.",
      data: clienteActualizado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCliente,
  listarClientes,
  obtenerClientePorId,
  actualizarCliente,
  anularCliente,
  habilitarCliente,
  eliminarClienteFisico,
  cambiarEstadoCliente,
  obtenerTodosLosClientes,
  buscarClientes,
  getMiPerfil,
  updateMiPerfil,
};