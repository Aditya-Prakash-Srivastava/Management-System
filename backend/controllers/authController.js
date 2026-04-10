import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'USER',
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token to db
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(401).json({ message: 'Refresh token required' });

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      
      if (!user || user.refreshToken !== token) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const newAccessToken = generateAccessToken(user.id, user.role);
      res.json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(401).json({ message: 'Token verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
