import { Router } from 'express';
import { autenticacion } from '../middlewares/validaciontoken.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validacionS } from '../libs/validacion.js';
import multer from 'multer'; // 👈 Importamos multer
import path from 'path'; // 👈 Importamos 'path' para resolver las rutas

// Schemas
import { registerS, loginS } from '../schemas/validacion.js';
import { createEmpleadoSchema, updateEmpleadoSchema, cambiarEstadoEmpleadoSchema } from '../schemas/empleado.validators.js';
import { createRolSchema, updateRolSchema, asignarPermisosSchema } from '../schemas/rol.validators.js';
import { createClienteSchema, updateClienteSchema, cambiarEstadoClienteSchema } from '../schemas/cliente.validators.js';
import { updateCitaEstadoSchema } from '../schemas/cita.validators.js';
import { createSaleSchema, updateSaleSchema } from '../schemas/venta.validators.js';
//ABASTECIMIENTO :D
import { createAbastecimientoSchema, updateAbastecimientoSchema } from '../schemas/abastecimiento.validators.js';

// C A M B I O: Importamos LoginController del archivo Credentials/login.js
import LoginController from '../controllers/Credentials/login.js';
// C A M B I O: Importamos AuthController (el de password reset) del nuevo archivo
import AuthController from '../controllers/auth.controller.js'; 

// Controllers:Acceso
import UsuarioController from '../controllers/usuario.controller.js';
import EmpleadoController from '../controllers/empleado.controller.js';
import ClienteController from '../controllers/cliente.controller.js';
import RolController from '../controllers/rol.controller.js';
import PermisoController from '../controllers/permiso.controller.js';
// Controllers:All
import { createCatServicio, getAllCatServicios, getCatServicioById, updateCatServicio, deleteCatServicio } from '../controllers/cat_servicio.controller.js';
import { createServicio, getAllServicios, getServicioById, updateServicio, deleteServicio } from '../controllers/servicio.controller.js';
import { createHorario, getAllHorarios, getHorarioById, updateHorario, deleteHorario, updateEstadoHorario, getHorarioByEmpleado } from '../controllers/horario.controller.js';
import { createProveedor, getAllProveedores, getProveedorById, updateProveedor, deleteProveedor } from '../controllers/proveedor.controller.js';
import { crearProductoController, obtenerProductosController, obtenerProductoPorIdController, actualizarProductoController, eliminarProductoController } from '../controllers/producto.controller.js';
import { createCatProducto, getAllCatProductos, getCatProductoById, updateCatProducto, deleteCatProducto} from '../controllers/cat_producto.controller.js';
import { createCitaController, getAllCitasController, getCitaByIdController, updateCitaController } from '../controllers/cita.controller.js';
import { getAllSales, getSaleById, createSale, updateSale, annulSale } from '../controllers/venta.controller.js';
import { getAllCompras, getCompraById, createCompra, updateCompra, annulCompra, addDetailToCompra, updateDetailInCompra, deleteDetailFromCompra } from '../controllers/compra.controller.js';
//ABASTECIMIENTO :D
import * as AbastecimientoController from '../controllers/abastecimiento.controller.js';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // La carpeta donde se guardarán los archivos
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // El nombre del archivo en el servidor será el original, pero con un prefijo para evitar colisiones
    // Usamos Date.now() y un hash para hacerlo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Configura el middleware de Multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif)"), false);
        }
    }
});

router.post('/register', LoginController.registerClient); // CORREGIDO: Usar LoginController
router.post('/login', LoginController.login);             // CORREGIDO: Usar LoginController
router.post('/logout', LoginController.logout);           // CORREGIDO: Usar LoginController
router.get('/profile', LoginController.profile);         // CORREGIDO: Usar LoginController

// --- NUEVA RUTA PARA EL CHECK DE AUTENTICACIÓN ---
router.get('/check-auth', autenticacion, (req, res) => {
    res.status(200).json({ authenticated: true, user: req.user });
});

// Middleware de depuración para ver el usuario autenticado (si existe)
router.use((req, res, next) => {
    if (req.user) {
      console.log('🔍 DEBUG ROUTER: Usuario autenticado en middleware de depuración:', {
        id: req.user.id,
        rol: req.user.rol.nombre,
        email: req.user.email,
        permisos: req.user.permisos
      });
    } else {
      console.log('🔍 DEBUG ROUTER: req.user no definido (posiblemente ruta no autenticada o token ausente/inválido).');
    }
    next();
});

// --- User Management Routes ---

router.route('/usuarios')
    .all(autenticacion)
    .get(UsuarioController.getAll)
    .post(validacionS(registerS), authorize('usuarios:ver'), UsuarioController.create);

router.route('/usuarios/:id')
    .all(autenticacion)
    .get(UsuarioController.getById)
    .put(authorize('usuarios:ver'), UsuarioController.update)
    .delete(authorize('usuarios:ver'),UsuarioController.delete);

router.post('/auth/forgot-password', AuthController.requestPasswordReset);
router.post('/auth/reset-password', AuthController.resetPassword);

router.route('/empleados')
    .get(EmpleadoController.listarEmpleados) 
    .post(autenticacion, authorize('empleados:crear'), validacionS(createEmpleadoSchema), EmpleadoController.crearEmpleado);

router.route('/empleados/:id')
    .get(EmpleadoController.obtenerEmpleadoPorId) 
    .put(autenticacion, authorize('empleados:editar'), validacionS(updateEmpleadoSchema), EmpleadoController.actualizarEmpleado)
    .delete(autenticacion, authorize('empleados:eliminar'), EmpleadoController.eliminarEmpleado);

router.post('/empleados/convertir-cliente/:documento',
    autenticacion,
    authorize('empleados:ver'),
    EmpleadoController.convertirClienteEnEmpleado
);

router.put('/empleados/:id/estado', autenticacion, authorize('empleados:ver'), validacionS(cambiarEstadoEmpleadoSchema), EmpleadoController.cambiarEstadoEmpleado);

router.route('/clientes/all') // Nueva ruta
  .all(autenticacion)
  .get(ClienteController.listarClientesCompletos);
  
router.route('/clientes')
    .all(autenticacion)
    .post(validacionS(createClienteSchema), authorize('clientes:ver'), ClienteController.crearCliente)
    .get(ClienteController.listarClientes); // This handles pagination and search via query params

router.route('/clientes/:id')
    .all(autenticacion)
    .get(ClienteController.obtenerClientePorId)
    .put(validacionS(updateClienteSchema), authorize('clientes:ver'), ClienteController.actualizarCliente)
    .delete(authorize('clientes:ver'), ClienteController.eliminarCliente);

router.post('/clientes/convertir-empleado-a-cliente/:documento',
    autenticacion,
    authorize('clientes:ver'),
    ClienteController.convertirEmpleadoEnCliente
);

router.put('/clientes/:id/estado',
    autenticacion,
    authorize('clientes:ver'),
    validacionS(cambiarEstadoClienteSchema),
    ClienteController.cambiarEstadoCliente
);

router.route('/roles')
    .all(autenticacion, authorize('roles:ver'))
    .post(validacionS(createRolSchema), RolController.crearRol)
    .get(RolController.obtenerTodosRoles);

router.route('/roles/:id')
    .all(autenticacion, authorize('roles:ver'))
    .get(RolController.obtenerRolPorId)
    .put(validacionS(updateRolSchema), RolController.actualizarRol)
    .delete(RolController.eliminarRol);

router.put('/roles/:id/permisos', 
    autenticacion,
    authorize('roles:ver'),
    validacionS(asignarPermisosSchema),
    RolController.asignarPermisos
);

router.route('/permisos')
    .all(autenticacion, authorize('permisos:ver'))
    .get(PermisoController.obtenerTodosPermisos);

//---------------------------------------------------

router.route('/horarios')
    .all(autenticacion, authorize('horario:ver'))
    .post(createHorario)
    .get(getAllHorarios);

router.route('/horarios/:id')
    .all(autenticacion, authorize('horario:ver'))
    .get(getHorarioById)
    .put(updateHorario)
    .delete(deleteHorario);

router.get("/horarios/empleado/:empleadoId", getHorarioByEmpleado);

router.put('/horarios/:id/estado', autenticacion, authorize('horario:ver'), updateEstadoHorario);

router.route('/proveedores')
    .all(autenticacion)
    .post(authorize('proveedores:ver'), createProveedor)
    .get(getAllProveedores);

router.route('/proveedores/:id')
    .all(autenticacion)
    .get(getProveedorById)
    .put(authorize('proveedores:ver'), updateProveedor)
    .delete(authorize('proveedores:ver'),deleteProveedor);

router.route('/cat_servicios')
    .all(autenticacion) 
    .post(authorize('cat_servicios:ver'), createCatServicio)
    .get(getAllCatServicios);

router.route('/cat_servicios/:id')
    .all(autenticacion)
    .get(getCatServicioById)
    .put(authorize('cat_servicios:ver'), updateCatServicio)
    .delete(authorize('cat_servicios:ver'), deleteCatServicio);

router.route('/servicios')
    .all(autenticacion)
    .post(authorize('servicios:ver'), upload.single('Imagenes'), createServicio)
    .get(getAllServicios);

router.route('/servicios/:id')
    .all(autenticacion)
    .get(getServicioById)
    .put(authorize('servicios:ver'), upload.single('Imagenes'), updateServicio)
    .delete(authorize('servicios:ver'), deleteServicio);

router.patch('/servicios/:id/estado', autenticacion, authorize('servicios:ver'), updateServicio);

router.route('/productos')
    .all(autenticacion)
    .post(authorize('productos:ver'), upload.single('Imagenes'), crearProductoController) // 👈 Nuevo: Middleware `upload.single('imagen')`
    .get(obtenerProductosController); 

router.route('/productos/:id')
    .all(autenticacion)
    .get(obtenerProductoPorIdController)
    .put(authorize('productos:ver'), upload.single('Imagenes'), actualizarProductoController) // 👈 Nuevo: Middleware `upload.single('imagen')`
    .delete(authorize('productos:ver'), eliminarProductoController);

router.route('/cat_productos')
    .all(autenticacion)
    .get(getAllCatProductos)
    .post(authorize('cat_productos:ver'), createCatProducto);

router.route('/cat_productos/:id')
    .all(autenticacion)
    .get(getCatProductoById)
    .put(authorize('cat_productos:ver'), updateCatProducto)
    .delete(authorize('cat_productos:ver'), deleteCatProducto);

router.route('/citas')
    .all(autenticacion)
    .post(authorize('citas:ver'), createCitaController)
    .get(getAllCitasController);

router.route('/citas/:id')
    .all(autenticacion) 
    .get(getCitaByIdController)
    .put(authorize('citas:ver'), updateCitaController);

router.patch('/citas/:id/estado', autenticacion, authorize('citas:ver'), validacionS(updateCitaEstadoSchema), updateCitaController);

router.route('/ventas')
    .all(autenticacion)
    .get(getAllSales)
    .post(autenticacion, authorize('ventas:ver'), validacionS(createSaleSchema), createSale); 

router.route('/ventas/:id')
    .all(autenticacion)
    .get(getSaleById)
    .patch(authorize('ventas:ver'), validacionS(updateSaleSchema), updateSale)

router.route('/ventas/:id/annulSale')
    .all(autenticacion)
    .patch(authorize('ventas:ver'), annulSale);

router.route('/compras')
    .all(autenticacion, authorize('compras:ver'))
    .get(getAllCompras)
    .post(autenticacion, authorize('compras:ver'), createCompra);

router.route('/compras/:id')
    .all(autenticacion)
    .get(authorize('compras:ver'), getCompraById)
    .put(authorize('compras:ver'), updateCompra)
    .patch(authorize('compras:ver'), updateCompra);

router.route('/compras/:id/annul')
    .all(autenticacion)
    .put(authorize('compras:ver'), annulCompra)
    .patch(authorize('compras:ver'), annulCompra);

router.route('/compras/:compraId/details')
    .all(autenticacion)
    .post(authorize('compras:ver'), addDetailToCompra);

router.route('/compras/:compraId/details/:detailId')
    .all(autenticacion)
    .put(authorize('compras:ver'), updateDetailInCompra)
    .patch(authorize('compras:ver'), updateDetailInCompra)
    .delete(authorize('compras:ver'), deleteDetailFromCompra);

// --- Abastecimiento Routes ---
router.route('/abastecimientos')
  .all(autenticacion, authorize('abastecimiento:ver'))
  .get(AbastecimientoController.getAllAbastecimientos)
  .post(autenticacion, authorize('abastecimiento:ver'), validacionS(createAbastecimientoSchema), AbastecimientoController.createAbastecimiento);

router.route('/abastecimientos/:id')
  .all(autenticacion, authorize('abastecimiento:ver'))
  .get(AbastecimientoController.getAbastecimientoById)
  .put(validacionS(updateAbastecimientoSchema), AbastecimientoController.updateAbastecimiento)
  .patch(validacionS(updateAbastecimientoSchema), AbastecimientoController.updateAbastecimiento);

router.route('/abastecimientos/:id/annul')
  .all(autenticacion, authorize('abastecimiento:ver'))
  .patch(AbastecimientoController.annulAbastecimiento);

export default router;