// src/shared/src_api/services/cliente.service.js 
const bcrypt = require("bcrypt");
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

const saltRounds = 10; // Para hashear contraseñas

/**
 * ✅ NUEVA FUNCIÓN: Busca clientes activos por un término de búsqueda.
 * Usado por el módulo de citas para el autocompletado.
 */
const buscarClientesPorTermino = async (termino) => {
  try {
    const searchTerm = `%${termino}%`;
    return await db.Cliente.findAll({
      where: {
        estado: true, // Solo buscar clientes activos
        [Op.or]: [
          { nombre: { [Op.iLike]: searchTerm } },
          { apellido: { [Op.iLike]: searchTerm } },
          { numeroDocumento: { [Op.iLike]: searchTerm } },
          { correo: { [Op.iLike]: searchTerm } },
        ],
      },
      limit: 10, // Limitar resultados para performance
    });
  } catch (error) {
    console.error("Error al buscar clientes por término:", error);
    throw new CustomError(`Error al buscar clientes: ${error.message}`, 500);
  }
};

/**
 * Helper interno para cambiar el estado de un cliente.
 * Considerar si esto también debe afectar el estado del Usuario asociado.
 */
const cambiarEstadoCliente = async (idCliente, nuevoEstado) => {
  const cliente = await db.Cliente.findByPk(idCliente);
  if (!cliente) {
    throw new NotFoundError("Cliente no encontrado para cambiar estado.");
  }
  // Opcional: Sincronizar estado con la cuenta de Usuario si la lógica de negocio lo requiere
  // if (cliente.idUsuario) {
  //   await db.Usuario.update({ estado: nuevoEstado }, { where: { idUsuario: cliente.idUsuario } });
  // }
  if (cliente.estado === nuevoEstado) return cliente;
  await cliente.update({ estado: nuevoEstado });
  return cliente;
};

/**
 * Crea un nuevo perfil de Cliente y su cuenta de Usuario asociada.
 * Espera todos los datos necesarios para ambas entidades.
 */
const crearCliente = async (datosCompletos) => {
  const {
    // Datos para Usuario
    correo, // Correo para la cuenta de Usuario y perfil Cliente
    contrasena, // Contraseña para la nueva cuenta de Usuario
    // idRol ya no se pasaría, se asume Rol "Cliente"
    // estadoUsuario (opcional, por defecto true para Usuario)

    // Datos para Cliente
    nombre,
    apellido,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    direccion,
    estadoCliente, // Estado para el perfil de Cliente (opcional, por defecto true)
  } = datosCompletos;

  // Validaciones previas
  if (!correo || !contrasena || !nombre || !apellido || !telefono || !tipoDocumento || !numeroDocumento || !fechaNacimiento) {
    throw new BadRequestError("Faltan campos obligatorios para crear el cliente y su cuenta de usuario.");
  }

  let usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(`El correo electrónico '${correo}' ya está registrado para una cuenta de Usuario.`);
  }

  let clienteExistenteNumeroDoc = await db.Cliente.findOne({ where: { numeroDocumento } });
  if (clienteExistenteNumeroDoc) {
    throw new ConflictError(`El número de documento '${numeroDocumento}' ya está registrado para otro cliente.`);
  }

  let clienteExistenteCorreo = await db.Cliente.findOne({ where: { correo } });
  if (clienteExistenteCorreo) {
    throw new ConflictError(`El correo electrónico '${correo}' ya está registrado para otro perfil de cliente.`);
  }

  const rolCliente = await db.Rol.findOne({ where: { nombre: "Cliente" } });
  if (!rolCliente) {
    throw new CustomError("El rol 'Cliente' no está configurado en el sistema.", 500);
  }

  const transaction = await db.sequelize.transaction();
  try {
    // 1. Crear el Usuario
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);
    const nuevoUsuario = await db.Usuario.create({
      correo,
      contrasena: contrasenaHasheada,
      idRol: rolCliente.idRol,
      estado: datosCompletos.estadoUsuario !== undefined ? datosCompletos.estadoUsuario : true,
    }, { transaction });

    // 2. Crear el Cliente, vinculándolo al nuevo Usuario
    const nuevoCliente = await db.Cliente.create({
      idUsuario: nuevoUsuario.idUsuario,
      nombre,
      apellido,
      correo, // Usamos el mismo correo para el perfil del cliente
      telefono,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
      direccion: datosCompletos.direccion,
      estado: datosCompletos.estadoCliente !== undefined ? datosCompletos.estadoCliente : true,
    }, { transaction });

    await transaction.commit();

    // Devolver el cliente con su cuenta de usuario asociada
    return db.Cliente.findByPk(nuevoCliente.idCliente, {
      include: [{ model: db.Usuario, as: "usuario", attributes: ["idUsuario", "correo", "estado", "idRol"] }]
    });

  } catch (error) {
    await transaction.rollback();
    if (error instanceof ConflictError || error instanceof BadRequestError || error instanceof CustomError) {
      throw error;
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintField = error.errors && error.errors[0] ? error.errors[0].path : "un campo único";
      throw new ConflictError(`Ya existe un registro con el mismo valor para '${constraintField}'.`);
    }
    // console.error("Error al crear el cliente y usuario en el servicio:", error.message, error.stack); // Comentado
    throw new CustomError(`Error al crear el cliente: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los clientes, incluyendo la información de su cuenta de Usuario.
 */
const obtenerTodosLosClientes = async (opcionesDeFiltro = {}) => {
  try {
    const limit = opcionesDeFiltro.limit;
    const offset = opcionesDeFiltro.offset;

    const { count, rows } = await db.Cliente.findAndCountAll({
      where: opcionesDeFiltro.where || {},
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["idUsuario", "correo", "estado", "idRol"],
          include: [{
            model: db.Rol,
            as: "rol",
            attributes: ["nombre"]
          }]
        },
      ],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
      limit: limit,
      offset: offset,
      distinct: true, // Necesario con include y limit para que count sea correcto
    });

    return {
      totalItems: count,
      clientes: rows,
      totalPages: limit ? Math.ceil(count / limit) : 1,
      currentPage: offset && limit ? Math.floor(offset / limit) + 1 : 1,
    };
  } catch (error) {
    // console.error("Error al obtener todos los clientes en el servicio:", error.message); // Comentado
    throw new CustomError(`Error al obtener clientes: ${error.message}`, 500);
  }
};

/**
 * Obtener un cliente por su ID, incluyendo la información de su cuenta de Usuario.
 */
const obtenerClientePorId = async (idCliente) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente, {
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["idUsuario", "correo", "estado", "idRol"],
          include: [{
            model: db.Rol,
            as: "rol",
            attributes: ["nombre"]
          }]
        },
      ],
    });
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado.");
    }
    return cliente;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al obtener el cliente con ID ${idCliente} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al obtener el cliente: ${error.message}`, 500);
  }
};

/**
 * Actualizar un cliente existente y, opcionalmente, su cuenta de Usuario asociada.
 */
const actualizarCliente = async (idCliente, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cliente = await db.Cliente.findByPk(idCliente, { transaction });
    if (!cliente) {
      await transaction.rollback();
      throw new NotFoundError("Cliente no encontrado para actualizar.");
    }

    // Separar datos para Cliente y para Usuario
    const datosParaCliente = {};
    const datosParaUsuario = {};

    // Campos directos de Cliente
    if (datosActualizar.hasOwnProperty('nombre')) datosParaCliente.nombre = datosActualizar.nombre;
    if (datosActualizar.hasOwnProperty('apellido')) datosParaCliente.apellido = datosActualizar.apellido;
    if (datosActualizar.hasOwnProperty('telefono')) datosParaCliente.telefono = datosActualizar.telefono;
    if (datosActualizar.hasOwnProperty('tipoDocumento')) datosParaCliente.tipoDocumento = datosActualizar.tipoDocumento;
    if (datosActualizar.hasOwnProperty('numeroDocumento')) datosParaCliente.numeroDocumento = datosActualizar.numeroDocumento;
    if (datosActualizar.hasOwnProperty('fechaNacimiento')) datosParaCliente.fechaNacimiento = datosActualizar.fechaNacimiento;
    if (datosActualizar.hasOwnProperty('direccion')) datosParaCliente.direccion = datosActualizar.direccion;
    if (datosActualizar.hasOwnProperty('estadoCliente')) datosParaCliente.estado = datosActualizar.estadoCliente; // Estado del perfil Cliente

    // Campos que podrían afectar a la tabla Usuario
    if (datosActualizar.hasOwnProperty('correo')) {
      datosParaCliente.correo = datosActualizar.correo; // Actualizar correo en perfil Cliente
      datosParaUsuario.correo = datosActualizar.correo; // Marcar para actualizar correo en Usuario
    }
    if (datosActualizar.hasOwnProperty('estadoUsuario')) datosParaUsuario.estado = datosActualizar.estadoUsuario; // Estado de la cuenta Usuario

    // Validaciones de unicidad para Cliente
    if (datosParaCliente.numeroDocumento && datosParaCliente.numeroDocumento !== cliente.numeroDocumento) {
      const otroClienteConDocumento = await db.Cliente.findOne({ where: { numeroDocumento: datosParaCliente.numeroDocumento, idCliente: { [Op.ne]: idCliente } }, transaction });
      if (otroClienteConDocumento) {
        await transaction.rollback();
        throw new ConflictError(`El número de documento '${datosParaCliente.numeroDocumento}' ya está registrado para otro cliente.`);
      }
    }
    if (datosParaCliente.correo && datosParaCliente.correo !== cliente.correo) {
      const otroClienteConCorreo = await db.Cliente.findOne({ where: { correo: datosParaCliente.correo, idCliente: { [Op.ne]: idCliente } }, transaction });
      if (otroClienteConCorreo) {
        await transaction.rollback();
        throw new ConflictError(`El correo electrónico '${datosParaCliente.correo}' ya está registrado para otro perfil de cliente.`);
      }
    }

    // Actualizar Cliente si hay datos para ello
    if (Object.keys(datosParaCliente).length > 0) {
      await cliente.update(datosParaCliente, { transaction });
    }

    // Actualizar Usuario asociado si hay datos para ello y existe idUsuario
    if (cliente.idUsuario && Object.keys(datosParaUsuario).length > 0) {
      const usuario = await db.Usuario.findByPk(cliente.idUsuario, { transaction });
      if (usuario) {
        // Validar unicidad de correo en Usuario si se está cambiando
        if (datosParaUsuario.correo && datosParaUsuario.correo !== usuario.correo) {
          const otroUsuarioConCorreo = await db.Usuario.findOne({ where: { correo: datosParaUsuario.correo, idUsuario: { [Op.ne]: cliente.idUsuario } }, transaction });
          if (otroUsuarioConCorreo) {
            await transaction.rollback();
            throw new ConflictError(`El correo electrónico '${datosParaUsuario.correo}' ya está en uso por otra cuenta de usuario.`);
          }
        }
        await usuario.update(datosParaUsuario, { transaction });
      }
    }
    // Lógica para cambiar idUsuario (desvincular y vincular a otro) es más compleja y se omite por ahora.

    await transaction.commit();
    return obtenerClientePorId(cliente.idCliente); // Devuelve el cliente actualizado con su usuario

  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError || error instanceof CustomError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintField = error.errors && error.errors[0] ? error.errors[0].path : "un campo único";
      throw new ConflictError(`Ya existe un cliente con el mismo valor para '${constraintField}'.`);
    }
    // console.error(`Error al actualizar el cliente con ID ${idCliente} en el servicio:`, error.message, error.stack); // Comentado
    throw new CustomError(`Error al actualizar el cliente: ${error.message}`, 500);
  }
};

/**
 * Anular un cliente (borrado lógico, establece estado = false en Cliente).
 * Considerar si también se debe anular el Usuario asociado.
 */
const anularCliente = async (idCliente) => {
  try {
    // Si también se quiere anular el Usuario:
    // const cliente = await db.Cliente.findByPk(idCliente);
    // if (cliente && cliente.idUsuario) {
    //   await db.Usuario.update({ estado: false }, { where: { idUsuario: cliente.idUsuario } });
    // }
    return await cambiarEstadoCliente(idCliente, false);
  } catch (error) {
    // ... (manejo de error existente) ...
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al anular el cliente con ID ${idCliente} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al anular el cliente: ${error.message}`, 500);
  }
};

/**
 * Habilitar un cliente (cambia estado = true en Cliente).
 * Considerar si también se debe habilitar el Usuario asociado.
 */
const habilitarCliente = async (idCliente) => {
  try {
    // Si también se quiere habilitar el Usuario:
    // const cliente = await db.Cliente.findByPk(idCliente);
    // if (cliente && cliente.idUsuario) {
    //   await db.Usuario.update({ estado: true }, { where: { idUsuario: cliente.idUsuario } });
    // }
    return await cambiarEstadoCliente(idCliente, true);
  } catch (error) {
    // ... (manejo de error existente) ...
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al habilitar el cliente con ID ${idCliente} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al habilitar el cliente: ${error.message}`, 500);
  }
};

/**
 * Eliminar un cliente físicamente de la base de datos.
 * La FK en Cliente.idUsuario tiene ON DELETE SET NULL, por lo que el Usuario no se borra.
 */
const eliminarClienteFisico = async (idCliente) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado para eliminar físicamente.");
    }

    // --- VALIDACIÓN DE ACCIONES ASOCIADAS (VENTAS Y CITAS) ---
    // Verifica si existen ventas asociadas al cliente
    const ventasCount = await db.Venta.count({ where: { idCliente: idCliente } });
    if (ventasCount > 0) {
      throw new ConflictError(`No se puede eliminar el cliente porque tiene ${ventasCount} venta(s) asociada(s).`);
    }

    // Verifica si existen citas asociadas al cliente
    const citasCount = await db.Cita.count({ where: { idCliente: idCliente } });
    if (citasCount > 0) {
      throw new ConflictError(`No se puede eliminar el cliente porque tiene ${citasCount} cita(s) asociada(s).`);
    }
    // --- FIN VALIDACIÓN DE ACCIONES ASOCIADAS ---

    // Si no hay ventas ni citas asociadas, procede con la eliminación física
    const filasEliminadas = await db.Cliente.destroy({ where: { idCliente } });
    return filasEliminadas > 0; // Devuelve true si se eliminó algo
  } catch (error) {
    // Manejo de errores específicos y genéricos
    if (error instanceof NotFoundError || error instanceof ConflictError) { // Incluye ConflictError aquí
      throw error;
    }
    // Si hay un error de restricción de clave foránea de Sequelize, lo manejamos con un mensaje más amigable
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError("No se puede eliminar el cliente porque está siendo referenciado de una manera que impide su borrado. Verifique las dependencias (ej. Ventas, Citas).");
    }
    // console.error(`Error al eliminar físicamente el cliente con ID ${idCliente} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al eliminar físicamente el cliente: ${error.message}`, 500);
  }
};

const actualizarPerfilCliente = async (idCliente, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cliente = await db.Cliente.findByPk(idCliente, { transaction });
    if (!cliente) {
      throw new NotFoundError("Perfil de cliente no encontrado.");
    }

    // Campos permitidos para la actualización del perfil por parte del cliente
    const camposPermitidos = ['nombre', 'apellido', 'telefono', 'direccion', 'correo'];
    const datosParaCliente = {};
    Object.keys(datosActualizar).forEach(key => {
      if (camposPermitidos.includes(key)) {
        datosParaCliente[key] = datosActualizar[key];
      }
    });

    // Actualizar el perfil del cliente
    await cliente.update(datosParaCliente, { transaction });

    // Si el correo ha cambiado, actualizar también la tabla de usuarios
    if (datosParaCliente.correo && cliente.idUsuario) {
      const usuario = await db.Usuario.findByPk(cliente.idUsuario, { transaction });
      if (usuario) {
        await usuario.update({ correo: datosParaCliente.correo }, { transaction });
      }
    }

    await transaction.commit();
    return obtenerClientePorId(cliente.idCliente); // Devolver el perfil actualizado
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    console.error(`Error al actualizar el perfil del cliente con ID ${idCliente}:`, error.message);
    throw new CustomError(`Error al actualizar el perfil: ${error.message}`, 500);
  }
};

/**
 * Obtiene el perfil de cliente por ID de usuario (para móvil).
 */
const getPerfilClientePorUsuarioId = async (idUsuario) => {
  try {
    const cliente = await db.Cliente.findOne({
      where: { idUsuario },
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["idUsuario", "correo", "estado"],
        },
      ],
    });
    if (!cliente) {
      throw new NotFoundError("Perfil de cliente no encontrado.");
    }
    return cliente;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al obtener perfil de cliente por usuario ID ${idUsuario}:`, error.message);
    throw new CustomError(`Error al obtener perfil de cliente: ${error.message}`, 500);
  }
};

/**
 * Actualiza el perfil de cliente por ID de usuario (para móvil).
 */
const updatePerfilClientePorUsuarioId = async (idUsuario, datosActualizar) => {
  try {
    const cliente = await db.Cliente.findOne({ where: { idUsuario } });
    if (!cliente) {
      throw new NotFoundError("Perfil de cliente no encontrado.");
    }
    return await actualizarPerfilCliente(cliente.idCliente, datosActualizar);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al actualizar perfil de cliente por usuario ID ${idUsuario}:`, error.message);
    throw new CustomError(`Error al actualizar perfil de cliente: ${error.message}`, 500);
  }
};

module.exports = {
  crearCliente,
  obtenerTodosLosClientes,
  obtenerClientePorId,
  actualizarCliente,
  anularCliente,
  habilitarCliente,
  eliminarClienteFisico,
  cambiarEstadoCliente,
  buscarClientesPorTermino,
  actualizarPerfilCliente,
  getPerfilClientePorUsuarioId,
  updatePerfilClientePorUsuarioId,
};