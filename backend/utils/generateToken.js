import jwt from 'jsonwebtoken';

export const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m', // Access token valid for 15 minutes
  });
};

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // Refresh token valid for 7 days
  });
};
