const express = require('express');
const router = express.Router();
const mobileCtrl = require('../controllers/mobile.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/login', mobileCtrl.loginUsuarioMovil);
router.post('/registro', mobileCtrl.registrarUsuarioMovil);

router.get('/perfil', authMiddleware, mobileCtrl.getMiPerfilMovil);
router.put('/perfil', authMiddleware, mobileCtrl.updateMiPerfilMovil);

router.get('/servicios', mobileCtrl.listarServiciosPublicosMovil);
router.get('/productos', mobileCtrl.listarProductosPublicosMovil);
router.get('/categorias/servicios', mobileCtrl.listarCategoriasServicioPublicasMovil);
router.get('/categorias/productos', mobileCtrl.listarCategoriasProductoPublicasMovil);

router.get('/citas', authMiddleware, mobileCtrl.listarMisCitasMovil);
router.post('/citas', authMiddleware, mobileCtrl.crearMiCitaMovil);
router.get('/citas/disponibilidad/novedades', mobileCtrl.listarNovedadesAgendablesMovil);
router.get('/citas/disponibilidad/dias', mobileCtrl.listarDiasDisponiblesMovil);
router.get('/citas/disponibilidad/horas', mobileCtrl.listarHorasDisponiblesMovil);
router.patch('/citas/:idCita/cancelar', authMiddleware, mobileCtrl.cancelarMiCitaMovil);

router.get('/ventas', authMiddleware, mobileCtrl.listarMisVentasMovil);

module.exports = router;