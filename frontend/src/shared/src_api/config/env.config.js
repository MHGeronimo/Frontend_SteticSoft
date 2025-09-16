// src/config/env.config.js
require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";
const isDevelopment = env === "development";

// Orígenes permitidos para CORS
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((url) => url.trim())
  : isProduction
    ? []
    : ["http://localhost:5173"];

/**
 * Lógica para validar el origen en CORS.
 * @param {string} origin
 * @param {function} callback
 */
const getCorsOriginLogic = (origin, callback) => {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("CORS: Origin no permitido → " + origin));
  }
};

/**
 * Valida que las variables obligatorias estén presentes.
 * @param {string[]} keys
 */
function validateRequiredEnv(keys) {
  keys.forEach((key) => {
    if (!process.env[key]) {
      console.warn(
        `[env.config] Advertencia: La variable ${key} no está definida en el entorno.`
      );
    }
  });
}

// Variables obligatorias (puedes agregar/quitar según tu proyecto)
validateRequiredEnv([
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "JWT_SECRET",
  "SESSION_SECRET",
  "DATABASE_URL",
]);

module.exports = {
  NODE_ENV: env,
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: isDevelopment,

  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  APP_NAME: process.env.APP_NAME || "SteticSoft API",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_DIALECT: process.env.DB_DIALECT || "sqlite",
  DB_STORAGE: process.env.DB_STORAGE || "development.sqlite",
  DB_SSL_REQUIRED: process.env.DB_SSL_REQUIRED === "true",
  DB_REJECT_UNAUTHORIZED: process.env.DB_REJECT_UNAUTHORIZED === "true",

  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,

  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT
    ? parseInt(process.env.EMAIL_PORT, 10)
    : undefined,
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM:
    process.env.EMAIL_FROM ||
    `"La fuente del peluquero - Notificaciones" <Lafuentedelpeluquero.com>`,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,

  CORS_ORIGIN: getCorsOriginLogic,

  LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? "short" : "dev"),
};
