import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/entities/user/user.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UserModule]
})
export class AuthModule {}
