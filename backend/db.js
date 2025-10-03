const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Default XAMPP user
  password: '', // Default empty password
  database: 'luct_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    process.exit(1); // Exit on failure
  }
  console.log('Connected to database.');
});

module.exports = connection;