// MySQL connection pool. DB_PASSWORD is intentionally required with no
// default and never read from a committed file — it must be supplied as an
// environment variable for the process that starts this server, each time.
// See .env.example for the full list of variables this reads.
import mysql from 'mysql2/promise'

if (!process.env.DB_PASSWORD) {
  throw new Error(
    'DB_PASSWORD is not set. Start the server with it as an environment ' +
      "variable for this session, e.g. (PowerShell) $env:DB_PASSWORD='...'; npm run server",
  )
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'toasty',
  waitForConnections: true,
  connectionLimit: 10,
})
