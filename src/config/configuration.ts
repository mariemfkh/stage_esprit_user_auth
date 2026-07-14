import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  validateSync,
} from 'class-validator';

// ─── Environment Variables Schema ─────────────────────────────────────────────

/**
 * Typed class for validating environment variables at startup.
 * Any missing or invalid variable will throw an error before the app boots.
 */
export class EnvironmentVariables {
  // ── Server ─────────────────────────────────────────────────────────────────

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  @IsNotEmpty()
  NODE_ENV: string = 'development';

  // ── MongoDB ─────────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  MONGODB_URI!: string;

  // ── JWT ─────────────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION: string = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION: string = '7d';

  // ── Bcrypt ──────────────────────────────────────────────────────────────────

  @IsNumber()
  @Min(10)
  @Max(20)
  BCRYPT_ROUNDS: number = 12;

  // ── Rate limiting ───────────────────────────────────────────────────────────

  @IsNumber()
  @Min(1)
  RATE_LIMIT_TTL: number = 900;

  @IsNumber()
  @Min(1)
  RATE_LIMIT_MAX: number = 10;

  // ── Login brute-force protection ────────────────────────────────────────────

  @IsNumber()
  @Min(1)
  LOGIN_MAX_ATTEMPTS: number = 5;

  @IsNumber()
  @Min(1)
  LOGIN_LOCK_DURATION: number = 900;
}

// ─── Validation Function ──────────────────────────────────────────────────────

/**
 * Used by ConfigModule to validate environment variables at startup.
 * Throws descriptive errors for missing/invalid variables before the app boots.
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`❌ Configuration invalide :\n${messages}`);
  }

  return validatedConfig;
}

// ─── Configuration Factory ────────────────────────────────────────────────────

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwt: {
    accessSecret: string;
    accessExpiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  };
  bcrypt: {
    rounds: number;
  };
  rateLimit: {
    ttl: number;
    max: number;
  };
  loginMaxAttempts: number;
  loginLockDuration: number;
}

export default (): AppConfig => ({
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  mongoUri:
    process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/ms-auth-dev',

  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET'] ?? '',
    accessExpiration: process.env['JWT_ACCESS_EXPIRATION'] ?? '15m',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] ?? '',
    refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] ?? '7d',
  },

  bcrypt: {
    rounds: parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10),
  },

  rateLimit: {
    ttl: parseInt(process.env['RATE_LIMIT_TTL'] ?? '900', 10),
    max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '10', 10),
  },

  loginMaxAttempts: parseInt(process.env['LOGIN_MAX_ATTEMPTS'] ?? '5', 10),
  loginLockDuration: parseInt(process.env['LOGIN_LOCK_DURATION'] ?? '900', 10),
});
