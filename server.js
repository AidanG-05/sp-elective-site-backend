require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const db = require('./db');
const app = express();
app.use(cors());
app.use(express.json()); 

//temporary error catch to show on console
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
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

//Post review to the database
app.post('/review/submission', (req, res) => {
  const {
    Academic_Year,
    Semester,
    Ratings,
    Rating_Reason,
    TLDR_experiences,
    Assignment_Review,
    Assignment_Weightage,
    Life_Hacks,
    Elective_Code,
    Elective_Module
  } = req.body;

  const sql = `
    INSERT INTO user_reviews (
      Elective_Module,
      Elective_Code,
      Academic_Year,
      Semester,
      Ratings,
      Rating_Reason,
      TLDR_experiences,
      Assignment_Review,
      Assignment_Weightage,
      Life_Hacks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    Elective_Module,
    Elective_Code,
    Academic_Year,
    Semester,
    Ratings,
    Rating_Reason,
    TLDR_experiences,
    Assignment_Review,
    Assignment_Weightage,
    Life_Hacks
  ], (err, result) => {
    if (err) {
      console.error('Error saving review:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json({ message: 'Review saved successfully' });
  });
});

//API Connection check
app.get('/health', (req, res) => {
  const startTime = Date.now();

  db.query({ sql: 'SELECT 1', timeout: 3000 }, (err) => { 
    const duration = Date.now() - startTime;

    if (err) {
      console.error(`MySQL ping failed after ${duration}ms:`, err.message);
      return res.status(500).json({
        status: 'API unhealthy',
        db: 'disconnected',
        responseTimeMs: duration
      });
    }

    res.status(200).json({
      status: 'API is healthy',
      db: 'connected',
      responseTimeMs: duration
    });
  });
});

// Handle routing error
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 5s global timeout
app.use((req, res, next) => {
  res.setTimeout(5000, () => { 
    console.warn(`Request timeout for ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out' });
    }
  });
  next();
});

// Start the server
const PORT = process.env.PORT || 5001;
console.log("Server script started!");
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For pool disconnection and complete shutdown of script
const shutdown = () => {
  console.log('Gracefully shutting down...');
  db.end((err) => {
    if (err) console.error('Error closing MySQL pool:', err.message);
    else console.log('MySQL pool closed.');
    process.exit(err ? 1 : 0);
  });
};

process.on('SIGINT', shutdown); // local
process.on('SIGTERM', shutdown); // hosted