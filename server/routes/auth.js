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
      // Check if the user exists with the provided email and number
      const [user] = await db.query('SELECT * FROM users WHERE email = ? AND number = ?', [email, number]);
      if (user.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found or number does not match' });
      }
  
      // Compare the password
      const isMatch = await bcrypt.compare(password, user[0].password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
  
      // Store user info in session
      req.session.user = {
        email: user[0].email,
        village: user[0].village,
      };
  
      // Send success response with email and village
      res.status(200).json({
        success: true,
        message: 'Login successful',
        email: user[0].email,
        village: user[0].village,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  
// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a temporary reset token (for simplicity, using a random string here)
    const resetToken = Math.random().toString(36).substring(2, 15);

    // Save the reset token in the database (you can also set an expiration time)
    await db.query('UPDATE users SET reset_token = ? WHERE email = ?', [resetToken, email]);

    // Send the reset token to the user's email (mocked here)
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.status(200).json({ success: true, message: 'Password reset instructions have been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;