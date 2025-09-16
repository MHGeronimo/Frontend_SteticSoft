"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
    NotFoundError,
    ConflictError,
    CustomError,
    BadRequestError,
    UnauthorizedError,
} = require("../errors");
const moment = require("moment-timezone");
const { enviarCorreoVenta } = require("../utils/VentaEmailTemplate.js");
const { formatDate } = require("../utils/dateHelpers.js");
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

const TASA_IVA_POR_DEFECTO = 0.19;

const obtenerVentaCompletaPorId = async (idVenta, transaction = null) => {
    return db.Venta.findByPk(idVenta, {
        include: [
            {
                model: db.Cliente,
                as: "cliente",
                // ✅ SOLUCIÓN FINAL CON ALIASING:
                // Le decimos a Sequelize el nombre exacto de la columna en la BD y el nombre que queremos en el resultado.
                attributes: [
                    "idCliente", 
                    "nombre", 
                    "apellido", 
                    "correo", 
                    "estado",
                    ["numero_documento", "numeroDocumento"], // [nombre_en_bd, nombre_para_js]
                    ["telefono", "telefono"],
                    ["direccion", "direccion"]
                ],
            },
            {
                model: db.Dashboard,
                as: "dashboard",
                attributes: ["idDashboard", "nombreDashboard"],
            },
            {
                model: db.Estado,
                as: "estadoDetalle",
                attributes: ["idEstado", "nombreEstado"],
            },
            {
                model: db.Producto,
                as: "productos",
                attributes: ["idProducto", "nombre", "descripcion", "precio", "stockMinimo", "existencia"],
                through: {
                    model: db.ProductoXVenta,
                    as: "detalleProductoVenta",
                    attributes: ["cantidad", "valorUnitario"],
                },
            },
            {
                model: db.Servicio,
                as: "servicios",
                attributes: ["idServicio", "nombre", "descripcion", "precio"],
                through: {
                    model: db.VentaXServicio,
                    as: "detalleServicioVenta",
                    attributes: ["valorServicio", "idCita"],
                },
            },
        ],
        transaction,
    });
};

const obtenerTodasLasVentas = async (opcionesDeFiltro = {}) => {
    try {
        const whereClause = {};
        if (opcionesDeFiltro.idEstado) { whereClause.idEstado = opcionesDeFiltro.idEstado; }
        if (opcionesDeFiltro.idCliente) { whereClause.idCliente = opcionesDeFiltro.idCliente; }
        if (opcionesDeFiltro.idDashboard) { whereClause.idDashboard = opcionesDeFiltro.idDashboard; }

        return await db.Venta.findAll({
            where: whereClause,
            include: [
                {
                    model: db.Cliente,
                    as: "cliente",
                    // ✅ SOLUCIÓN FINAL CON ALIASING:
                    attributes: [
                        "idCliente", 
                        "nombre", 
                        "apellido", 
                        ["numero_documento", "numeroDocumento"] // [nombre_en_bd, nombre_para_js]
                    ],
                },
                {
                    model: db.Dashboard,
                    as: "dashboard",
                    attributes: ["idDashboard", "nombreDashboard"],
                },
                {
                    model: db.Estado,
                    as: "estadoDetalle",
                    attributes: ["idEstado", "nombreEstado"],
                },
                {
                    model: db.Producto,
                    as: "productos",
                    attributes: ["idProducto", "nombre", "stockMinimo", "existencia"],
                    through: {
                        model: db.ProductoXVenta,
                        as: "detalleProductoVenta",
                        attributes: ["cantidad", "valorUnitario"],
                    },
                },
                {
                    model: db.Servicio,
                    as: "servicios",
                    attributes: ["idServicio", "nombre"],
                    through: {
                        model: db.VentaXServicio,
                        as: "detalleServicioVenta",
                        attributes: ["valorServicio"],
                    },
                },
            ],
            order: [["fecha", "DESC"], ["idVenta", "DESC"]],
        });
    } catch (error) {
        console.error("Error al obtener todas las ventas:", error.message);
        throw new CustomError(`Error al obtener ventas: ${error.message}`, 500);
    }
};

const obtenerVentaPorId = async (idVenta) => {
    const venta = await obtenerVentaCompletaPorId(idVenta);
    if (!venta) {
        throw new NotFoundError("Venta no encontrada.");
    }
    return venta;
};

const crearVenta = async (datosVenta, user) => {
    const { fecha, idCliente, idDashboard, idEstado, productos = [], servicios = [] } = datosVenta;

    // Ownership check for clients
    if (user && user.rolNombre === 'Cliente') {
        const clienteIdFromToken = user.clienteInfo?.idCliente;
        if (!clienteIdFromToken || clienteIdFromToken !== idCliente) {
            throw new UnauthorizedError("No tienes permiso para crear una venta para otro cliente.");
        }
    }

    if (productos.length === 0 && servicios.length === 0) {
        throw new BadRequestError("Una venta debe tener al menos un producto o un servicio.");
    }
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente || !cliente.estado) {
        throw new BadRequestError(`Cliente con ID ${idCliente} no encontrado o inactivo.`);
    }
    const estadoProcesoVenta = await db.Estado.findByPk(idEstado);
    if (!estadoProcesoVenta) {
        throw new BadRequestError(`Estado de venta con ID ${idEstado} no encontrado.`);
    }

    const transaction = await db.sequelize.transaction();
    try {
        let subtotalCalculado = 0;
        const productosParaCrearDetalle = [];
        const serviciosParaCrearDetalle = [];
        const productosAfectadosParaAlerta = new Set();

        for (const itemP of productos) {
            const productoDB = await db.Producto.findByPk(itemP.idProducto, { transaction });
            if (!productoDB) throw new BadRequestError(`Producto con ID ${itemP.idProducto} no encontrado.`);
            if (!productoDB.estado) throw new BadRequestError(`Producto '${productoDB.nombre}' (ID: ${itemP.idProducto}) no está activo.`);
            if (productoDB.existencia < itemP.cantidad) {
                throw new ConflictError(`No hay suficiente existencia para el producto '${productoDB.nombre}'.`);
            }
            productosParaCrearDetalle.push({
                idProducto: itemP.idProducto,
                cantidad: Number(itemP.cantidad),
                valorUnitario: Number(productoDB.precio),
                dbInstance: productoDB,
            });
            subtotalCalculado += Number(itemP.cantidad) * Number(productoDB.precio);
        }

        for (const itemS of servicios) {
            const servicioDB = await db.Servicio.findByPk(itemS.idServicio, { transaction });
            if (!servicioDB) throw new BadRequestError(`Servicio con ID ${itemS.idServicio} no encontrado.`);
            serviciosParaCrearDetalle.push({
                idServicio: itemS.idServicio,
                valorServicio: Number(servicioDB.precio),
                idCita: itemS.idCita || null,
            });
            subtotalCalculado += Number(servicioDB.precio);
        }

        const ivaCalculado = subtotalCalculado * TASA_IVA_POR_DEFECTO;
        const totalCalculado = subtotalCalculado + ivaCalculado;
        
        const nuevaVenta = await db.Venta.create({
            fecha: fecha || new Date(),
            idCliente,
            idDashboard: idDashboard || null,
            idEstado,
            total: Number(totalCalculado),
            iva: Number(ivaCalculado),
        }, { transaction });

        const esEstadoProcesable = ["Completado", "En proceso"].includes(estadoProcesoVenta.nombreEstado);

        for (const itemP of productosParaCrearDetalle) {
            await db.ProductoXVenta.create({
                idVenta: nuevaVenta.idVenta,
                idProducto: itemP.idProducto,
                cantidad: itemP.cantidad,
                valorUnitario: Number(itemP.valorUnitario),
            }, { transaction });
            if (esEstadoProcesable) {
                await itemP.dbInstance.decrement("existencia", { by: itemP.cantidad, transaction });
                productosAfectadosParaAlerta.add(itemP.dbInstance.idProducto);
            }
        }

        for (const itemS of serviciosParaCrearDetalle) {
            await db.VentaXServicio.create({
                idVenta: nuevaVenta.idVenta,
                idServicio: itemS.idServicio,
                valorServicio: Number(itemS.valorServicio),
                idCita: itemS.idCita,
            }, { transaction });
        }

        await transaction.commit();

        if (esEstadoProcesable) {
            for (const productoId of productosAfectadosParaAlerta) {
                const productoActualizado = await db.Producto.findByPk(productoId);
                if (productoActualizado) {
                    await checkAndSendStockAlert(productoActualizado, `tras venta ID ${nuevaVenta.idVenta}`);
                }
            }
        }
        
        return await obtenerVentaCompletaPorId(nuevaVenta.idVenta);
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof ConflictError) { throw error; }
        console.error("Error al crear la venta en el servicio:", error.message, error.stack);
        throw new CustomError(`Error al crear la venta: ${error.message}`, 500);
    }
};

const actualizarEstadoProcesoVenta = async (idVenta, datosActualizar) => {
    const { idEstado } = datosActualizar;
    if (idEstado === undefined) {
        throw new BadRequestError("Se requiere 'idEstado' (estado del proceso) para actualizar.");
    }
    const transaction = await db.sequelize.transaction();
    try {
        let venta = await db.Venta.findByPk(idVenta, {
            include: [
                { model: db.Estado, as: "estadoDetalle" },
                {
                    model: db.Producto,
                    as: "productos",
                    through: {
                        model: db.ProductoXVenta,
                        as: "detalleProductoVenta",
                        attributes: ["cantidad"],
                    },
                },
            ],
            transaction,
        });
        if (!venta) {
            await transaction.rollback();
            throw new NotFoundError("Venta no encontrada para actualizar estado.");
        }
        const estadoOriginalDB = venta.estadoDetalle;
        const nuevoEstadoProcesoDB = await db.Estado.findByPk(idEstado, { transaction });
        if (!nuevoEstadoProcesoDB) {
            await transaction.rollback();
            throw new BadRequestError(`El nuevo estado de proceso con ID ${idEstado} no existe.`);
        }
        const esEstadoProcesableOriginal = ["Completado", "En proceso"].includes(estadoOriginalDB.nombreEstado);
        const esEstadoProcesableNuevo = ["Completado", "En proceso"].includes(nuevoEstadoProcesoDB.nombreEstado);
        await venta.update({ idEstado }, { transaction });
        if (esEstadoProcesableOriginal !== esEstadoProcesableNuevo && venta.productos) {
            for (const pV of venta.productos) {
                const cantVendida = pV.detalleProductoVenta.cantidad;
                if (esEstadoProcesableNuevo) {
                    await db.Producto.decrement("existencia", { by: cantVendida, where: { idProducto: pV.idProducto }, transaction });
                } else {
                    await db.Producto.increment("existencia", { by: cantVendida, where: { idProducto: pV.idProducto }, transaction });
                }
            }
        }
        await transaction.commit();
        return await obtenerVentaCompletaPorId(idVenta);
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError || error instanceof BadRequestError) { throw error; }
        console.error(`Error al actualizar estado de la venta con ID ${idVenta}:`, error.message, error.stack);
        throw new CustomError(`Error al actualizar estado de la venta: ${error.message}`, 500);
    }
};

const anularVenta = async (idVenta) => {
    const idEstadoAnulada = 4;
    return actualizarEstadoProcesoVenta(idVenta, { idEstado: idEstadoAnulada });
};

const habilitarVenta = async (idVenta) => {
    const idEstadoActiva = 1;
    return actualizarEstadoProcesoVenta(idVenta, { idEstado: idEstadoActiva });
};

const eliminarVentaFisica = async (idVenta) => {
    const transaction = await db.sequelize.transaction();
    try {
        const venta = await db.Venta.findByPk(idVenta, {
            include: [
                { model: db.Estado, as: "estadoDetalle" },
                {
                    model: db.Producto,
                    as: "productos",
                    through: {
                        model: db.ProductoXVenta,
                        as: "detalleProductoVenta",
                        attributes: ["cantidad"],
                    },
                },
            ],
            transaction,
        });
        if (!venta) {
            await transaction.rollback();
            throw new NotFoundError("Venta no encontrada para eliminar.");
        }

        const ventaOriginalProcesable = ["Completado", "En proceso"].includes(venta.estadoDetalle?.nombreEstado);
        if (ventaOriginalProcesable && venta.productos) {
            for (const pV of venta.productos) {
                await db.Producto.increment("existencia", { by: pV.detalleProductoVenta.cantidad, where: {idProducto: pV.idProducto}, transaction });
            }
        }
        const filasEliminadas = await db.Venta.destroy({ where: { idVenta }, transaction });
        await transaction.commit();
        return filasEliminadas;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError) throw error;
        console.error(`Error al eliminar físicamente la venta con ID ${idVenta}:`, error.message, error.stack);
        throw new CustomError(`Error al eliminar físicamente la venta: ${error.message}`, 500);
    }
};

const findVentasByClienteIdMovil = async (idCliente) => {
    if (!idCliente) {
        throw new BadRequestError("El ID del cliente es requerido.");
    }
    return await db.Venta.findAll({
        where: { idCliente: idCliente },
        include: [
            {
                model: db.Estado,
                as: "estadoDetalle",
                attributes: ["idEstado", "nombreEstado"],
            },
            {
                model: db.Producto,
                as: "productos",
                attributes: ["idProducto", "nombre"],
                through: {
                    model: db.ProductoXVenta,
                    as: "detalleProductoVenta",
                    attributes: ["cantidad", "valorUnitario"],
                },
            },
            {
                model: db.Servicio,
                as: "servicios",
                attributes: ["idServicio", "nombre"],
                through: {
                    model: db.VentaXServicio,
                    as: "detalleServicioVenta",
                    attributes: ["valorServicio"],
                },
            },
        ],
        order: [["fecha", "DESC"]],
    });
};

const obtenerVentaPorIdClienteMovil = async (idVenta, idUsuario) => {
    const cliente = await db.Cliente.findOne({ where: { idUsuario } });
    if (!cliente) {
        throw new NotFoundError("No se encontró un perfil de cliente para este usuario.");
    }

    const venta = await obtenerVentaCompletaPorId(idVenta);
    if (!venta) {
        throw new NotFoundError("Venta no encontrada.");
    }

    if (venta.idCliente !== cliente.idCliente) {
        throw new UnauthorizedError("No tienes permiso para ver esta venta.");
    }

    return venta;
};

/**
 * Lista ventas por cliente (móvil).
 */
const listarPorCliente = async (idCliente) => {
    return await findVentasByClienteIdMovil(idCliente);
};

module.exports = {
    crearVenta,
    obtenerTodasLasVentas,
    obtenerVentaPorId,
    actualizarEstadoProcesoVenta,
    anularVenta,
    habilitarVenta,
    eliminarVentaFisica,
    findVentasByClienteIdMovil,
    obtenerVentaPorIdClienteMovil,
    listarPorCliente,
};