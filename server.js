const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./server/db'); // Import the MySQL connection
const session = require('express-session');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your_secret_key', // Use a strong secret key
  resave: false,
  saveUninitialized: true, // or false, depending on your use case
  cookie: { secure: false } // Use secure cookies if you're on HTTPS
}));

// Test MySQL connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
    connection.release(); // Release the connection back to the pool
  }
});

// Routes
app.use('/api/auth', require('./server/routes/auth')); // Authentication routes

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/api/profile', (req, res) => {
  if (req.session.user) {
    // Send the user data from the session
    res.json({
      email: req.session.user.email,
      village: req.session.user.village,
    });
  } else {
    // If the user is not logged in, send an error response
    res.status(401).json({ message: 'User not logged in' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});