// src/config/session.config.js
const session = require("express-session");
const pgSessionStore = require("connect-pg-simple")(session);
const pool = require("./database.config");
const { SESSION_SECRET, IS_PRODUCTION } = require("./env.config");

if (!SESSION_SECRET) {
  console.error(
    "❌ ERROR: SESSION_SECRET no está definida. La sesión no funcionará de forma segura."
  );
  process.exit(1);
}

const SESSION_TABLE = "user_sessions";
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24; // 1 día

const sessionMiddleware = session({
  store: new pgSessionStore({
    pool,
    tableName: SESSION_TABLE,
    createTableIfMissing: true,
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PRODUCTION,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
  },
  // proxy: IS_PRODUCTION,
  // name: 'steticsoft.sid',
});

module.exports = sessionMiddleware;
