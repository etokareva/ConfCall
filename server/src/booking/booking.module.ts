import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { VideoModule } from '../video/video.module';
import { EmailService } from '../auth/email.service';

@Module({
  imports: [VideoModule],
  controllers: [BookingController],
  providers: [BookingService, EmailService],
})
export class BookingModule {}
