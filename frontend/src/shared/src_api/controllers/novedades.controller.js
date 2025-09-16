const novedadesService = require("../services/novedades.service.js");

/**
 * Crea una nueva novedad y la asigna a uno o varios empleados.
 */
const crearNovedad = async (req, res, next) => {
  try {
    const { empleadosIds, ...datosNovedad } = req.body;
    const nuevaNovedad = await novedadesService.crearNovedad(datosNovedad, empleadosIds);
    res.status(201).json({
      success: true,
      message: "Novedad creada y asignada exitosamente.",
      data: nuevaNovedad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las novedades, con opción de filtrar.
 */
const listarNovedades = async (req, res, next) => {
  try {
      const opcionesDeFiltro = {
          estado: req.query.estado,
          empleadoId: req.query.empleadoId ? Number(req.query.empleadoId) : undefined,
          busqueda: req.query.busqueda || undefined
    };
    const novedades = await novedadesService.obtenerTodasLasNovedades(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: novedades,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene solo las novedades activas para el módulo de citas.
 */
const listarNovedadesAgendables = async (req, res, next) => {
  try {
    const novedades = await novedadesService.obtenerNovedadesActivas();
    res.status(200).json({
      success: true,
      data: novedades,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene los días disponibles para una novedad.
 */
const listarDiasDisponibles = async (req, res, next) => {
    try {
        const { idNovedad } = req.params;
        const { anio, mes } = req.query;
        const dias = await novedadesService.obtenerDiasDisponibles(Number(idNovedad), anio, mes);
        res.status(200).json({ success: true, data: dias });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtiene las horas disponibles para una novedad y fecha.
 */
const listarHorasDisponibles = async (req, res, next) => {
    try {
        const { idNovedad } = req.params;
        const { fecha } = req.query;
        const horas = await novedadesService.obtenerHorasDisponibles(Number(idNovedad), fecha);
        res.status(200).json({ success: true, data: horas });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtiene los empleados asociados a una novedad.
 */
const listarEmpleadosPorNovedad = async (req, res, next) => {
    try {
        const { idNovedad } = req.params;
        const empleados = await novedadesService.obtenerEmpleadosPorNovedad(Number(idNovedad));
        res.status(200).json({ success: true, data: empleados });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ FUNCIÓN AÑADIDA: Expone la lista de usuarios con rol "Empleado" para los formularios.
 */
const listarEmpleadosParaAsignar = async (req, res, next) => {
  try {
    const empleados = await novedadesService.obtenerEmpleadosParaAsignar();
    res.status(200).json({ success: true, data: empleados });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una novedad específica por su ID.
 */
const obtenerNovedadPorId = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    const novedad = await novedadesService.obtenerNovedadPorId(Number(idNovedad));
    res.status(200).json({
      success: true,
      data: novedad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una novedad existente.
 */
const actualizarNovedad = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    const { empleadosIds, ...datosActualizar } = req.body;
    const novedadActualizada = await novedadesService.actualizarNovedad(
      Number(idNovedad),
      datosActualizar,
      empleadosIds
    );
    res.status(200).json({
      success: true,
      message: "Novedad actualizada exitosamente.",
      data: novedadActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado de una novedad.
 */
const cambiarEstadoNovedad = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    const { estado } = req.body;
    const novedadActualizada = await novedadesService.cambiarEstadoNovedad(
      Number(idNovedad),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado de la novedad cambiado exitosamente.`,
      data: novedadActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una novedad.
 */
const eliminarNovedadFisica = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    await novedadesService.eliminarNovedadFisica(Number(idNovedad));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Lista todas las novedades activas para el público general.
 */
const listarNovedadesPublicas = async (req, res, next) => {
    try {
        const novedades = await novedadesService.obtenerNovedadesPublicas();
        res.status(200).json({
            success: true,
            data: novedades,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  crearNovedad,
  listarNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  cambiarEstadoNovedad,
  eliminarNovedadFisica,
  listarNovedadesAgendables,
  listarDiasDisponibles,
  listarHorasDisponibles,
  listarEmpleadosPorNovedad,
  listarEmpleadosParaAsignar,
  listarNovedadesPublicas, // <--- AÑADIR ESTA LÍNEA QUE FALTABA
};
