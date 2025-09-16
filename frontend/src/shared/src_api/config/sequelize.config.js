// src/config/sequelize.config.js
const { Sequelize } = require("sequelize");
const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
  IS_PRODUCTION,
  DATABASE_URL,
  NODE_ENV,
  DB_STORAGE,
} = require("./env.config");

const commonOptions = {
  dialect: DB_DIALECT || "postgres",
  logging: console.log,
  define: { timestamps: false, freezeTableName: true },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
};

let sequelize;

if (IS_PRODUCTION && DATABASE_URL) {
  console.log(
    "🟢 Configurando Sequelize para PostgreSQL (Producción con DATABASE_URL)"
  );
  sequelize = new Sequelize(DATABASE_URL, {
    ...commonOptions,
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  });
} else if (IS_PRODUCTION) {
  if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST || !DB_PORT) {
    console.error(
      "❌ Faltan variables de entorno de base de datos para producción en Sequelize."
    );
    process.exit(1);
  }
  console.log(
    "🟡 Configurando Sequelize para PostgreSQL (Producción con variables individuales)"
  );
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    ...commonOptions,
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  });
} else {
  const dialect = DB_DIALECT || "sqlite";
  console.log(
    `🟢 Configurando Sequelize para ${dialect} (${NODE_ENV || "Local"})`
  );
  if (dialect === "sqlite") {
    if (!DB_STORAGE) {
      console.error("❌ Falta la variable de entorno DB_STORAGE para SQLite.");
      process.exit(1);
    }
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: DB_STORAGE,
      ...commonOptions,
    });
  } else {
    if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST || !DB_PORT) {
      console.error(
        `❌ Faltan variables de entorno de base de datos para ${dialect} en ${
          NODE_ENV || "desarrollo/prueba"
        }.`
      );
      process.exit(1);
    }
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: DB_PORT,
      ...commonOptions,
      dialect,
    });
  }
}

module.exports = sequelize;
