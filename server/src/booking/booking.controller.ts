import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingLinkDto,
  BookSlotDto,
  SendBookingLinkDto,
} from './dto/booking.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { Public } from '../auth/public.decorator';

@Controller('booking')
export class BookingController {
  constructor(private readonly svc: BookingService) {}

  @Post('links')
  createLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingLinkDto,
  ) {
    return this.svc.createLink(user.id, dto);
  }

  @Get('links')
  getMyLinks(@CurrentUser() user: AuthenticatedUser) {
    return this.svc.getMyLinks(user.id);
  }

  @Post('links/:id/delete')
  deleteLink(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.svc.deleteLink(user.id, +id);
  }

  @Post('links/:id/toggle')
  toggleLink(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.svc.toggleLink(user.id, +id);
  }

  @Post('links/:id/send')
  sendLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendBookingLinkDto,
  ) {
    return this.svc.sendLink(user.id, +id, dto);
  }

  @Get('public/:slug')
  @Public()
  getBySlug(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }

  @Get('public/:slug/intersection')
  @Public()
  getPublicIntersection(
    @Param('slug') slug: string,
    @Query('date') date: string,
    @Query('durationMinutes') durationMinutes?: string,
  ) {
    return this.svc.getPublicIntersection(
      slug,
      date,
      durationMinutes ? Number(durationMinutes) : undefined,
    );
  }

  @Post('book')
  @Public()
  bookSlot(@Body() dto: BookSlotDto) {
    return this.svc.bookSlot(dto);
  }

  @Get('cancel/:token')
  @Public()
  cancelByGuestToken(@Param('token') token: string) {
    return this.svc.cancelByGuestToken(token);
  }
}
