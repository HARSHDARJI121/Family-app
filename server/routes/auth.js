const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Import the MySQL connection

const router = express.Router();


//signup route
router.post('/signup', async (req, res) => {
    const { email, password, confirmPassword, number, village } = req.body;
  
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
  
    try {
      // Check if user exists
      const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert user
      await db.query(
        'INSERT INTO users (email, password, number, village) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, number, village]
      );
  
      return res.status(200).json({ success: true, message: 'You have successfully registered!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  //login route
router.post('/login', async (req, res) => {
    const { email, password, number } = req.body;
  
    try {
      const [user] = await db.query('SELECT * FROM users WHERE email = ? AND number = ?', [email, number]);
      if (user.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found or number does not match' });
      }
  
      const isMatch = await bcrypt.compare(password, user[0].password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
  
    //   Optional: generate token
    //   const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.status(200).json({ success: true, message: 'Login successful' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

module.exports = router;