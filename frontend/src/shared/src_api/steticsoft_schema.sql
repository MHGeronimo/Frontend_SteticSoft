-- =================================================================================================
--         SCRIPT DE BASE DE DATOS PARA STETICSOFT - DEFINICIÓN Y ESTRUCTURA (ACTUALIZADO)
-- =================================================================================================
-- Este script define la estructura completa y las relaciones para la base de datos de SteticSoft.
-- El diseño se adhiere a los siguientes principios y convenciones:
--
-- 1.   Nomenclatura de Base de Datos:
--       - Todas las tablas, columnas e índices utilizan el formato `snake_case` (ej. `id_rol`,
--         `fecha_nacimiento`) para mantener la consistencia y alinearse con las convenciones
--         estándar de PostgreSQL.
--
-- 2.   Políticas de Integridad Referencial (Claves Foráneas):
--       - Política `ON DELETE RESTRICT`: Es la política por defecto para la mayoría de las
--         relaciones. Previene la eliminación de un registro si es referenciado por otra
--         tabla, garantizando que no se pierda información histórica ni se generen datos
--         inconsistentes (ej. no se puede eliminar un cliente con ventas asociadas).
--       - Política `ON DELETE CASCADE`: Se utiliza en tablas de unión (ej. `permisos_x_rol`) o
--         en registros de detalle cuya existencia depende completamente de su registro "padre"
--         (ej. `servicio_x_cita`). Si el registro padre se elimina, sus detalles se eliminan
--         automáticamente.
--       - Política `ON DELETE SET NULL`: Se usa selectivamente cuando un registro puede
--         perder una asociación opcional sin afectar su integridad (ej. un empleado
--         asignado a un abastecimiento).
--
-- 3.   Estructura General:
--       - El esquema está organizado lógicamente en tablas de seguridad (rol, usuario, permisos),
--         tablas maestras (cliente, producto, servicio), tablas transaccionales (venta, compra, cita)
--         y tablas de detalle o unión que conectan las demás entidades.
--
-- 4.   Tipos de Datos y Restricciones:
--       - Se utilizan tipos de datos específicos (`VARCHAR`, `DECIMAL`, `TIMESTAMP WITH TIME ZONE`)
--         para asegurar la correcta representación y validación de la información a nivel de
--         base de datos. Se aplican restricciones `NOT NULL`, `UNIQUE` y `CHECK` donde es
--         necesario para mantener la calidad de los datos.
-- =================================================================================================

-- =================================================================================================
-- BLOQUE DE LIMPIEZA (OPCIONAL)
-- =================================================================================================
-- DROP TABLE IF EXISTS token_recuperacion CASCADE;
-- DROP TABLE IF EXISTS abastecimiento CASCADE;
-- DROP TABLE IF EXISTS venta_x_servicio CASCADE;
-- DROP TABLE IF EXISTS producto_x_venta CASCADE;
-- DROP TABLE IF EXISTS compra_x_producto CASCADE;
-- DROP TABLE IF EXISTS servicio_x_cita CASCADE;
-- DROP TABLE IF EXISTS novedades CASCADE;
-- DROP TABLE IF EXISTS empleado_especialidad CASCADE;
-- DROP TABLE IF EXISTS cita CASCADE;
-- DROP TABLE IF EXISTS venta CASCADE;
-- DROP TABLE IF EXISTS compra CASCADE;
-- DROP TABLE IF EXISTS servicio CASCADE;
-- DROP TABLE IF EXISTS producto CASCADE;
-- DROP TABLE IF EXISTS categoria_servicio CASCADE;
-- DROP TABLE IF EXISTS categoria_producto CASCADE;
-- DROP TABLE IF EXISTS proveedor CASCADE;
-- DROP TABLE IF EXISTS especialidad CASCADE;
-- DROP TABLE IF EXISTS empleado CASCADE;
-- DROP TABLE IF EXISTS cliente CASCADE;
-- DROP TABLE IF EXISTS dashboard CASCADE;
-- DROP TABLE IF EXISTS estado CASCADE;
-- DROP TABLE IF EXISTS permisos_x_rol CASCADE;
-- DROP TABLE IF EXISTS historial_cambios_rol CASCADE;
-- DROP TABLE IF EXISTS usuario CASCADE;
-- DROP TABLE IF EXISTS permisos CASCADE;
-- DROP TABLE IF EXISTS rol CASCADE;

-- =================================================================================================
-- TABLAS DE SEGURIDAD
-- =================================================================================================
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    tipo_perfil VARCHAR(10) NOT NULL DEFAULT 'EMPLEADO' CHECK (tipo_perfil IN ('CLIENTE', 'EMPLEADO', 'NINGUNO')),
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS permisos_x_rol (
    id_rol INT REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_permiso INT REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    asignado_por INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    id_rol INT REFERENCES rol(id_rol) ON DELETE RESTRICT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla de Auditoría para Roles
CREATE TABLE IF NOT EXISTS historial_cambios_rol (
    id_historial SERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_usuario_modifico INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================================================
-- TABLAS MAESTRAS
-- =================================================================================================
CREATE TABLE IF NOT EXISTS dashboard (
    id_dashboard SERIAL PRIMARY KEY,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    nombre_dashboard VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS estado (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(45) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(45) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    direccion TEXT NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS empleado (
    id_empleado SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(45) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    tipo_documento VARCHAR(50),
    numero_documento VARCHAR(45),
    nit_empresa VARCHAR(45) UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT NOT NULL,
    nombre_persona_encargada VARCHAR(100),
    telefono_persona_encargada VARCHAR(20),
    email_persona_encargada VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (nombre, tipo)
);

CREATE TABLE IF NOT EXISTS categoria_producto (
    id_categoria_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS categoria_servicio (
    id_categoria_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    existencia INT DEFAULT 0 CHECK (existencia >= 0),
    precio DECIMAL(12, 2) DEFAULT 0.00,
    stock_minimo INT DEFAULT 0,
    stock_maximo INT DEFAULT 0,
    imagen VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    vida_util_dias INT,
    tipo_uso VARCHAR(10) NOT NULL CHECK (tipo_uso IN ('Interno', 'Externo')),
    id_categoria_producto INT REFERENCES categoria_producto(id_categoria_producto) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS servicio (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    imagen VARCHAR(255),
    id_categoria_servicio INT NOT NULL REFERENCES categoria_servicio(id_categoria_servicio) ON DELETE RESTRICT,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

-- =================================================================================================
-- TABLAS DE OPERACIONES
-- =================================================================================================
CREATE TABLE IF NOT EXISTS compra (
    id_compra SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(12, 2) DEFAULT 0.00 CHECK (total >= 0.00),
    iva DECIMAL(12, 2) DEFAULT 0.00 CHECK (iva >= 0.00),
    id_proveedor INT REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS venta (
    id_venta SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(12, 2) DEFAULT 0.00,
    iva DECIMAL(12, 2) DEFAULT 0.00,
    id_cliente INT REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL,
    id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT
);

-- Tabla: novedades
-- Propósito: Permite definir horarios de trabajo excepcionales o diferentes al estándar para un empleado.
CREATE TABLE IF NOT EXISTS novedades (
    id_novedad SERIAL PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    dias JSONB NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT chk_rango_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_rango_horas CHECK (hora_fin > hora_inicio)
);

-- TABLA DE UNIÓN: Asigna novedades a empleados (Relación Muchos a Muchos)
CREATE TABLE IF NOT EXISTS novedad_empleado (
    id_novedad INT NOT NULL,
    id_usuario INT NOT NULL,

    -- Llave primaria compuesta para que no se pueda asignar la misma novedad al mismo empleado dos veces
    CONSTRAINT pk_novedad_empleado PRIMARY KEY (id_novedad, id_usuario),

    -- Llave foránea que apunta a la tabla de novedades
    CONSTRAINT fk_novedad
        FOREIGN KEY (id_novedad)
        REFERENCES novedades(id_novedad)
        ON DELETE CASCADE, -- Si se borra la novedad, se borra la asignación

    -- Llave foránea que apunta a la tabla de usuarios (empleados)
    CONSTRAINT fk_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE -- Si se borra el usuario, se borra la asignación
);


CREATE TABLE IF NOT EXISTS cita (
    id_cita SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    precio_total DECIMAL(10, 2),
    estado VARCHAR(255) NOT NULL DEFAULT 'Activa',
    id_cliente INTEGER NOT NULL REFERENCES cliente (id_cliente),
    id_usuario INTEGER REFERENCES usuario (id_usuario),
    id_estado INTEGER REFERENCES estado (id_estado),
    id_novedad INTEGER NOT NULL REFERENCES novedades (id_novedad)
);


CREATE TABLE IF NOT EXISTS servicio_x_cita (
    id_servicio_x_cita SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    id_cita INT REFERENCES cita(id_cita) ON DELETE CASCADE,
    UNIQUE (id_servicio, id_cita)
);

CREATE TABLE IF NOT EXISTS compra_x_producto (
    id_compra_x_producto SERIAL PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_compra INT REFERENCES compra(id_compra) ON DELETE CASCADE,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS producto_x_venta (
    id_producto_x_venta SERIAL PRIMARY KEY,
    cantidad INT DEFAULT 1,
    valor_unitario DECIMAL(12, 2) DEFAULT 0.00,
    id_producto INT REFERENCES producto(id_producto) ON DELETE RESTRICT,
    id_venta INT REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_dashboard INT REFERENCES dashboard(id_dashboard) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS venta_x_servicio (
    id_venta_x_servicio SERIAL PRIMARY KEY,
    valor_servicio DECIMAL(12, 2) DEFAULT 0.00,
    id_servicio INT REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    id_cita INT REFERENCES cita(id_cita) ON DELETE SET NULL,
    id_venta INT REFERENCES venta(id_venta) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS abastecimiento (
    id_abastecimiento SERIAL PRIMARY KEY,
    cantidad INT NOT NULL,
    id_producto INT NOT NULL REFERENCES producto(id_producto) ON DELETE RESTRICT,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    esta_agotado BOOLEAN DEFAULT FALSE NOT NULL,
    razon_agotamiento TEXT,
    fecha_agotamiento DATE,
    estado BOOLEAN DEFAULT TRUE NOT NULL,
    id_usuario INT REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS token_recuperacion (
    id_token_recuperacion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =================================================================================================
-- INSERTS DE SEGURIDAD
-- =================================================================================================
INSERT INTO rol (nombre, tipo_perfil, descripcion, estado) VALUES
('Administrador', 'NINGUNO', 'Acceso total a todos los módulos y funcionalidades del sistema.', TRUE),
('Empleado', 'EMPLEADO', 'Acceso a módulos operativos como ventas, citas, clientes, etc.', TRUE),
('Cliente', 'CLIENTE', 'Acceso limitado a sus propias citas, compras y gestión de perfil.', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
tipo_perfil = EXCLUDED.tipo_perfil,
descripcion = EXCLUDED.descripcion,
estado = EXCLUDED.estado;

INSERT INTO permisos (nombre, descripcion, estado) VALUES
('MODULO_ROLES_GESTIONAR', 'Permite la gestión completa de roles del sistema.', TRUE),
('MODULO_ROLES_ASIGNAR_PERMISOS', 'Permite asignar y quitar permisos a los roles.', TRUE),
('MODULO_PERMISOS_GESTIONAR', 'Permite la gestión completa de los permisos del sistema.', TRUE),
('MODULO_USUARIOS_GESTIONAR', 'Permite la gestión completa de usuarios del sistema.', TRUE),
('MODULO_DASHBOARD_VER', 'Permite visualizar los dashboards y sus datos.', TRUE),
('MODULO_ESTADOS_GESTIONAR', 'Permite la gestión de los diferentes estados de la aplicación.', TRUE),
('MODULO_CLIENTES_GESTIONAR', 'Permite la gestión completa de la información de los clientes (Admin/Empleado).', TRUE),
('MODULO_CLIENTES_VER_PROPIO', 'Permite a un cliente ver y editar su propio perfil.', TRUE),
('MODULO_EMPLEADOS_GESTIONAR', 'Permite la gestión completa de la información de los empleados.', TRUE),
('MODULO_ESPECIALIDADES_GESTIONAR', 'Permite la gestión de las especialidades.', TRUE),
('MODULO_PROVEEDORES_GESTIONAR', 'Permite la gestión completa de la información de los proveedores.', TRUE),
('MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 'Permite la gestión de las categorías de productos.', TRUE),
('MODULO_CATEGORIAS_PRODUCTOS_VER', 'Permite ver las categorías de productos (Cliente).', TRUE),
('MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'Permite la gestión de las categorías de servicios.', TRUE),
('MODULO_CATEGORIAS_SERVICIOS_VER', 'Permite ver las categorías de servicios (Cliente).', TRUE),
('MODULO_PRODUCTOS_GESTIONAR', 'Permite la gestión completa de los productos del inventario.', TRUE),
('MODULO_PRODUCTOS_VER', 'Permite ver los productos (Cliente).', TRUE),
('MODULO_COMPRAS_GESTIONAR', 'Permite la gestión de las compras a proveedores.', TRUE),
('MODULO_VENTAS_GESTIONAR', 'Permite la gestión de las ventas a clientes (Admin/Empleado).', TRUE),
('MODULO_VENTAS_CREAR_PROPIA', 'Permite a un cliente crear/realizar una venta (compra).', TRUE),
('MODULO_VENTAS_VER_PROPIAS', 'Permite a un cliente ver sus propias ventas.', TRUE),
('MODULO_CITAS_GESTIONAR', 'Permite la gestión completa de las citas (Admin/Empleado).', TRUE),
('MODULO_CITAS_CREAR_PROPIA', 'Permite a un cliente agendar sus propias citas.', TRUE),
('MODULO_CITAS_VER_PROPIAS', 'Permite a un cliente ver sus propias citas.', TRUE),
('MODULO_CITAS_CANCELAR_PROPIA', 'Permite a un cliente cancelar sus propias citas (con antelación).', TRUE),
('MODULO_SERVICIOS_GESTIONAR', 'Permite la gestión completa de los servicios ofrecidos.', TRUE),
('MODULO_SERVICIOS_VER', 'Permite ver los servicios ofrecidos (Cliente).', TRUE),
('MODULO_ABASTECIMIENTOS_GESTIONAR', 'Permite la gestión del abastecimiento de productos (salida para empleados).', TRUE),
('MODULO_NOVEDADES_EMPLEADOS_GESTIONAR', 'Permite la gestión de novedades y horarios de empleados.', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
descripcion = EXCLUDED.descripcion,
estado = EXCLUDED.estado;

INSERT INTO permisos_x_rol (id_rol, id_permiso) 
SELECT (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), p.id_permiso 
FROM permisos p WHERE p.estado = TRUE 
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO permisos_x_rol (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM rol r, permisos p 
WHERE r.nombre = 'Empleado' 
AND p.estado = TRUE 
AND p.nombre IN (
    'MODULO_ABASTECIMIENTOS_GESTIONAR', 'MODULO_VENTAS_GESTIONAR', 'MODULO_COMPRAS_GESTIONAR', 
    'MODULO_CLIENTES_GESTIONAR', 'MODULO_PROVEEDORES_GESTIONAR', 'MODULO_PRODUCTOS_GESTIONAR', 
    'MODULO_SERVICIOS_GESTIONAR', 'MODULO_CITAS_GESTIONAR', 'MODULO_ESTADOS_GESTIONAR', 
    'MODULO_DASHBOARD_VER', 'MODULO_CATEGORIAS_PRODUCTOS_GESTIONAR', 
    'MODULO_CATEGORIAS_SERVICIOS_GESTIONAR', 'MODULO_ESPECIALIDADES_GESTIONAR'
) ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO permisos_x_rol (id_rol, id_permiso) 
SELECT r.id_rol, p.id_permiso 
FROM rol r, permisos p 
WHERE r.nombre = 'Cliente' 
AND p.estado = TRUE 
AND p.nombre IN (
    'MODULO_CITAS_CREAR_PROPIA', 'MODULO_CITAS_VER_PROPIAS', 'MODULO_CITAS_CANCELAR_PROPIA', 
    'MODULO_VENTAS_CREAR_PROPIA', 'MODULO_VENTAS_VER_PROPIAS', 'MODULO_PRODUCTOS_VER', 
    'MODULO_SERVICIOS_VER', 'MODULO_CATEGORIAS_PRODUCTOS_VER', 
    'MODULO_CATEGORIAS_SERVICIOS_VER', 'MODULO_CLIENTES_VER_PROPIO'
) ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO usuario (correo, contrasena, id_rol, estado) VALUES
('mrgerito@gmail.com', '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO', 
 (SELECT id_rol FROM rol WHERE nombre = 'Administrador'), TRUE)
ON CONFLICT (correo) DO UPDATE SET
contrasena = EXCLUDED.contrasena,
id_rol = EXCLUDED.id_rol,
estado = EXCLUDED.estado;

INSERT INTO estado (id_estado, nombre_estado) VALUES
(1, 'En proceso'), (2, 'Pendiente'), (3, 'Completado'), (4, 'Cancelado')
ON CONFLICT (id_estado) DO UPDATE SET nombre_estado = EXCLUDED.nombre_estado;
