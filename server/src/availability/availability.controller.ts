import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import {
  SetAvailabilityDto,
  SetCalendarEventsDto,
  GetIntersectionQueryDto,
} from './dto/availability.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth-user.interface';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly svc: AvailabilityService) {}

  @Get('slots')
  getSlots(@CurrentUser() user: AuthenticatedUser) {
    return this.svc.getMySlots(user.id);
  }

  @Post('slots')
  setSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.svc.setSlots(user.id, dto);
  }

  @Get('events')
  getEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.svc.getMyEvents(user.id);
  }

  @Post('events')
  setEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetCalendarEventsDto,
  ) {
    return this.svc.setEvents(user.id, dto);
  }

  @Get('users')
  getAllUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('groupId') groupId?: string,
  ) {
    return this.svc.getAllUsers(user.id, groupId ? Number(groupId) : undefined);
  }

  @Get('intersection')
  getIntersection(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetIntersectionQueryDto,
  ) {
    return this.svc.getIntersection(query, user.id);
  }
}
