import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [S3Module, AuthModule, LocationsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
