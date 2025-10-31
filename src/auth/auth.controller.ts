import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('firebase-login')
  @HttpCode(HttpStatus.OK) 
  async loginComFirebase(@Body() firebaseLoginDto: FirebaseLoginDto) {
    return this.authService.loginComFirebaseToken(
      firebaseLoginDto.firebaseToken,
    );
  }

  @Post('register-admin')
  async registerAdmin(@Body() FirebaseLoginDto: FirebaseLoginDto) {
    return this.authService.registerAdminWithFirebaseToken(
      FirebaseLoginDto.firebaseToken
    )
  }
}