import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      username?: string;
    };
  }
}

export interface UserPayload {
  id: string;
  email: string;
  username?: string;
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  // Generate access token (short-lived)
  generateAccessToken(payload: UserPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);
  }

  // Generate refresh token (long-lived)
  generateRefreshToken(payload: UserPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as jwt.SignOptions);
  }

  // Verify access token
  verifyAccessToken(token: string): UserPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JwtPayload;
      return {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };
    } catch {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): UserPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as JwtPayload;
      return {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };
    } catch {
      return null;
    }
  }

  // Generate token pair
  generateTokenPair(payload: UserPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}

// Middleware to authenticate requests
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  const jwtService = new JWTService();
  const user = jwtService.verifyAccessToken(token);

  if (!user) {
    res.status(403).json({ message: 'Invalid or expired token' });
    return;
  }

  req.user = user;
  next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const jwtService = new JWTService();
    const user = jwtService.verifyAccessToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
};

export default JWTService;