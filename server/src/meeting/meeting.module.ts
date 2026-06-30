import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { VideoModule } from '../video/video.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [VideoModule, AuthModule],
  controllers: [MeetingController],
  providers: [MeetingService],
})
export class MeetingModule {}
