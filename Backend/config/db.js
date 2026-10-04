const mysql = require('mysql2');
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verify initial database connection and handle errors
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused. Please check your DB credentials and server status.');
    } else {
      console.error('Database connection error:', err.message);
    }
    return;
  }

  if (connection) {
    connection.release();
    console.log('Connected to MySQL database successfully.');
  }
});

// Export the promise-wrapped pool for async/await support
module.exports = pool.promise();