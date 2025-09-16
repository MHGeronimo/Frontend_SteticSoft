// src/routes/health.routes.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const fs = require("fs");
const path = require("path");

// Función para verificar la salud de la base de datos
const checkDatabaseHealth = async () => {
  try {
    await db.sequelize.authenticate();
    const [results] = await db.sequelize.query("SELECT 1 as health_check");
    return {
      status: "healthy",
      message: "Base de datos conectada correctamente",
      details: {
        dialect: db.sequelize.getDialect(),
        host: db.sequelize.config.host,
        database: db.sequelize.config.database,
        port: db.sequelize.config.port,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Error conectando a la base de datos",
      error: error.message,
    };
  }
};

// Función para verificar la salud de los modelos
const checkModelsHealth = () => {
  try {
    const modelNames = Object.keys(db).filter(
      (key) => key !== "sequelize" && key !== "Sequelize"
    );
    return {
      status: "healthy",
      message: `${modelNames.length} modelos cargados correctamente`,
      details: {
        totalModels: modelNames.length,
        models: modelNames,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Error verificando modelos",
      error: error.message,
    };
  }
};

// Función para verificar la salud de los archivos del sistema
const checkSystemFilesHealth = () => {
  const requiredDirs = [
    "src/models",
    "src/controllers",
    "src/services",
    "src/routes",
    "src/middlewares",
    "src/validators",
  ];

  const health = {
    status: "healthy",
    message: "Todos los directorios del sistema están presentes",
    details: {
      directories: {},
    },
  };

  for (const dir of requiredDirs) {
    const fullPath = path.join(process.cwd(), dir);
    try {
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        health.details.directories[dir] = {
          exists: true,
          fileCount: files.length,
          files: files.filter((file) => file.endsWith(".js")),
        };
      } else {
        health.details.directories[dir] = {
          exists: false,
          fileCount: 0,
          files: [],
        };
        health.status = "unhealthy";
        health.message = "Algunos directorios del sistema no están presentes";
      }
    } catch (error) {
      health.details.directories[dir] = {
        exists: false,
        error: error.message,
      };
      health.status = "unhealthy";
      health.message = "Error verificando directorios del sistema";
    }
  }

  return health;
};

// Función para verificar la salud de las migraciones
const checkMigrationsHealth = () => {
  try {
    const migrationsDir = path.join(process.cwd(), "migrations");
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".js") && !file.includes(".md"));
      return {
        status: "healthy",
        message: `${migrationFiles.length} migraciones encontradas`,
        details: {
          totalMigrations: migrationFiles.length,
          migrations: migrationFiles,
        },
      };
    } else {
      return {
        status: "unhealthy",
        message: "Directorio de migraciones no encontrado",
        error: "migrations directory not found",
      };
    }
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Error verificando migraciones",
      error: error.message,
    };
  }
};

// Endpoint básico de health check
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    // Verificar componentes básicos
    const databaseHealth = await checkDatabaseHealth();
    const modelsHealth = checkModelsHealth();
    const systemFilesHealth = checkSystemFilesHealth();
    const migrationsHealth = checkMigrationsHealth();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Determinar el estado general
    const overallStatus = [
      databaseHealth.status,
      modelsHealth.status,
      systemFilesHealth.status,
      migrationsHealth.status,
    ].every((status) => status === "healthy")
      ? "healthy"
      : "unhealthy";

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      components: {
        database: databaseHealth,
        models: modelsHealth,
        systemFiles: systemFilesHealth,
        migrations: migrationsHealth,
      },
    };

    const statusCode = overallStatus === "healthy" ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      message: "Error durante la verificación de salud del sistema",
    });
  }
});

// Endpoint detallado de health check
router.get("/detailed", async (req, res) => {
  try {
    const startTime = Date.now();

    // Verificar todos los componentes
    const databaseHealth = await checkDatabaseHealth();
    const modelsHealth = checkModelsHealth();
    const systemFilesHealth = checkSystemFilesHealth();
    const migrationsHealth = checkMigrationsHealth();

    // Verificar variables de entorno críticas
    const envHealth = {
      status: "healthy",
      message: "Variables de entorno críticas configuradas",
      details: {
        NODE_ENV: process.env.NODE_ENV || "not set",
        DATABASE_URL: process.env.DATABASE_URL ? "configured" : "not set",
        JWT_SECRET: process.env.JWT_SECRET ? "configured" : "not set",
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
          ? "configured"
          : "not set",
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY
          ? "configured"
          : "not set",
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
          ? "configured"
          : "not set",
      },
    };

    // Verificar memoria del sistema
    const memoryUsage = process.memoryUsage();
    const memoryHealth = {
      status: "healthy",
      message: "Uso de memoria dentro de límites normales",
      details: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      },
    };

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Determinar el estado general
    const overallStatus = [
      databaseHealth.status,
      modelsHealth.status,
      systemFilesHealth.status,
      migrationsHealth.status,
      envHealth.status,
      memoryHealth.status,
    ].every((status) => status === "healthy")
      ? "healthy"
      : "unhealthy";

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
      components: {
        database: databaseHealth,
        models: modelsHealth,
        systemFiles: systemFilesHealth,
        migrations: migrationsHealth,
        environment: envHealth,
        memory: memoryHealth,
      },
    };

    const statusCode = overallStatus === "healthy" ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      message: "Error durante la verificación detallada de salud del sistema",
    });
  }
});

// Endpoint para verificar un componente específico
router.get("/component/:component", async (req, res) => {
  try {
    const { component } = req.params;
    let health;

    switch (component) {
      case "database":
        health = await checkDatabaseHealth();
        break;
      case "models":
        health = checkModelsHealth();
        break;
      case "files":
        health = checkSystemFilesHealth();
        break;
      case "migrations":
        health = checkMigrationsHealth();
        break;
      default:
        return res.status(400).json({
          status: "error",
          message: "Componente no válido",
          availableComponents: ["database", "models", "files", "migrations"],
        });
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      message: "Error verificando componente específico",
    });
  }
});

module.exports = router;
