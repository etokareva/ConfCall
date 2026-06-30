import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginWithPasswordDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ResendVerificationEmailDto,
  RegisterDto,
  RegisterWithInviteDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import { AuthenticatedUser } from './auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-login')
  @Public()
  devLogin() {
    return this.authService.devLogin();
  }

  @Post('register-with-invite')
  @Public()
  registerWithInvite(@Body() dto: RegisterWithInviteDto) {
    return this.authService.registerWithInvite(dto);
  }

  @Post('register')
  @Public()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('resend-verification')
  @Public()
  resendVerification(@Body() dto: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(dto);
  }

  @Post('login')
  @Public()
  login(@Body() dto: LoginWithPasswordDto) {
    return this.authService.loginWithPassword(dto);
  }

  @Post('password-reset/request')
  @Public()
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @Public()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @Public()
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateMe(user.id, dto);
  }
}
