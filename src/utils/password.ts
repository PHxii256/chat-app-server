import bcrypt from 'bcryptjs';

export class PasswordService {
  private saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  }

  // Hash a plain text password
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch {
      throw new Error('Error hashing password');
    }
  }

  // Compare plain text password with hashed password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch {
      throw new Error('Error comparing passwords');
    }
  }
}

export default PasswordService;