const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database ✅");
  }
});

// Ensure `patients` table exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      gender TEXT,
      history TEXT,
      symptoms TEXT,
      additional_info TEXT,
      correct_test TEXT,
      correct_diagnosis TEXT
    )
  `, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Patients table ready ✅");
    }
  });
});

module.exports = db;
