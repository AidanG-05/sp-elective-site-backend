require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(cors());
app.use(express.json()); 

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL on AWS RDS!');
});

// Search endpoint
app.get('/modules/search', (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery) {
        return res.status(400).json({ error: "Search query is required" });
    }

    const sql = `SELECT * FROM module WHERE module_code LIKE ? OR module_name LIKE ?`;
    const searchValue = `%${searchQuery}%`;

    db.query(sql, [searchValue, searchValue], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


app.get('/modules/all', (req, res) => {
    const sql = 'SELECT * FROM module';
    
    db.query(sql, (err, results) => {
        if(err) {
            return res.status(500).json({ error: err.message})
        }
        res.json(results)
    })

})

//fetch module by module code
app.get('/modules/:module_code', (req, res) => {
  const moduleCode = req.params.module_code;
  const sql = 'SELECT * FROM module WHERE module_code = ?';

  db.query(sql, [moduleCode], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
          return res.status(404).json({ error: "Module not found" });
      }
      res.json(results[0]);
  });
});

//fetch reviews by module code
app.get('/modules/:module_code/reviews', (req, res) => {
  const moduleCode = req.params.module_code;

  const sql = `SELECT * FROM user_reviews WHERE Elective_Code = ?`;

  db.query(sql, [moduleCode], (err, results) => {
      if (err) {
          console.error("Error fetching reviews:", err);
          return res.status(500).json({ error: "Failed to fetch reviews" });
      }
      res.json(results);
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
console.log("Server script started!");
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
