// src/services/cita.service.js
"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const moment = require("moment-timezone");
const { enviarCorreoCita } = require("../utils/CitaEmailTemplate.js");
const { formatDateTime } = require("../utils/dateHelpers.js");

/**
 * @typedef {import('../models').Cita} Cita
 * @typedef {import('../models').Usuario} Usuario
 * @typedef {import('../models').Cliente} Cliente
 * @typedef {import('../models').Servicio} Servicio
 */

/**
 * Función auxiliar para obtener los detalles completos de una cita.
 * @param {number} idCita - El ID de la cita.
 * @param {import('sequelize').Transaction} [transaction=null] - Transacción de Sequelize opcional.
 * @returns {Promise<Cita|null>} La instancia de la cita con sus asociaciones.
 */
const obtenerCitaCompletaPorId = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "apellido", "correo"],
      },
      {
        model: db.Usuario,
        as: "empleado",
        required: false,
        attributes: ["idUsuario", "correo"],
        include: [
          {
            model: db.Empleado,
            as: "empleadoInfo",
            attributes: ["nombre", "apellido"],
          },
        ],
      },
      {
        model: db.Servicio,
        as: "servicios",
        attributes: ["idServicio", "nombre", "descripcion", "precio"],
        through: { attributes: [] },
      },
      {
        model: db.Estado,
        as: "estadoDetalle",
        attributes: ["idEstado", "nombreEstado"],
      },
    ],
    transaction,
  });
};

/**
 * Crea una nueva cita, valida la disponibilidad y envía una notificación por correo.
 * @param {object} datosCita - Datos para la nueva cita.
 * @returns {Promise<Cita>} La instancia de la cita recién creada.
 */
const crearCita = async (datosCita) => {
  const {
    fecha,
    horaInicio,
    idCliente,
    idUsuario,
    servicios = [],
    idNovedad,
    idEstado,
  } = datosCita;

  const transaction = await db.sequelize.transaction();
  try {
    // --- Validaciones de Negocio ---
    const cliente = await db.Cliente.findByPk(idCliente, { transaction });
    if (!cliente || !cliente.estado) {
      throw new BadRequestError(
        "El cliente especificado no existe o está inactivo."
      );
    }

    const estado = await db.Estado.findByPk(idEstado, { transaction });
    if (!estado) {
      throw new BadRequestError("El estado especificado no es válido.");
    }

    const novedad = await db.Novedad.findByPk(idNovedad, {
      include: [
        { model: db.Usuario, as: "empleados", attributes: ["idUsuario"] },
      ],
      transaction,
    });
    if (!novedad || !novedad.estado) {
      throw new BadRequestError(
        "La novedad (horario) seleccionada no existe o no está activa."
      );
    }

    // Validar si el empleado pertenece a la novedad
    if (idUsuario) {
      const esEmpleadoValido = novedad.empleados.some(
        (emp) => emp.idUsuario === idUsuario
      );
      if (!esEmpleadoValido) {
        throw new BadRequestError(
          "El empleado seleccionado no está disponible en este horario."
        );
      }
    }

    // Validar si la hora ya está ocupada
    const citaExistente = await db.Cita.findOne({
      where: { fecha, horaInicio, idNovedad },
      transaction,
    });
    if (citaExistente) {
      throw new ConflictError(
        "Este horario ya ha sido reservado. Por favor, selecciona otro."
      );
    }

    // Validar y calcular el precio total de los servicios
    const serviciosDb = await db.Servicio.findAll({
      where: { idServicio: servicios, estado: true },
      transaction,
    });
    if (serviciosDb.length !== servicios.length) {
      throw new BadRequestError(
        "Uno o más de los servicios seleccionados no existen o están inactivos."
      );
    }
    const precioTotal = serviciosDb.reduce(
      (total, s) => total + parseFloat(s.precio),
      0
    );

    // --- Creación de la Cita ---
    const nuevaCita = await db.Cita.create(
      {
        fecha,
        horaInicio,
        idCliente,
        idUsuario: idUsuario || null,
        idNovedad,
        idEstado,
        precioTotal,
      },
      { transaction }
    );

    await nuevaCita.setServicios(serviciosDb, { transaction });
    await transaction.commit();

    // --- Notificación por Correo (Post-transacción) ---
    const citaCompleta = await obtenerCitaCompletaPorId(nuevaCita.idCita);
    if (citaCompleta && cliente.correo) {
      const empleadoInfo = citaCompleta.empleado?.empleadoInfo;
      const nombreEmpleado = empleadoInfo
        ? `${empleadoInfo.nombre} ${empleadoInfo.apellido}`
        : "Por confirmar";

      enviarCorreoCita({
        correo: cliente.correo,
        nombreCliente: cliente.nombre,
        citaInfo: {
          accion: "registrada",
          fechaHora: formatDateTime(
            `${citaCompleta.fecha} ${citaCompleta.horaInicio}`
          ),
          estado: citaCompleta.estadoDetalle.nombreEstado,
          empleado: nombreEmpleado,
          servicios: citaCompleta.servicios.map((s) => s.toJSON()),
          total: citaCompleta.precioTotal,
        },
      }).catch((err) =>
        console.error("Error al enviar correo de confirmación de cita:", err)
      );
    }

    return citaCompleta;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof BadRequestError || error instanceof ConflictError)
      throw error;
    console.error("Error en el servicio al crear la cita:", error);
    throw new CustomError(`Error al crear la cita: ${error.message}`, 500);
  }
};

/**
 * Obtiene todas las citas con opciones de filtrado y búsqueda.
 * @param {object} opciones - Opciones de filtrado.
 * @returns {Promise<Cita[]>} Una lista de citas.
 */
const obtenerTodasLasCitas = async (opciones = {}) => {
  const { idCliente, idUsuario, idEstado, fecha, busqueda } = opciones;
  const whereClause = {};
  const includeWhereClause = {};

  if (idCliente) whereClause.idCliente = idCliente;
  if (idUsuario) whereClause.idUsuario = idUsuario;
  if (idEstado) whereClause.idEstado = idEstado;
  if (fecha) whereClause.fecha = fecha;

  if (busqueda) {
    const searchTerm = `%${busqueda}%`;
    includeWhereClause[Op.or] = [
      { "$cliente.nombre$": { [Op.iLike]: searchTerm } },
      { "$cliente.apellido$": { [Op.iLike]: searchTerm } },
      { "$empleado.empleadoInfo.nombre$": { [Op.iLike]: searchTerm } },
      { "$empleado.empleadoInfo.apellido$": { [Op.iLike]: searchTerm } },
    ];
  }

  try {
    return await db.Cita.findAll({
      where: { ...whereClause, ...includeWhereClause },
      include: [
        { model: db.Cliente, as: "cliente" },
        {
          model: db.Usuario,
          as: "empleado",
          required: false,
          include: [{ model: db.Empleado, as: "empleadoInfo" }],
        },
        { model: db.Servicio, as: "servicios", through: { attributes: [] } },
        { model: db.Estado, as: "estadoDetalle" },
      ],
      order: [
        ["fecha", "ASC"],
        ["horaInicio", "ASC"],
      ],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

/**
 * Obtiene una cita por su ID.
 * @param {number} idCita - El ID de la cita.
 * @returns {Promise<Cita>} La instancia de la cita.
 */
const obtenerCitaPorId = async (idCita) => {
  const cita = await obtenerCitaCompletaPorId(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }
  return cita;
};

/**
 * Actualiza los datos de una cita existente y notifica al cliente del cambio.
 * @param {number} idCita - El ID de la cita a actualizar.
 * @param {object} datosActualizar - Los nuevos datos para la cita.
 * @returns {Promise<Cita>} La instancia de la cita actualizada.
 */
const actualizarCita = async (idCita, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      throw new NotFoundError("Cita no encontrada para actualizar.");
    }

    const { servicios, ...datosPrincipales } = datosActualizar;

    // Actualizar campos principales
    await cita.update(datosPrincipales, { transaction });

    // Si se provee una lista de servicios, se actualizan
    if (servicios && Array.isArray(servicios)) {
      const serviciosDb = await db.Servicio.findAll({
        where: { idServicio: servicios, estado: true },
        transaction,
      });
      if (serviciosDb.length !== servicios.length) {
        throw new BadRequestError(
          "Uno o más servicios para actualizar no existen o están inactivos."
        );
      }
      await cita.setServicios(serviciosDb, { transaction });
      const nuevoPrecioTotal = serviciosDb.reduce(
        (total, s) => total + parseFloat(s.precio),
        0
      );
      await cita.update({ precioTotal: nuevoPrecioTotal }, { transaction });
    }

    await transaction.commit();

    // --- Notificación por Correo (Post-transacción) ---
    const citaActualizada = await obtenerCitaCompletaPorId(idCita);
    const cliente = citaActualizada.cliente;
    if (cliente && cliente.correo) {
      const empleadoInfo = citaActualizada.empleado?.empleadoInfo;
      const nombreEmpleado = empleadoInfo
        ? `${empleadoInfo.nombre} ${empleadoInfo.apellido}`
        : "Por confirmar";

      enviarCorreoCita({
        correo: cliente.correo,
        nombreCliente: cliente.nombre,
        citaInfo: {
          accion: "actualizada",
          fechaHora: formatDateTime(
            `${citaActualizada.fecha} ${citaActualizada.horaInicio}`
          ),
          estado: citaActualizada.estadoDetalle.nombreEstado,
          empleado: nombreEmpleado,
          servicios: citaActualizada.servicios.map((s) => s.toJSON()),
          total: citaActualizada.precioTotal,
        },
      }).catch((err) =>
        console.error("Error al enviar correo de actualización de cita:", err)
      );
    }

    return citaActualizada;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error("Error en servicio al actualizar cita:", error);
    throw new CustomError(`Error al actualizar la cita: ${error.message}`, 500);
  }
};

/**
 * Cambia el estado de una cita y notifica al cliente si se cancela.
 * @param {number} idCita - El ID de la cita.
 * @param {number} idNuevoEstado - El ID del nuevo estado.
 * @returns {Promise<Cita>} La cita con el estado actualizado.
 */
const cambiarEstadoCita = async (idCita, idNuevoEstado) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      throw new NotFoundError("Cita no encontrada.");
    }

    const nuevoEstado = await db.Estado.findByPk(idNuevoEstado, {
      transaction,
    });
    if (!nuevoEstado) {
      throw new BadRequestError("El estado proporcionado no es válido.");
    }

    await cita.update({ idEstado: idNuevoEstado }, { transaction });
    await transaction.commit();

    const citaActualizada = await obtenerCitaCompletaPorId(idCita);
    const cliente = citaActualizada.cliente;

    // Si se cancela la cita, enviar notificación
    if (
      nuevoEstado.nombreEstado.toLowerCase() === "cancelada" &&
      cliente &&
      cliente.correo
    ) {
      const empleadoInfo = citaActualizada.empleado?.empleadoInfo;
      const nombreEmpleado = empleadoInfo
        ? `${empleadoInfo.nombre} ${empleadoInfo.apellido}`
        : "Por confirmar";

      enviarCorreoCita({
        correo: cliente.correo,
        nombreCliente: cliente.nombre,
        citaInfo: {
          accion: "cancelada",
          fechaHora: formatDateTime(
            `${citaActualizada.fecha} ${citaActualizada.horaInicio}`
          ),
          estado: nuevoEstado.nombreEstado,
          empleado: nombreEmpleado,
          servicios: citaActualizada.servicios.map((s) => s.toJSON()),
          total: citaActualizada.precioTotal,
        },
      }).catch((err) =>
        console.error("Error al enviar correo de cancelación de cita:", err)
      );
    }

    return citaActualizada;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error("Error al cambiar estado de la cita:", error);
    throw new CustomError(`Error al cambiar el estado: ${error.message}`, 500);
  }
};

/**
 * Elimina una cita de forma permanente, si no está asociada a una venta.
 * @param {number} idCita - El ID de la cita a eliminar.
 * @returns {Promise<{mensaje: string}>} Mensaje de confirmación.
 */
const eliminarCitaFisica = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita);
    if (!cita) {
        throw new NotFoundError("Cita no encontrada para eliminar.");
    }

    // --- REGLA DE NEGOCIO: Solo se puede eliminar después de una semana ---
    const ahora = moment();
    const fechaCita = moment(cita.fechaHora);
    if (ahora.diff(fechaCita, 'days') < 7) {
        throw new ForbiddenError("Las citas solo se pueden eliminar una semana después de haberse realizado.");
    }
    // --- FIN DE LA REGLA ---

    await db.Cita.destroy({ where: { idCita } });

    const ventasAsociadas = await db.VentaXServicio.count({
      where: { idCita },
      transaction,
    });
    if (ventasAsociadas > 0) {
      throw new ConflictError(
        `No se puede eliminar la cita porque está asociada a ${ventasAsociadas} venta(s). Considere cancelarla en su lugar.`
      );
    }

    await cita.destroy({ transaction });
    await transaction.commit();
    return { mensaje: "Cita eliminada permanentemente." };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    console.error("Error al eliminar cita:", error);
    throw new CustomError(`Error al eliminar la cita: ${error.message}`, 500);
  }
};

/**
 * Obtiene todas las citas de un cliente específico.
 * @param {number} idCliente - El ID del cliente.
 * @returns {Promise<Cita[]>} Una lista de citas del cliente.
 */
const obtenerCitasPorCliente = async (idCliente) => {
  try {
    return await db.Cita.findAll({
      where: { idCliente },
      include: [
        { model: db.Cliente, as: "cliente" },
        {
          model: db.Usuario,
          as: "empleado",
          required: false,
          include: [{ model: db.Empleado, as: "empleadoInfo" }],
        },
        { model: db.Servicio, as: "servicios", through: { attributes: [] } },
        { model: db.Estado, as: "estadoDetalle" },
      ],
      order: [
        ["fecha", "DESC"],
        ["horaInicio", "DESC"],
      ],
    });
  } catch (error) {
    console.error("Error al obtener las citas del cliente:", error);
    throw new CustomError(`Error al obtener las citas del cliente: ${error.message}`, 500);
  }
};

/**
 * Crea una nueva cita para un cliente específico, asignando el idCliente desde el controlador.
 * @param {object} datosCita - Datos para la nueva cita.
 * @param {number} idClienteAuth - El ID del cliente autenticado.
 * @returns {Promise<Cita>} La instancia de la cita recién creada.
 */
const crearCitaParaCliente = async (datosCita, idClienteAuth) => {
    // Forzamos el uso del idCliente del usuario autenticado
    const datosCitaSeguros = { ...datosCita, idCliente: idClienteAuth };

    // Reutilizamos la lógica de la función `crearCita` existente
    return crearCita(datosCitaSeguros);
};

/**
 * Obtiene una cita por su ID, asegurándose de que pertenezca al cliente especificado.
 * @param {number} idCita - El ID de la cita.
 * @param {number} idCliente - El ID del cliente que solicita.
 * @returns {Promise<Cita>} La instancia de la cita.
 */
const obtenerCitaDeClientePorId = async (idCita, idCliente) => {
  const cita = await obtenerCitaCompletaPorId(idCita);

  if (!cita || cita.idCliente !== idCliente) {
    // Se lanza NotFoundError para no revelar la existencia de la cita a usuarios no autorizados.
    throw new NotFoundError("Cita no encontrada.");
  }

  return cita;
};


/**
 * Lista citas por cliente (móvil).
 */
const listarPorCliente = async (idCliente) => {
  return await obtenerCitasPorCliente(idCliente);
};

/**
 * Crea una cita para cliente (móvil).
 */
const crearParaCliente = async (idCliente, datosCita) => {
  return await crearCitaParaCliente(datosCita, idCliente);
};

/**
 * Lista novedades agendables (móvil).
 */
const listarNovedadesAgendablesMovil = async () => {
  try {
    return await db.Novedad.findAll({
      where: { estado: true },
      include: [
        {
          model: db.Usuario,
          as: "empleados",
          attributes: ["idUsuario"],
          include: [
            {
              model: db.Empleado,
              as: "empleadoInfo",
              attributes: ["nombre", "apellido"],
            },
          ],
        },
      ],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener novedades agendables:", error);
    throw new CustomError(`Error al obtener novedades agendables: ${error.message}`, 500);
  }
};

/**
 * Lista días disponibles (móvil).
 */
const listarDiasDisponiblesMovil = async (novedadId, mes, anio) => {
  try {
    // Esta función debería implementar la lógica para obtener días disponibles
    // Por ahora retornamos un array vacío, pero debería conectarse con la lógica de novedades
    return [];
  } catch (error) {
    console.error("Error al obtener días disponibles:", error);
    throw new CustomError(`Error al obtener días disponibles: ${error.message}`, 500);
  }
};

/**
 * Lista horas disponibles (móvil).
 */
const listarHorasDisponiblesMovil = async (novedadId, fecha) => {
  try {
    // Esta función debería implementar la lógica para obtener horas disponibles
    // Por ahora retornamos un array vacío, pero debería conectarse con la lógica de novedades
    return [];
  } catch (error) {
    console.error("Error al obtener horas disponibles:", error);
    throw new CustomError(`Error al obtener horas disponibles: ${error.message}`, 500);
  }
};

/**
 * Cancela una cita de cliente (móvil).
 */
const cancelarCitaDeClienteMovil = async (idCliente, idCita) => {
  try {
    const cita = await obtenerCitaDeClientePorId(idCita, idCliente);
    // Buscar el estado "Cancelada"
    const estadoCancelada = await db.Estado.findOne({
      where: { nombreEstado: "Cancelada" }
    });
    if (!estadoCancelada) {
      throw new BadRequestError("Estado 'Cancelada' no encontrado en el sistema.");
    }
    return await cambiarEstadoCita(idCita, estadoCancelada.idEstado);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
    console.error("Error al cancelar cita de cliente:", error);
    throw new CustomError(`Error al cancelar cita: ${error.message}`, 500);
  }
};

/**
 * ✅ NUEVA LÓGICA DE NEGOCIO PARA CANCELAR
 * Cambia el estado de una cita a "Cancelada".
 * @param {number} idCita - ID de la cita a cancelar.
 * @returns {Promise<object>} La cita actualizada.
 */
const cancelarCita = async (idCita) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cita = await db.Cita.findByPk(idCita, { transaction });
        if (!cita) throw new NotFoundError("Cita no encontrada.");

        // --- REGLA DE NEGOCIO: No se puede cancelar un día antes ---
        const ahora = moment();
        const fechaCita = moment(cita.fechaHora);
        if (fechaCita.diff(ahora, 'hours') < 24) {
            throw new ForbiddenError("Las citas no se pueden cancelar con menos de 24 horas de antelación.");
        }
        // --- FIN DE LA REGLA ---

        const estadoCancelado = await db.Estado.findOne({ where: { nombreEstado: 'Cancelado' }, transaction });
        if (!estadoCancelado) throw new CustomError("El estado 'Cancelado' no está configurado.", 500);

        await cita.update({ idEstado: estadoCancelado.idEstado }, { transaction });
        
        await transaction.commit();
        
        // Lógica de envío de correo
        const citaCompleta = await obtenerCitaCompletaPorIdInterno(idCita);
        if (citaCompleta && citaCompleta.cliente.correo) {
             enviarCorreoCita({
                correo: citaCompleta.cliente.correo,
                nombreCliente: citaCompleta.cliente.nombre,
                citaInfo: { /* ... datos para el correo de cancelación ... */ }
             });
        }
        return citaCompleta;

    } catch (error) {
        await transaction.rollback();
        throw error; // Re-lanza el error para que el controlador lo maneje
    }
};

module.exports = {
  crearCita,
  obtenerTodasLasCitas,
  obtenerCitasPorCliente,
  obtenerCitaPorId,
  actualizarCita,
  cambiarEstadoCita,
  eliminarCitaFisica,
  crearCitaParaCliente,
  obtenerCitaDeClientePorId,
  // Funciones móviles
  listarPorCliente,
  crearParaCliente,
  listarNovedadesAgendablesMovil,
  listarDiasDisponiblesMovil,
  listarHorasDisponiblesMovil,
  cancelarCitaDeClienteMovil,
  cancelarCita,
  // Funciones de consulta para el formulario que no cambian
  obtenerDiasDisponiblesPorNovedad: require("./novedades.service.js")
    .obtenerDiasDisponibles,
  obtenerHorariosDisponiblesPorNovedad: require("./novedades.service.js")
    .obtenerHorasDisponibles,
  obtenerEmpleadosPorNovedad: require("./novedades.service.js")
    .obtenerEmpleadosPorNovedad,
  buscarClientes: require("./cliente.service.js").buscarClientesPorTermino,
  obtenerServiciosDisponibles: require("./servicio.service.js")
    .obtenerServiciosDisponibles,
};
