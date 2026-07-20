import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-from-email' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewP@ssw0rd' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
