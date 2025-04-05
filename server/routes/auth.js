const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Import the MySQL connection
const { v4: uuidv4 } = require('uuid'); // For generating unique reset tokens
const nodemailer = require('nodemailer'); // For sending emails

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

  // Logout route
// Ensure this route is properly defined
router.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to log out' });
    }
    // Send a success response
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

  
// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Generate a password reset token
    const resetToken = uuidv4();

    // Save the reset token in the database (you can also set an expiration time)
    await db.query('UPDATE users SET reset_token = ? WHERE email = ?', [resetToken, email]);

    // Create a password reset link
    const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email provider
      auth: {
        user: 'darjiharsh2005@gmail.com', // Your email
        pass: 'harsh12', // Your email password or app password
      },
    });

    // Email options
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Hello,\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Reset link sent to your email!' });
  } catch (error) {
    console.error('Error in forgot-password route:', error);
    res.status(500).json({ success: false, message: 'Error sending reset link. Please try again.' });
  }
});

module.exports = router;