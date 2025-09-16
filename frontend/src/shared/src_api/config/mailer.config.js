// src/config/mailer.config.js
const nodemailer = require("nodemailer");
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  IS_DEVELOPMENT,
} = require("./env.config");

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ Advertencia: Credenciales de email no configuradas. El envío de correos podría fallar."
  );
}

const DEFAULT_EMAIL_HOST = "smtp.gmail.com";
const DEFAULT_EMAIL_PORT = 587;

const mailerConfig = {
  host: EMAIL_HOST || DEFAULT_EMAIL_HOST,
  port: EMAIL_PORT || DEFAULT_EMAIL_PORT,
  secure: EMAIL_SECURE || false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  ...(IS_DEVELOPMENT &&
    EMAIL_HOST !== DEFAULT_EMAIL_HOST && {
      tls: { rejectUnauthorized: false },
    }),
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
};

const transporter = nodemailer.createTransport(mailerConfig);

transporter.verify((error, success) => {
  if (error) {
    console.error(
      "❌ Error al verificar la configuración de Nodemailer:",
      error.message
    );
    console.warn("⚠️ El servicio de correo podría no estar operativo.");
  } else {
    console.log("📨 Servidor de correo listo para enviar mensajes.");
  }
});

module.exports = transporter;
