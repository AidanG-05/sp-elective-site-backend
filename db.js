const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 55, // Prevent CPU from overloading
  queueLimit: 0
});

// Ping to prevent idle disconnects
setInterval(() => {
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.error('Keep-alive DB ping failed:', err.message);
    } else {
      console.log('Keep-alive DB ping successful');
    }
  });
}, 6 * 60 * 60 * 1000);

pool.getConnection((err, conn) => {
  if (err) {
    console.error('Error connecting to DB on startup:', err.message);
  } else {
    console.log('DB connected successfully');
    conn.release();
  }
});

pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err.message);
});

module.exports = pool;