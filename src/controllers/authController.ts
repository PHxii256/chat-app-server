import { Request, Response } from 'express';
import User from '../models/user';
import JWTService from '../utils/jwt';
import PasswordService from '../utils/password';

export class AuthController {
  private jwtService: JWTService;
  private passwordService: PasswordService;

  constructor() {
    this.jwtService = new JWTService();
    this.passwordService = new PasswordService();
  }

  // Register a new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, profilePic } = req.body;

      // Validation
      if (!username || !email || !password) {
        res.status(400).json({ message: 'Username, email, and password are required' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { username },
          { 'auth.email': email.toLowerCase() }
        ]
      });

      if (existingUser) {
        res.status(409).json({ message: 'User already exists with this username or email' });
        return;
      }

      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(password);

      // Create user with embedded auth
      const newUser = new User({
        username,
        profilePic: profilePic || null,
        auth: {
          email: email.toLowerCase(),
          password: hashedPassword,
          isVerified: true, // Set to false if you want email verification
          refreshTokens: []
        }
      });

      await newUser.save();

      // Generate tokens
      const payload = {
        id: newUser._id.toString(),
        email: newUser.auth!.email,
        username: newUser.username
      };

      const { accessToken, refreshToken } = this.jwtService.generateTokenPair(payload);

      // Save refresh token
      newUser.auth!.refreshTokens = [refreshToken];
      await newUser.save();

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.auth!.email,
          profilePic: newUser.profilePic
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      // Find user by email
      const user = await User.findOne({ 'auth.email': email.toLowerCase() }).select("+auth.password");

      if (!user || !user.auth?.password) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Compare password
      const isPasswordValid = await this.passwordService.comparePassword(password, user.auth.password);
      
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Check if user is verified (if verification is enabled)
      if (!user.auth.isVerified) {
        res.status(401).json({ message: 'Please verify your email before logging in' });
        return;
      }

      // Generate tokens
      const payload = {
        id: user._id.toString(),
        email: user.auth.email!,
        username: user.username
      };

      const { accessToken, refreshToken } = this.jwtService.generateTokenPair(payload);

      // Update refresh tokens (keep only last 5 for multi-device support)
      const refreshTokens = user.auth.refreshTokens || [];
      refreshTokens.push(refreshToken);
      if (refreshTokens.length > 5) {
        refreshTokens.splice(0, refreshTokens.length - 5);
      }
      user.auth.refreshTokens = refreshTokens;
      await user.save();

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.auth.email,
          profilePic: user.profilePic
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
      }

      // Verify refresh token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(403).json({ message: 'Invalid or expired refresh token' });
        return;
      }

      // Find user and check if refresh token exists
      const user = await User.findById(payload.id);
      if (!user || !user.auth?.refreshTokens?.includes(refreshToken)) {
        res.status(403).json({ message: 'Invalid refresh token' });
        return;
      }

      // Generate new token pair
      const newPayload = {
        id: user._id.toString(),
        email: user.auth.email!,
        username: user.username
      };

      const { accessToken, refreshToken: newRefreshToken } = this.jwtService.generateTokenPair(newPayload);

      // Replace old refresh token with new one
      const tokenIndex = user.auth.refreshTokens.indexOf(refreshToken);
      user.auth.refreshTokens[tokenIndex] = newRefreshToken;
      await user.save();

      res.status(200).json({
        message: 'Token refreshed successfully',
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      if (!refreshToken || !userId) {
        res.status(400).json({ message: 'Refresh token and authentication required' });
        return;
      }

      // Remove refresh token from user's token array
      const user = await User.findById(userId);
      if (user && user.auth?.refreshTokens) {
        user.auth.refreshTokens = user.auth.refreshTokens.filter(token => token !== refreshToken);
        await user.save();
      }

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Logout from all devices
  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({ message: 'Authentication required' });
        return;
      }

      // Clear all refresh tokens
      const user = await User.findById(userId);
      if (user && user.auth) {
        user.auth.refreshTokens = [];
        await user.save();
      }

      res.status(200).json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({ message: 'Authentication required' });
        return;
      }

      const user = await User.findById(userId).select('-auth.password -auth.refreshTokens');
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.auth?.email,
          profilePic: user.profilePic,
          isVerified: user.auth?.isVerified
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' }); 
    }
  }
}

export default AuthController;