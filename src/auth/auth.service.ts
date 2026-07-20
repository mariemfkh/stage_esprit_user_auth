import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { randomBytes } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Validates user credentials (used by LocalStrategy)
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login and return access + refresh tokens
   */
  async login(user: UserDocument): Promise<AuthResponse> {
    const tokens = await this.generateTokens(user);

    // Store hashed refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default 7d

    await this.refreshTokenModel.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt,
    });

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      user: {
        id: (user._id as object).toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [user.role], // Role is now a simple string based on RoleEnum
      },
      tokens,
    };
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const saltRounds = this.configService.get<number>('bcrypt.rounds', 12);
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    this.logger.log(`New user registered: ${user.email}`);
    return this.login(user);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Accès refusé');
    }

    // Find all active (not revoked) refresh tokens for user
    const tokens = await this.refreshTokenModel
      .find({
        userId: new Types.ObjectId(userId),
        revoked: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    let validTokenDoc: RefreshTokenDocument | null = null;
    for (const tokenDoc of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, tokenDoc.token);
      if (isMatch) {
        validTokenDoc = tokenDoc;
        break;
      }
    }

    if (!validTokenDoc) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Generate new tokens
    const newTokens = await this.generateTokens(user);
    const hashedNewRefreshToken = await bcrypt.hash(newTokens.refreshToken, 10);

    // Update old token to be revoked, create new one
    validTokenDoc.revoked = true;
    await validTokenDoc.save();

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.refreshTokenModel.create({
      userId: user._id,
      token: hashedNewRefreshToken,
      expiresAt: newExpiresAt,
      revoked: false,
    });

    return newTokens;
  }

  /**
   * Logout: revoke all refresh tokens for user
   */
  async logout(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany({ userId: new Types.ObjectId(userId) }, { revoked: true })
      .exec();
    this.logger.log(`User ${userId} logged out`);
  }

  /**
   * Generate JWT access + refresh tokens
   */
  private async generateTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: (user._id as object).toString(),
      email: user.email,
      roles: [user.role], // payload still uses roles array for guards compatibility
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.accessExpiration',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiration',
          '7d',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Forgot Password: Generate token and send email
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return;
    }

    // Generate 32-byte hex token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Token expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save hashed token and expiry to user
    await this.usersService.update(user._id.toString(), {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
    });

    this.logger.log(`Password reset token generated for ${email}. Plain token: ${resetToken}`);
    // TODO: Send email with resetToken (plain text) to user
    // Email body should contain: http://frontend.com/reset-password?token=${resetToken}
  }

  /**
   * Reset Password: Validate token and update password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const saltRounds = this.configService.get<number>('bcrypt.rounds', 12);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Find user with valid reset token
    const users = await this.usersService.findAll();
    let validUser: UserDocument | null = null;

    for (const user of users) {
      if (user.passwordResetToken && user.passwordResetExpiresAt) {
        const isMatch = await bcrypt.compare(token, user.passwordResetToken);
        if (isMatch && new Date() < user.passwordResetExpiresAt) {
          validUser = user;
          break;
        }
      }
    }

    if (!validUser) {
      throw new UnauthorizedException('Lien de réinitialisation invalide ou expiré');
    }

    // Update password and clear reset token
    await this.usersService.update(validUser._id.toString(), {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });

    this.logger.log(`Password reset for user ${validUser.email}`);
  }

  /**
   * Generate 2FA Secret and return QR code
   */
  async generateTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const secret = generateSecret();
    
    // Save secret to user document
    await this.usersService.update(userId, {
      twoFactorSecret: secret,
    });

    const keyuri = generateURI({
      issuer: 'CODE DESK',
      label: user.email,
      secret,
    });

    const qrCode = await QRCode.toDataURL(keyuri);

    this.logger.log(`2FA secret generated for ${user.email}`);
    return { secret, qrCode };
  }

  /**
   * Validate 2FA code and enable 2FA
   */
  async turnOnTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('2FA secret not generated yet');
    }

    // Validate TOTP code
    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new UnauthorizedException('Code 2FA invalide');
    }

    // Enable 2FA
    await this.usersService.update(userId, {
      twoFactorEnabled: true,
    });

    this.logger.log(`2FA enabled for user ${user.email}`);
  }
}
