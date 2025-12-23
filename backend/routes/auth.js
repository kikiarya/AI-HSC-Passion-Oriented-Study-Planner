import express from 'express';
const router = express.Router();
import { signUp } from '../controllers/signUp.js';
import { login } from '../controllers/login.js';
import { changePassword } from '../controllers/ChangePassword.js';
import { verifyAuth } from '../middleware/auth.js';

// POST /auth/signup - Register a new user
router.post('/signup', signUp);

// POST /auth/login - Login a user
router.post('/login', login);

// POST /auth/logout - Logout a user (frontend handles this by clearing tokens)
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});


// POST /auth/change-password - Change password (requires authentication)
router.post('/change-password', verifyAuth, changePassword);

export {
  router as authRoutes
};