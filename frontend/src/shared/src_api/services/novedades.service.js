const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, BadRequestError, CustomError } = require("../errors");
const moment = require("moment-timezone");

const crearNovedad = async (datosNovedad, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    if (empleadosIds && empleadosIds.length > 0) {
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado en el sistema.", 500);
      }
      const usuariosValidos = await db.Usuario.count({
        where: {
          idUsuario: empleadosIds,
          estado: true,
          idRol: rolEmpleado.idRol 
        },
        transaction: t,
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más de los IDs proporcionados no corresponden a empleados válidos y activos.");
      }
    }
    // Se eliminó la dependencia de 'nombre' y 'descripcion'
    const nuevaNovedad = await db.Novedad.create(datosNovedad, { transaction: t });
    if (empleadosIds && empleadosIds.length > 0) {
      await nuevaNovedad.setEmpleados(empleadosIds, { transaction: t });
    }
    await t.commit();
    const novedadCreada = await db.Novedad.findByPk(nuevaNovedad.idNovedad, {
      include: [
        {
          model: db.Usuario,
          as: "empleados",
          attributes: ["idUsuario", "correo"],
          through: { attributes: [] },
          include: [
            {
              model: db.Empleado,
              as: "empleadoInfo",
              attributes: ["nombre", "apellido"],
            },
          ],
        },
      ],
    });

    const plainNovedad = novedadCreada.get({ plain: true });
    plainNovedad.empleados = plainNovedad.empleados.map((empleado) => ({
      ...empleado,
      nombre: empleado.empleadoInfo?.nombre,
      apellido: empleado.empleadoInfo?.apellido,
      empleadoInfo: undefined,
    }));
    return plainNovedad;
  } catch (error) {
    await t.rollback();
    console.error("Error al crear la novedad en el servicio:", error);
    throw error;
  }
};

const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  const { estado, empleadoId, busqueda } = opcionesDeFiltro;
  const whereClause = {};
  const includeOptions = {
    model: db.Usuario,
    as: 'empleados', // Este alias viene de Novedades.model.js
    attributes: [
        ['id_usuario', 'id'], // Renombramos 'id_usuario' a 'id' para el frontend
        'correo'
    ],
    through: { attributes: [] }, // No incluir la tabla intermedia en el resultado
    include: [{ // Anidamos la inclusión para obtener el nombre y apellido del perfil del empleado
      model: db.Empleado,
      as: 'empleadoInfo', // Este alias viene de Usuario.model.js
      attributes: ['nombre', 'apellido'],
    }],
    required: false
  };

  if (estado === 'true' || estado === 'false') {
    whereClause.estado = estado === 'true';
  }

  if (empleadoId) {
    includeOptions.where = { idUsuario: empleadoId };
    includeOptions.required = true;
  }

  if (busqueda) {
    const searchTerm = `%${busqueda}%`;
    whereClause[Op.or] = [
      { fechaInicio: { [Op.like]: searchTerm } },
      { fechaFin: { [Op.like]: searchTerm } },
      { horaInicio: { [Op.like]: searchTerm } },
      { horaFin: { [Op.like]: searchTerm } },
      { '$empleados.correo$': { [Op.like]: searchTerm } },
      { '$empleados.empleadoInfo.nombre$': { [Op.like]: searchTerm } },
      { '$empleados.empleadoInfo.apellido$': { [Op.like]: searchTerm } },
    ];
  }

  try {
    const novedades = await db.Novedad.findAll({
      where: whereClause,
      include: [includeOptions], // Aplicamos la nueva configuración de inclusión
      order: [["fechaInicio", "DESC"]],
    });

    // Mapeamos el resultado para darle al frontend una estructura limpia y fácil de usar
    return novedades.map(novedad => {
      const plainNovedad = novedad.get({ plain: true });
      if (plainNovedad.empleados) {
          plainNovedad.empleados = plainNovedad.empleados.map(emp => ({
            id: emp.id,
            // Unimos nombre y apellido para el selector del frontend
            nombre: `${emp.empleadoInfo.nombre} ${emp.empleadoInfo.apellido}`.trim()
          }));
      }
      return plainNovedad;
    });

  } catch (error) {
    console.error("Error al obtener todas las novedades:", error);
    throw new CustomError(`Error al obtener novedades: ${error.message}`, 500);
  }
};
const obtenerNovedadesActivas = async () => {
    try {
        // Se usa moment().tz para asegurar que la fecha actual se evalúe en la zona horaria correcta (ej. America/Bogota).
        // Esto previene problemas si el servidor está en una zona horaria diferente.
        const hoy = moment().tz("America/Bogota").startOf('day').toDate();

        return await db.Novedad.findAll({
            where: {
                estado: true,
                fechaInicio: {
                    [Op.lte]: hoy,
                },
                fechaFin: {
                    [Op.gte]: hoy,
                },
            },
        });
    } catch (error) {
        console.error("Error al obtener novedades activas:", error);
        throw new CustomError(`Error al obtener novedades activas: ${error.message}`, 500);
    }
};

const obtenerNovedadPorId = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [
      {
        model: db.Usuario,
        as: "empleados",
        attributes: ["idUsuario", "correo"],
        through: { attributes: [] },
        include: [
          {
            model: db.Empleado,
            as: "empleadoInfo",
            attributes: ["nombre", "apellido"],
          },
        ],
      },
    ],
  });
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }

  const plainNovedad = novedad.get({ plain: true });
  plainNovedad.empleados = plainNovedad.empleados.map((empleado) => ({
    ...empleado,
    nombre: empleado.empleadoInfo?.nombre,
    apellido: empleado.empleadoInfo?.apellido,
    empleadoInfo: undefined,
  }));
  return plainNovedad;
};

const actualizarNovedad = async (idNovedad, datosActualizar, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    const novedad = await db.Novedad.findByPk(idNovedad, { transaction: t });
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para actualizar.");
    }
    if (empleadosIds) {
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado.", 500);
      }
      const usuariosValidos = await db.Usuario.count({
        where: { idUsuario: empleadosIds, estado: true, idRol: rolEmpleado.idRol },
        transaction: t
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más IDs no corresponden a empleados válidos y activos.");
      }
      await novedad.setEmpleados(empleadosIds, { transaction: t });
    }
    // Se eliminó la dependencia de 'nombre' y 'descripcion'
    await novedad.update(datosActualizar, { transaction: t });
    await t.commit();
    return await obtenerNovedadPorId(idNovedad);
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar la novedad:", error);
    throw error;
  }
};

const cambiarEstadoNovedad = async (idNovedad, estado) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) throw new NotFoundError("Novedad no encontrada.");
  await novedad.update({ estado });
  return novedad;
};

const eliminarNovedadFisica = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) throw new NotFoundError("Novedad no encontrada para eliminar.");
  await novedad.destroy();
};

const obtenerDiasDisponibles = async (idNovedad, anio, mes) => {
  // 1. Busca la novedad por su ID para obtener sus reglas (fechas y días)
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }

  const inicioDelMes = moment.tz({ year: anio, month: mes - 1 }, "America/Bogota").startOf('month');
  const finDelMes = moment.tz({ year: anio, month: mes - 1 }, "America/Bogota").endOf('month');

  // ✅ LÍNEAS AÑADIDAS: Convertimos las fechas de la novedad a objetos moment en la misma zona horaria.
  const fechaInicioNovedad = moment.tz(novedad.fechaInicio, "America/Bogota").startOf('day');
  const fechaFinNovedad = moment.tz(novedad.fechaFin, "America/Bogota").endOf('day');

  const diasValidos = [];
  
  moment.locale('es'); // Establecer el idioma a español

  let diaActual = inicioDelMes.clone();
  while (diaActual.isSameOrBefore(finDelMes)) {
    
    // ✅ LÍNEAS MODIFICADAS: Comparamos usando los nuevos objetos moment.
    const esDespuesDeInicioNovedad = diaActual.isSameOrAfter(fechaInicioNovedad);
    const esAntesDeFinNovedad = diaActual.isSameOrBefore(fechaFinNovedad);
    
    const diaDeLaSemana = diaActual.format('dddd');
    const diaDeLaSemanaCapitalizado = diaDeLaSemana.charAt(0).toUpperCase() + diaDeLaSemana.slice(1);
    const esDiaPermitido = novedad.dias.includes(diaDeLaSemanaCapitalizado);

    if (esDespuesDeInicioNovedad && esAntesDeFinNovedad && esDiaPermitido) {
      diasValidos.push(diaActual.format('YYYY-MM-DD'));
    }

    diaActual.add(1, 'days');
  }

  moment.locale('en'); // Revertir al idioma original para no afectar otras partes

  return diasValidos;
};


const obtenerHorasDisponibles = async (idNovedad, fecha) => {
  // 1. Busca la novedad para obtener sus reglas de horario
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }
  const citasDelDia = await db.Cita.findAll({
    where: {
      fecha: fecha,
    },
    attributes: ['horaInicio'], // Solo necesitamos la hora de inicio de cada cita
  });
  // Creamos un Set para una búsqueda más rápida de las horas ocupadas
  const horasOcupadas = new Set(citasDelDia.map(cita => cita.horaInicio));
  const horariosPosibles = [];
  const formatoHora = 'HH:mm:ss';
  const intervaloMinutos = 60;

  let horaActual = moment(novedad.horaInicio, formatoHora);
  const horaFin = moment(novedad.horaFin, formatoHora);

  while (horaActual.isBefore(horaFin)) {
    horariosPosibles.push(horaActual.format(formatoHora));
    horaActual.add(intervaloMinutos, 'minutes');
  }

  const horasDisponibles = horariosPosibles.filter(hora => !horasOcupadas.has(hora));
  
  return horasDisponibles;
};


const obtenerEmpleadosPorNovedad = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [
      {
        model: db.Usuario,
        as: "empleados",
        attributes: ["idUsuario", "correo"],
        where: { estado: true },
        through: { attributes: [] },
        include: [
          {
            model: db.Empleado,
            as: "empleadoInfo",
            attributes: ["nombre", "apellido", "telefono"],
          },
        ],
      },
    ],
  });

  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada");
  }

  return novedad.empleados.map((empleado) => {
    const plainEmpleado = empleado.get({ plain: true });
    return {
      ...plainEmpleado,
      nombre: plainEmpleado.empleadoInfo?.nombre,
      apellido: plainEmpleado.empleadoInfo?.apellido,
      telefono: plainEmpleado.empleadoInfo?.telefono,
      empleadoInfo: undefined,
    };
  });
};

const obtenerEmpleadosParaAsignar = async () => {
  try {
    const rolEmpleado = await db.Rol.findOne({ where: { nombre: "Empleado" } });
    if (!rolEmpleado) {
      throw new CustomError(
        "El rol 'Empleado' no está configurado en el sistema.",
        500
      );
    }

    const usuarios = await db.Usuario.findAll({
      where: {
        idRol: rolEmpleado.idRol,
        estado: true,
      },
      attributes: ["idUsuario", "correo"],
      include: [
        {
          model: db.Empleado,
          as: "empleadoInfo",
          attributes: ["nombre", "apellido", "telefono"],
          required: true
        },
      ],
      order: [[{ model: db.Empleado, as: "empleadoInfo" }, "nombre", "ASC"]],
    });

    return usuarios.map((usuario) => {
      const plainUsuario = usuario.get({ plain: true });
      const info = plainUsuario.empleadoInfo;
      return {
        idUsuario: plainUsuario.idUsuario,
        nombreCompleto: `${info?.nombre || ""} ${info?.apellido || ""}`.trim(),
      };
    });
  } catch (error) {
    console.error("Error al obtener empleados para asignar:", error);
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Error al obtener la lista de empleados: ${error.message}`,
      500
    );
  }
};

const obtenerNovedadesPublicas = async () => {
    try {
        return await db.Novedad.findAll({
            where: {
                estado: true,
            },
            order: [["fechaInicio", "DESC"]],
        });
    } catch (error) {
        console.error("Error al obtener novedades públicas:", error);
        throw new CustomError(`Error al obtener novedades públicas: ${error.message}`, 500);
    }
};

module.exports = {
  crearNovedad,
  obtenerTodasLasNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  cambiarEstadoNovedad,
  eliminarNovedadFisica,
  obtenerNovedadesActivas,
  obtenerDiasDisponibles,
  obtenerHorasDisponibles,
  obtenerEmpleadosPorNovedad,
  obtenerEmpleadosParaAsignar,
  obtenerNovedadesPublicas,
};

