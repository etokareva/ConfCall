import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/meeting.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth-user.interface';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly svc: MeetingService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.svc.create(user.id, dto);
  }

  @Get('my')
  async getMyMeetings(@CurrentUser() user: AuthenticatedUser) {
    return this.svc.getMyMeetings(user.id);
  }

  @Post('mark-seen')
  async markSeen(@CurrentUser() user: AuthenticatedUser) {
    return this.svc.markSeen(user.id);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.cancel(user.id, +id);
  }

  @Post(':id/decline')
  async decline(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.decline(user.id, +id);
  }
}
