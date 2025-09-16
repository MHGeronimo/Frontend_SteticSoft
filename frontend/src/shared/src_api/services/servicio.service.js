// src/services/servicio.service.js
const db = require("../models");
const { Op, Sequelize } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const fs = require("fs");
const path = require("path");
const {
  deleteByPublicId,
  extractPublicIdFromUrl,
} = require("../utils/cloudinary.util");

const crearServicio = async (datosServicio) => {
  const {
    nombre,
    precio,
    idCategoriaServicio,
    descripcion,
    imagen,
    imagenPublicId,
  } = datosServicio;

  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio =
    await db.CategoriaServicio.findByPk(idCategoriaServicio);
  if (!categoriaServicio || !categoriaServicio.estado) {
    throw new BadRequestError(
      "La categoría de servicio no existe o no está activa."
    );
  }

  try {
    const servicioParaCrear = {
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      precio: parseFloat(precio).toFixed(2),
      idCategoriaServicio: parseInt(idCategoriaServicio),
      imagen: imagen || null,
      imagenPublicId: imagenPublicId || null,
      estado: true,
    };

    return await db.Servicio.create(servicioParaCrear);
  } catch (error) {
    console.error("Error al crear el servicio:", error);
    throw new CustomError(
      `Error en el servidor al crear el servicio: ${error.message}`,
      500
    );
  }
};

const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const { busqueda, estado, idCategoriaServicio } = opcionesDeFiltro;
  const whereClause = {};

  if (estado === "true" || estado === "false") {
    whereClause.estado = estado === "true";
  } else if (estado === "Activo") {
    whereClause.estado = true;
  } else if (estado === "Inactivo") {
    whereClause.estado = false;
  }

  if (idCategoriaServicio) {
    whereClause.id_categoria_servicio = idCategoriaServicio;
  }

  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
      Sequelize.where(Sequelize.cast(Sequelize.col("precio"), "text"), {
        [Op.iLike]: `%${busqueda}%`,
      }),
    ];
  }

  try {
    return await db.Servicio.findAll({
      where: whereClause,
      include: [
        {
          model: db.CategoriaServicio,
          as: "categoria",
          attributes: ["id_categoria_servicio", "nombre", "estado"],
        },
      ],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todos los servicios:", error);
    throw new CustomError(`Error al obtener servicios: ${error.message}`, 500);
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Obtiene solo los servicios activos (estado=true).
 * Reutiliza la función existente para mantener el código limpio.
 */
const obtenerServiciosDisponibles = async () => {
  return await obtenerTodosLosServicios({ estado: "true" });
};

const obtenerServicioPorId = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio, {
    include: [{ model: db.CategoriaServicio, as: "categoria" }],
  });
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  return servicio;
};
const actualizarServicio = async (idServicio, datosActualizar) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado para actualizar.");
  }

  // Si hay nueva imagen y publicId anterior, elimina la imagen anterior de Cloudinary
  if (
    datosActualizar.imagenPublicId &&
    servicio.imagenPublicId &&
    servicio.imagenPublicId !== datosActualizar.imagenPublicId
  ) {
    await deleteByPublicId(servicio.imagenPublicId);
  }

  if (datosActualizar.nombre) {
    const existeNombre = await db.Servicio.findOne({
      where: {
        nombre: datosActualizar.nombre,
        idServicio: { [Op.ne]: idServicio },
      },
    });
    if (existeNombre) {
      throw new ConflictError(
        `Ya existe un servicio con el nombre '${datosActualizar.nombre}'.`
      );
    }
  }

  if (datosActualizar.precio !== undefined) {
    datosActualizar.precio = parseFloat(datosActualizar.precio);
  }

  try {
    await servicio.update({
      ...datosActualizar,
      imagen: datosActualizar.imagen || servicio.imagen,
      imagenPublicId: datosActualizar.imagenPublicId || servicio.imagenPublicId,
    });
    return servicio;
  } catch (error) {
    console.error("Error al actualizar el servicio:", error);
    throw new CustomError(
      `Error al actualizar el servicio: ${error.message}`,
      500
    );
  }
};

const cambiarEstadoServicio = async (idServicio, estado) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  await servicio.update({ estado });
  return servicio;
};

const eliminarServicioFisico = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  const citasAsociadas = await servicio.countCitas();
  if (citasAsociadas > 0) {
    throw new BadRequestError(
      "No se puede eliminar porque está asociado a citas."
    );
  }
  // Elimina imagen de Cloudinary si existe
  const publicId =
    servicio.imagenPublicId || extractPublicIdFromUrl(servicio.imagen);
  if (publicId) {
    await deleteByPublicId(publicId);
  }
  await servicio.destroy();
  return { mensaje: "Servicio eliminado correctamente." };
};

/**
 * Obtiene servicios activos para uso público (móvil).
 */
const listarActivosPublicos = async () => {
  try {
    return await db.Servicio.findAll({
      where: { estado: true },
      include: [
        {
          model: db.CategoriaServicio,
          as: "categoria",
          attributes: ["idCategoriaServicio", "nombre"],
        },
      ],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener servicios públicos:", error);
    throw new CustomError(`Error al obtener servicios públicos: ${error.message}`, 500);
  }
};

module.exports = {
  crearServicio,
  obtenerTodosLosServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
  obtenerServiciosDisponibles,
  listarActivosPublicos,
};
