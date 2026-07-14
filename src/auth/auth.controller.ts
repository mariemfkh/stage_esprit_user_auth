import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserDocument } from '../users/schemas/user.schema';

interface RequestWithUser extends Request {
  user: UserDocument | JwtPayload;
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/v1/auth/login
   */
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: RequestWithUser): Promise<AuthResponse> {
    return this.authService.login(req.user as UserDocument);
  }

  /**
   * POST /api/v1/auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    // Decode the refresh token to get userId
    // In production, use a dedicated refresh token strategy
    const { refreshToken } = refreshTokenDto;
    // Basic extraction — replace with proper strategy in production
    const payload = JSON.parse(
      Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
    ) as JwtPayload;
    return this.authService.refreshTokens(payload.sub, refreshToken);
  }

  /**
   * POST /api/v1/auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: RequestWithUser): Promise<{ message: string }> {
    const user = req.user as JwtPayload;
    await this.authService.logout(user.sub);
    return { message: 'Déconnexion réussie' };
  }

  /**
   * GET /api/v1/auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user as JwtPayload;
  }
}
