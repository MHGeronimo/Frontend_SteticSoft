// src/config/database.config.js
const { Pool } = require("pg");
const {
  DATABASE_URL,
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  IS_PRODUCTION,
} = require("./env.config");

const DEFAULT_POOL_MAX = 10;
const DEFAULT_IDLE_TIMEOUT = 30000;
const DEFAULT_CONN_TIMEOUT = IS_PRODUCTION ? 5000 : 2000;

let pgPoolConfig;

if (IS_PRODUCTION && DATABASE_URL) {
  console.log("🟢 pg.Pool configurado para producción usando DATABASE_URL.");
  pgPoolConfig = {
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: DEFAULT_POOL_MAX,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT,
    connectionTimeoutMillis: DEFAULT_CONN_TIMEOUT,
  };
} else {
  if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASS || !DB_PORT) {
    console.error(
      "❌ Faltan variables de entorno para la conexión local de PostgreSQL."
    );
    process.exit(1);
  }
  console.log(
    `🟢 pg.Pool configurado para ${
      IS_PRODUCTION ? "producción (variables individuales)" : "desarrollo"
    }.`
  );
  pgPoolConfig = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASS,
    port: DB_PORT,
    max: DEFAULT_POOL_MAX,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT,
    connectionTimeoutMillis: DEFAULT_CONN_TIMEOUT,
    ...(IS_PRODUCTION && { ssl: { rejectUnauthorized: false } }),
  };
}

const pool = new Pool(pgPoolConfig);

pool.on("connect", () => {
  console.log("ℹ️ pg.Pool: Nuevo cliente conectado al pool de PostgreSQL.");
});
pool.on("error", (err) => {
  console.error(
    "❌ pg.Pool: Error inesperado en cliente inactivo del pool.",
    err
  );
});

module.exports = pool;
