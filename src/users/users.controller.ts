import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserDocument } from './schemas/user.schema';
import { RoleEnum } from './enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN_FEDERAL)
  findAll(): Promise<UserDocument[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN_FEDERAL, RoleEnum.DIRECTEUR)
  findOne(@Param('id') id: string): Promise<UserDocument | null> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
