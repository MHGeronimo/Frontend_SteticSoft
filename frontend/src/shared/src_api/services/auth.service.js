// src/shared/src_api/services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  CustomError,
  ConflictError,
} = require("../errors");
const {
  JWT_SECRET,
  EMAIL_FROM,
  APP_NAME,
  FRONTEND_URL,
} = require("../config/env.config");
const mailerService = require("./mailer.service.js");

const JWT_EXPIRATION = "1d";
const TOKEN_RECUPERACION_EXPIRATION_MINUTES = 60;
const saltRounds = 10;

/**
 * Registra un nuevo usuario y su perfil de cliente asociado.
 * Asume que el rol por defecto es 'Cliente'.
 * @param {object} datosRegistro - { nombre, apellido, correo, contrasena, telefono, tipoDocumento, numeroDocumento, fechaNacimiento }
 * @returns {Promise<object>} El usuario creado (sin contraseña) y el token JWT.
 */
const registrarUsuario = async (datosRegistro) => {
  const {
    nombre,
    apellido,
    correo,
    contrasena,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    direccion,
  } = datosRegistro;

  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado para una cuenta.`
    );
  }

  const clienteConDocumento = await db.Cliente.findOne({
    where: { numeroDocumento },
  });
  if (clienteConDocumento) {
    throw new ConflictError(
      `El número de documento '${numeroDocumento}' ya está registrado para un cliente.`
    );
  }

  const clienteConCorreo = await db.Cliente.findOne({ where: { correo } });
  if (clienteConCorreo) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado para un perfil de cliente.`
    );
  }

  const rolCliente = await db.Rol.findOne({ where: { nombre: "Cliente" } });
  if (!rolCliente) {
    console.error(
      "Error crítico: El rol 'Cliente' no se encuentra en la base de datos."
    );
    throw new CustomError(
      "No se pudo completar el registro debido a un error de configuración.",
      500
    );
  }

  const transaction = await db.sequelize.transaction();
  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);

    const nuevoUsuario = await db.Usuario.create(
      {
        correo,
        contrasena: contrasenaHasheada,
        idRol: rolCliente.idRol,
        estado: true,
      },
      { transaction }
    );

    await db.Cliente.create(
      {
        idUsuario: nuevoUsuario.idUsuario,
        nombre,
        apellido,
        correo,
        telefono,
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        direccion,
        estado: true,
      },
      { transaction }
    );

    await transaction.commit();

    const payload = {
      idUsuario: nuevoUsuario.idUsuario,
      idRol: nuevoUsuario.idRol,
      rolNombre: rolCliente.nombre,
      correo: nuevoUsuario.correo,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    const { contrasena: _, ...usuarioSinContrasena } = nuevoUsuario.toJSON();

    try {
      const htmlBienvenida = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>¡Bienvenido/a a ${APP_NAME || "SteticSoft"}, ${nombre}!</h2>
          <p>Gracias por registrarte en nuestra plataforma. Tu cuenta ha sido creada exitosamente.</p>
          <p>Ahora puedes iniciar sesión y empezar a gestionar tus citas y servicios.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de ${APP_NAME || "SteticSoft"}</p>
        </div>`;
      await mailerService({
        to: nuevoUsuario.correo,
        subject: `¡Bienvenido/a a ${APP_NAME || "SteticSoft"}!`,
        html: htmlBienvenida,
      });
    } catch (emailError) {
      console.error(
        `Error al enviar correo de bienvenida a ${nuevoUsuario.correo}:`,
        emailError
      );
    }

    return { usuario: usuarioSinContrasena, token };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ConflictError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      let mensajeConflicto =
        "Uno de los datos proporcionados ya está en uso (correo o número de documento).";
      if (error.fields) {
        if (error.fields.correo && error.fields.correo === correo)
          mensajeConflicto = `El correo electrónico '${correo}' ya está registrado.`;
        if (
          error.fields.numerodocumento &&
          error.fields.numerodocumento === numeroDocumento
        )
          mensajeConflicto = `El número de documento '${numeroDocumento}' ya está registrado.`;
      }
      throw new ConflictError(mensajeConflicto);
    }
    console.error(
      "Error al registrar el usuario en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error durante el registro: ${error.message}`, 500);
  }
};

const loginUsuario = async (correo, contrasena) => {
  const usuario = await db.Usuario.findOne({
    where: { correo, estado: true },
    include: [
      {
        model: db.Rol,
        as: "rol",
        attributes: ["idRol", "nombre"],
        include: [
          {
            model: db.Permisos,
            as: "permisos",
            attributes: ["nombre"],
            through: { attributes: [] },
          },
        ],
      },
      {
        model: db.Cliente,
        as: "clienteInfo",
        required: false,
      },
    ],
  });

  if (!usuario) {
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!contrasenaValida) {
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  const payload = {
    idUsuario: usuario.idUsuario,
    idRol: usuario.idRol,
    rolNombre: usuario.rol ? usuario.rol.nombre : null,
    correo: usuario.correo,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

  // Transformar la data para el frontend
  const usuarioJSON = usuario.toJSON();

  // Extraer solo los nombres de los permisos en un array simple
  const permisosNombres = usuarioJSON.rol?.permisos?.map((p) => p.nombre) || [];

  // Limpiar datos sensibles o redundantes antes de enviar
  delete usuarioJSON.contrasena;
  if (usuarioJSON.rol) {
    delete usuarioJSON.rol.permisos; // Quitar el array de objetos de permisos
  }
  
  // Añadir el array de nombres de permisos al objeto de usuario
  usuarioJSON.permisos = permisosNombres;

  return { usuario: usuarioJSON, token };
};

const solicitarRecuperacionContrasena = async (correo) => {
  const usuario = await db.Usuario.findOne({ where: { correo, estado: true } });
  if (!usuario) {
    console.warn(
      `Intento de recuperación para correo no existente o inactivo: ${correo}`
    );
    return; // No revelar si el correo existe o no
  }

  // --- INICIO DE MODIFICACIÓN: Generación de Código OTP ---
  // Generamos un número seguro de 6 dígitos (entre 100000 y 999999)
  const tokenRecuperacion = crypto.randomInt(100000, 999999).toString();
  // --- FIN DE MODIFICACIÓN ---

  const fechaExpiracion = new Date(
    Date.now() + TOKEN_RECUPERACION_EXPIRATION_MINUTES * 60 * 1000
  );

  // Limpiamos tokens antiguos y creamos el nuevo
  await db.TokenRecuperacion.destroy({
    where: { idUsuario: usuario.idUsuario },
  });
  await db.TokenRecuperacion.create({
    idUsuario: usuario.idUsuario,
    token: tokenRecuperacion, // Guardamos el código de 6 dígitos
    fechaExpiracion,
  });

  // --- INICIO DE MODIFICACIÓN: Template de Correo para OTP ---
  // Ya no necesitamos 'enlaceRecuperacion'
  const htmlCorreo = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Tu Código de Recuperación</h2>
        <p>Hola ${usuario.correo},</p>
        <p>Has solicitado restablecer tu contraseña para ${
          APP_NAME || "SteticSoft"
        }.</p>
        <p>Usa el siguiente código de un solo uso para completar el proceso. Este código es confidencial, no lo compartas con nadie.</p>
        
        <div style="font-size: 36px; font-weight: bold; color: #000; text-align: center; letter-spacing: 5px; background: #f4f4f4; padding: 20px 0; border-radius: 5px; margin: 25px 0;">
          ${tokenRecuperacion}
        </div>

        <p>Este código expirará en <strong>${TOKEN_RECUPERACION_EXPIRATION_MINUTES} minutos</strong>.</p>
        <p>Si no solicitaste esto, por favor ignora este correo.</p>
        <p>Saludos,<br>El equipo de ${APP_NAME || "SteticSoft"}</p>
    </div>`;
  // --- FIN DE MODIFICACIÓN ---

  try {
    await mailerService({
      to: usuario.correo,
      subject: `Tu código de recuperación de contraseña - ${APP_NAME || "SteticSoft"}`,
      html: htmlCorreo,
    });
    console.log(`Correo de recuperación (OTP) enviado a ${usuario.correo}`);
  } catch (error) {
    console.error(
      `Error al enviar correo de recuperación (OTP) a ${usuario.correo}:`,
      error
    );
    // No lanzamos error al usuario, mantenemos el silencio operativo
  }
};

/**
 * Resetea la contraseña usando el Correo, el Código OTP (token) y la nueva contraseña.
 */
const resetearContrasena = async (correo, tokenCodigo, nuevaContrasena) => {
  // --- INICIO DE MODIFICACIÓN COMPLETA DE LA FUNCIÓN ---

  // 1. Validar que el usuario exista
  const usuario = await db.Usuario.findOne({ where: { correo, estado: true } });
  if (!usuario) {
    // Es importante usar el mismo mensaje de error genérico para no revelar si un correo existe o no
    throw new BadRequestError("Código de recuperación inválido, expirado o correo incorrecto.");
  }

  // 2. Validar el token (código OTP)
  // Buscamos el token que coincida con el código, el idUsuario Y que no haya expirado.
  const tokenDataValido = await db.TokenRecuperacion.findOne({
    where: {
      idUsuario: usuario.idUsuario,
      token: tokenCodigo,
      fechaExpiracion: { [Op.gt]: new Date() }, // Op.gt = "Greater Than" (Mayor que ahora)
    },
  });

  if (!tokenDataValido) {
    // Si no se encuentra, el código está mal o ya expiró.
    throw new BadRequestError("Código de recuperación inválido, expirado o correo incorrecto.");
  }

  // 3. Si el código es válido, procedemos a resetear la contraseña y eliminar el token
  const contrasenaHasheada = await bcrypt.hash(nuevaContrasena, saltRounds);
  const transaction = await db.sequelize.transaction();

  try {
    // Actualizamos la contraseña del usuario
    await usuario.update({ contrasena: contrasenaHasheada }, { transaction });

    // Eliminamos el token (OTP) para que no pueda ser reutilizado
    await db.TokenRecuperacion.destroy({
      where: { id: tokenDataValido.id }, // Usamos el ID del token encontrado
      transaction,
    });

    await transaction.commit();
    console.log(`Contraseña reseteada exitosamente para usuario ID: ${usuario.idUsuario}`);

    // (Opcional pero recomendado) Enviar correo de confirmación de cambio
    const htmlConfirmacion = `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hola ${usuario.correo},</p>
        <p>Tu contraseña para ${
          APP_NAME || "SteticSoft"
        } ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contacta a soporte inmediatamente.</p>
    </div>`;
    try {
      await mailerService({
        to: usuario.correo,
        subject: `Confirmación de Cambio de Contraseña - ${
          APP_NAME || "SteticSoft"
        }`,
        html: htmlConfirmacion,
      });
    } catch (emailError) {
      console.error(
        `Error al enviar correo de confirmación de cambio de contraseña a ${usuario.correo}:`,
        emailError
      );
    }
  } catch (error) {
    await transaction.rollback();
    console.error(
      `Error al resetear la contraseña (transacción) para usuario ID ${usuario.idUsuario}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al procesar el reseteo de contraseña: ${error.message}`,
      500
    );
  }
  // --- FIN DE MODIFICACIÓN COMPLETA ---
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacionContrasena,
  resetearContrasena,
};