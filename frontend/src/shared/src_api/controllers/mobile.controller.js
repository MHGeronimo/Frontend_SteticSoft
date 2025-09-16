// src/controllers/mobile.controller.js
const authService = require("../services/auth.service");
const clienteService = require("../services/cliente.service");
const servicioService = require("../services/servicio.service");
const productoService = require("../services/producto.service");
// INICIO DE LA CORRECCIÓN: Se importan los dos servicios de categoría específicos.
const categoriaProductoService = require("../services/categoriaProducto.service.js");
const categoriaServicioService = require("../services/categoriaServicio.service.js");
// FIN DE LA CORRECCIÓN
const citaService = require("../services/cita.service");
const ventaService = require("../services/venta.service");

async function loginUsuarioMovil(req, res, next) {
  try {
    const { correo, contrasena } = req.body;
    const { token, usuario } = await authService.loginUsuario(correo, contrasena);
    const clienteInfo = usuario.clienteInfo;
    res.json({ token, permisos: usuario?.permisos || [], clienteInfo });
  } catch (e) {
    next(e);
  }
}

async function registrarUsuarioMovil(req, res, next) {
  try {
    const { usuario, token } = await authService.registrarUsuario(req.body);
    res.status(201).json({ usuario, token });
  } catch (e) {
    next(e);
  }
}

async function getMiPerfilMovil(req, res, next) {
  try {
    const clienteInfo = await clienteService.getPerfilClientePorUsuarioId(
      req.user.idUsuario
    );
    res.json(clienteInfo);
  } catch (e) {
    next(e);
  }
}

async function updateMiPerfilMovil(req, res, next) {
  try {
    const updated = await clienteService.updatePerfilClientePorUsuarioId(
      req.user.idUsuario,
      req.body
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

async function listarServiciosPublicosMovil(req, res, next) {
  try {
    const servicios = await servicioService.listarActivosPublicos();
    res.json(servicios);
  } catch (e) {
    next(e);
  }
}

async function listarProductosPublicosMovil(req, res, next) {
  try {
    const productos = await productoService.listarActivosExternosPublicos();
    res.json(productos);
  } catch (e) {
    next(e);
  }
}

async function listarCategoriasServicioPublicasMovil(req, res, next) {
  try {
    // INICIO DE LA CORRECCIÓN: Se utiliza el servicio correcto.
    const categorias =
      await categoriaServicioService.obtenerCategoriasPublicas();
    // FIN DE LA CORRECCIÓN
    res.json(categorias);
  } catch (e) {
    next(e);
  }
}

async function listarCategoriasProductoPublicasMovil(req, res, next) {
  try {
    // INICIO DE LA CORRECCIÓN: Se utiliza el servicio correcto.
    const categorias =
      await categoriaProductoService.obtenerCategoriasPublicas();
    // FIN DE LA CORRECCIÓN
    res.json(categorias);
  } catch (e) {
    next(e);
  }
}

async function listarMisCitasMovil(req, res, next) {
  try {
    const citas = await citaService.listarPorCliente(req.usuario.clienteInfo.idCliente);
    res.json(citas);
  } catch (e) {
    next(e);
  }
}

async function crearMiCitaMovil(req, res, next) {
  try {
    const created = await citaService.crearParaCliente(
      req.usuario.clienteInfo.idCliente,
      req.body
    );
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

async function listarNovedadesAgendablesMovil(req, res, next) {
  try {
    const novedades = await citaService.listarNovedadesAgendablesMovil();
    res.json(novedades);
  } catch (e) {
    next(e);
  }
}

async function listarDiasDisponiblesMovil(req, res, next) {
  try {
    const { novedadId, mes, anio } = req.query;
    const dias = await citaService.listarDiasDisponiblesMovil(novedadId, mes, anio);
    res.json(dias);
  } catch (e) {
    next(e);
  }
}

async function listarHorasDisponiblesMovil(req, res, next) {
  try {
    const { novedadId, fecha } = req.query;
    const horas = await citaService.listarHorasDisponiblesMovil(novedadId, fecha);
    res.json(horas);
  } catch (e) {
    next(e);
  }
}

async function cancelarMiCitaMovil(req, res, next) {
  try {
    const { idCita } = req.params;
    const updated = await citaService.cancelarCitaDeClienteMovil(
      req.usuario.clienteInfo.idCliente,
      idCita
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

async function listarMisVentasMovil(req, res, next) {
  try {
    const ventas = await ventaService.listarPorCliente(req.usuario.clienteInfo.idCliente);
    res.json(ventas);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  loginUsuarioMovil,
  registrarUsuarioMovil,
  getMiPerfilMovil,
  updateMiPerfilMovil,
  listarServiciosPublicosMovil,
  listarProductosPublicosMovil,
  listarCategoriasServicioPublicasMovil,
  listarCategoriasProductoPublicasMovil,
  listarMisCitasMovil,
  crearMiCitaMovil,
  listarNovedadesAgendablesMovil,
  listarDiasDisponiblesMovil,
  listarHorasDisponiblesMovil,
  cancelarMiCitaMovil,
  listarMisVentasMovil,
};
