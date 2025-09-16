// src/services/abastecimiento.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { Abastecimiento, Producto, Usuario, Rol, Empleado, sequelize } = db;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

// --- CREAR ABASTECIMIENTO ---
const crearAbastecimiento = async (datosAbastecimiento) => {
  const { idProducto, cantidad, fechaIngreso, estado, empleadoAsignado } =
    datosAbastecimiento;

  const producto = await Producto.findByPk(idProducto);
  if (!producto)
    throw new BadRequestError(`Producto con ID ${idProducto} no encontrado.`);
  if (!producto.estado)
    throw new BadRequestError(`Producto '${producto.nombre}' no está activo.`);

  if (producto.tipoUso?.toLowerCase() !== "interno") {
    throw new BadRequestError(
      `El producto '${producto.nombre}' (ID: ${idProducto}) no es de tipo 'Interno' y no puede ser asignado mediante este módulo de abastecimiento.`
    );
  }

  if (producto.existencia < cantidad) {
    throw new ConflictError(
      `No hay suficiente stock para '${producto.nombre}'. Solicitado: ${cantidad}, Disponible: ${producto.existencia}.`
    );
  }

  const transaction = await sequelize.transaction();
  try {
    const nuevoAbastecimiento = await Abastecimiento.create(
      {
        idProducto: idProducto,
        cantidad: Number(cantidad),
        fechaIngreso: fechaIngreso || new Date(),
        estaAgotado: false,
        estado: typeof estado === "boolean" ? estado : true,
        idUsuario: empleadoAsignado, // Se usa el campo correcto del modelo
      },
      { transaction }
    );

    await producto.decrement("existencia", {
      by: Number(cantidad),
      transaction,
    });
    await transaction.commit();

    const productoActualizado = await Producto.findByPk(idProducto);
    if (productoActualizado) {
      await checkAndSendStockAlert(
        productoActualizado,
        `tras abastecimiento ID ${nuevoAbastecimiento.idAbastecimiento}`
      );
    }

    return nuevoAbastecimiento;
  } catch (error) {
    await transaction.rollback();
    console.error("Error detallado al crear abastecimiento:", error);
    throw new CustomError(
      `Error al crear el abastecimiento: ${error.message}`,
      500
    );
  }
};


// --- OBTENER TODOS LOS ABASTECIMIENTOS (VERSIÓN DEFINITIVA) ---
const obtenerTodosLosAbastecimientos = async (opcionesDeFiltro = {}) => {
  const { page = 1, limit = 10, search, estado } = opcionesDeFiltro;
  const offset = (page - 1) * limit;

  let whereClause = {};
  if (estado !== undefined && estado !== 'todos') {
    whereClause.estado = estado === 'activos';
  }

  if (search) {
    whereClause[Op.or] = [
      { '$producto.nombre$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.correo$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.empleadoInfo.nombre$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.empleadoInfo.apellido$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows } = await Abastecimiento.findAndCountAll({
      where: whereClause,
      include: [
        { 
            model: Producto, 
            as: "producto" 
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ['id_usuario', 'correo'],
          include: [
            { model: Rol, as: "rol", attributes: ['nombre'] },
            { model: Empleado, as: "empleadoInfo", attributes: ['nombre', 'apellido'], required: true }
          ]
        }
      ],
      order: [["fechaIngreso", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      subQuery: false // Clave para el correcto funcionamiento de JOINs con filtros
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    };
  } catch (error) {
    console.error("Error al obtener todos los abastecimientos:", error);
    throw new CustomError(`Error al obtener abastecimientos: ${error.message}`, 500);
  }
};


// --- OBTENER ABASTECIMIENTO POR ID (CON SINTAXIS EXPLÍCITA) ---
const obtenerAbastecimientoPorId = async (idAbastecimiento) => {
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, {
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["idProducto", "nombre", "stockMinimo", "existencia"],
        },
        {
          model: Usuario,
          as: "usuario",
          include: [
              { model: Rol, as: "rol" },
              { model: Empleado, as: "empleadoInfo" }
          ]
        }
      ],
    });
    if (!abastecimiento)
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    return abastecimiento;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al obtener el abastecimiento con ID ${idAbastecimiento}:`, error.message);
    throw new CustomError(`Error al obtener el abastecimiento: ${error.message}`, 500);
  }
};

// --- ACTUALIZAR ABASTECIMIENTO ---
const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
    const { estaAgotado, razonAgotamiento, fechaAgotamiento, estado, cantidad, empleadoAsignado } = datosActualizar;
    const transaction = await sequelize.transaction();
    try {
        const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, { transaction });
        if (!abastecimiento) {
            await transaction.rollback();
            throw new NotFoundError("Registro de abastecimiento no encontrado.");
        }

        const producto = await Producto.findByPk(abastecimiento.idProducto, { transaction });
        if (!producto) {
            await transaction.rollback();
            throw new BadRequestError(`Producto asociado (ID: ${abastecimiento.idProducto}) no encontrado.`);
        }

        const estadoOriginal = abastecimiento.estado;
        const cantidadOriginal = abastecimiento.cantidad;
        const camposAActualizar = {};

        if (estaAgotado !== undefined) camposAActualizar.estaAgotado = estaAgotado;
        if (empleadoAsignado !== undefined) camposAActualizar.idUsuario = empleadoAsignado;
        if (estaAgotado === true) {
            if (razonAgotamiento !== undefined) camposAActualizar.razonAgotamiento = razonAgotamiento;
            if (fechaAgotamiento !== undefined) camposAActualizar.fechaAgotamiento = fechaAgotamiento;
        } else if (estaAgotado === false) {
            camposAActualizar.razonAgotamiento = null;
            camposAActualizar.fechaAgotamiento = null;
        }

        const nuevoEstado = datosActualizar.hasOwnProperty("estado") ? estado : abastecimiento.estado;
        const nuevaCantidad = datosActualizar.hasOwnProperty("cantidad") ? Number(cantidad) : abastecimiento.cantidad;
        camposAActualizar.estado = nuevoEstado;
        camposAActualizar.cantidad = nuevaCantidad;

        await abastecimiento.update(camposAActualizar, { transaction });

        let diferencia = 0;
        if (estadoOriginal && nuevoEstado) {
            diferencia = cantidadOriginal - nuevaCantidad;
        } else if (!estadoOriginal && nuevoEstado) {
            diferencia = -nuevaCantidad;
        } else if (estadoOriginal && !nuevoEstado) {
            diferencia = cantidadOriginal;
        }

        if (diferencia !== 0) {
            if (diferencia > 0) {
                await producto.increment("existencia", { by: diferencia, transaction });
            } else {
                if (producto.existencia < Math.abs(diferencia)) {
                    throw new ConflictError(`Stock insuficiente para ajustar. Requerido: ${Math.abs(diferencia)}, Disponible: ${producto.existencia}.`);
                }
                await producto.decrement("existencia", { by: Math.abs(diferencia), transaction });
            }
        }
        await transaction.commit();
        return obtenerAbastecimientoPorId(idAbastecimiento);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// --- ELIMINAR ABASTECIMIENTO ---
const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
    const transaction = await sequelize.transaction();
    try {
        const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, { transaction });
        if (!abastecimiento) {
            await transaction.rollback();
            throw new NotFoundError("Abastecimiento no encontrado.");
        }
        if (abastecimiento.estado) {
            await Producto.increment('existencia', { by: abastecimiento.cantidad, where: { idProducto: abastecimiento.idProducto }, transaction });
        }
        await abastecimiento.destroy({ transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// --- AGOTAR ABASTECIMIENTO ---
const agotarAbastecimiento = async (idAbastecimiento, razonAgotamiento) => {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento);
    if (!abastecimiento) throw new NotFoundError(`Abastecimiento con ID ${idAbastecimiento} no encontrado.`);
    if (abastecimiento.estaAgotado) throw new ConflictError(`El abastecimiento ya está marcado como agotado.`);
    abastecimiento.estaAgotado = true;
    abastecimiento.razonAgotamiento = razonAgotamiento || null;
    abastecimiento.fechaAgotamiento = new Date();
    await abastecimiento.save();
    return abastecimiento;
};

// --- OBTENER EMPLEADOS (VERSIÓN DEFINITIVA) ---
const obtenerEmpleados = async () => {
    try {
      const usuarios = await Usuario.findAll({
        include: [
          {
            model: Rol,
            as: 'rol',
            where: { nombre: 'Empleado' }
          },
          {
            model: Empleado,
            as: 'empleadoInfo',
            required: true // Solo trae usuarios que tienen un perfil de empleado asociado
          }
        ],
        attributes: ['id_usuario', 'correo']
      });
      return usuarios;
    } catch (error) {
      console.error("Error al obtener la lista de empleados:", error);
      throw new CustomError(`Error al obtener la lista de empleados: ${error.message}`, 500);
    }
};

module.exports = {
  crearAbastecimiento,
  obtenerTodosLosAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  eliminarAbastecimientoFisico,
  agotarAbastecimiento,
  obtenerEmpleados
};