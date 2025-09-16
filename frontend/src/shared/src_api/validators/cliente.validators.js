// src/validators/cliente.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Expresiones Regulares para Validación (Consistentes con usuario.validators.js) ---
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const numericOnlyRegex = /^\d+$/;
const addressRegex = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\-_]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// --- Validador para CREAR Cliente (POST /) ---
const clienteCreateValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),

  body("apellido")
    .trim()
    .notEmpty().withMessage("El apellido es obligatorio.")
    .isLength({ min: 3, max: 100 }).withMessage("El apellido debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),

  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("El formato del correo no es válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuario = await db.Usuario.findOne({ where: { correo: value } });
      if (usuario) {
        return Promise.reject("Este correo electrónico ya está registrado.");
      }
    }),

  body("telefono")
    .trim()
    .notEmpty().withMessage("El teléfono es obligatorio.")
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números."),

  body("tipoDocumento")
    .trim()
    .notEmpty().withMessage("El tipo de documento es obligatorio.")
    .isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"])
    .withMessage("Tipo de documento no válido."),

  body("numeroDocumento")
    .trim()
    .notEmpty().withMessage("El número de documento es obligatorio.")
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres.")
    .custom(async (value) => {
      const cliente = await db.Cliente.findOne({ where: { numeroDocumento: value } });
      if (cliente) {
        return Promise.reject("Este número de documento ya está registrado.");
      }
    }),

  body("fechaNacimiento")
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("Formato de fecha no válido (debe ser YYYY-MM-DD).")
    .toDate()
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        throw new Error("El cliente debe ser mayor de 18 años.");
      }
      return true;
    }),

  body("direccion")
    .trim()
    .notEmpty().withMessage("La dirección es obligatoria.")
    .isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.")
    .matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),

  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres.")
    .matches(passwordRegex).withMessage("La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial."),

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR Cliente (PUT /:idCliente) ---
const clienteUpdateValidators = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente es inválido."),

  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),

  body("apellido")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("El apellido debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),

  body("correo")
    .optional()
    .trim()
    .isEmail().withMessage("El formato del correo no es válido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const idCliente = req.params.idCliente;
      const clienteActual = await db.Cliente.findByPk(idCliente);
      if (!clienteActual || !clienteActual.idUsuario) {
        return; 
      }
      const usuario = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: clienteActual.idUsuario },
        },
      });
      if (usuario) {
        return Promise.reject("Este correo electrónico ya está en uso por otro usuario.");
      }
    }),

  body("telefono")
    .optional()
    .trim()
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números."),

  body("tipoDocumento")
    .optional()
    .trim()
    .isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"])
    .withMessage("Tipo de documento no válido."),

  body("numeroDocumento")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres.")
    .custom(async (value, { req }) => {
      const idCliente = req.params.idCliente;
      const cliente = await db.Cliente.findOne({
        where: {
          numeroDocumento: value,
          idCliente: { [db.Sequelize.Op.ne]: idCliente }, 
        },
      });
      if (cliente) {
        return Promise.reject("Este número de documento ya está en uso por otro cliente.");
      }
    }),

  body("fechaNacimiento")
    .optional()
    .isISO8601().withMessage("Formato de fecha no válido (debe ser YYYY-MM-DD).")
    .toDate()
    .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw new Error("El cliente debe ser mayor de 18 años.");
        }
        return true;
    }),

  body("direccion")
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.")
    .matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),

  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),

  handleValidationErrors,
];

// Validador genérico para rutas que solo usan el ID del cliente
const idClienteValidator = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  handleValidationErrors,
];

// Validador para el cambio de estado
const cambiarEstadoClienteValidators = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  body("estado").isBoolean().withMessage("El valor de 'estado' debe ser un booleano."),
  handleValidationErrors,
];

const updateMiPerfilValidators = [
  body("nombre")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre no puede estar vacío.")
    .isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres."),
  body("apellido")
    .optional()
    .trim()
    .notEmpty().withMessage("El apellido no puede estar vacío.")
    .isLength({ min: 3, max: 50 }).withMessage("El apellido debe tener entre 3 y 50 caracteres."),
  body("telefono")
    .optional()
    .trim()
    .notEmpty().withMessage("El teléfono no puede estar vacío.")
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .isNumeric().withMessage("El teléfono solo puede contener números."),
  body("direccion")
    .optional()
    .trim(),
  body("correo")
    .optional()
    .trim()
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      // req.user.clienteInfo.correo es el correo actual del cliente
      if (value.toLowerCase() !== req.user.clienteInfo.correo.toLowerCase()) {
        const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
        if (usuarioExistente) {
          return Promise.reject("El correo electrónico ya está en uso por otra cuenta.");
        }
      }
    }),
  // Impedir la actualización de campos sensibles por parte del cliente
  body("tipoDocumento").not().exists().withMessage("El tipo de documento no se puede modificar."),
  body("numeroDocumento").not().exists().withMessage("El número de documento no se puede modificar."),
  body("estado").not().exists().withMessage("El estado no se puede modificar."),
  handleValidationErrors,
];


module.exports = {
  clienteCreateValidators,
  clienteUpdateValidators,
  idClienteValidator,
  cambiarEstadoClienteValidators,
  updateMiPerfilValidators,
};