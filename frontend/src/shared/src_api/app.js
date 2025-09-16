// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Importar configuraciones
const {
  CORS_ORIGIN,
  NODE_ENV,
  LOG_LEVEL,
} = require("./config/env.config.js");

// Importar middlewares
const sessionMiddleware = require("./config/session.config.js");
const apiRoutes = require("./routes/index.js");
const healthRoutes = require("./routes/health.routes.js");
const { NotFoundError } = require("./errors/NotFoundError.js");
const errorHandler = require("./middlewares/errorHandler.middleware.js");

// Crear la instancia de la aplicación Express
const app = express();


// --- Middlewares Esenciales ---

// 1. Helmet (para seguridad básica)
app.use(helmet());

// ✅ 2. CORS (CONFIGURACIÓN DEFINITIVA Y CORRECTA)
// Esta es la parte más importante. Define qué "orígenes" (dominios) tienen permiso.
const whitelist = [CORS_ORIGIN, "http://localhost:5173", "http://localhost:5174"];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite peticiones sin origen (como las de Postman o apps móviles) y las de la whitelist
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Permite que el frontend envíe cookies o tokens de autorización
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
};

// Se aplica el middleware de CORS ANTES de las rutas.
app.use(cors(corsOptions));


// 3. Morgan (para logs de peticiones)
if (NODE_ENV === "development") {
  app.use(morgan(LOG_LEVEL || "dev"));
}

// 4. Parseadores de Cuerpo (para leer JSON)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Configuración de Sesiones
app.use(sessionMiddleware);


// --- Rutas ---

// Servir archivos estáticos (si los tienes)
app.use(express.static(path.join(__dirname, "public")));

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

// Rutas principales de la API
app.use("/api", apiRoutes);

// Rutas de chequeo de salud
app.use("/api/health", healthRoutes);


// --- Manejo de Errores (al final de todo) ---

// Manejador para Rutas No Encontradas (404)
app.use((req, res, next) => {
    next(new NotFoundError(`El recurso solicitado no fue encontrado: ${req.method} ${req.originalUrl}`));
});

// Middleware Global de Manejo de Errores
app.use(errorHandler);


// Exportar la aplicación
module.exports = app;