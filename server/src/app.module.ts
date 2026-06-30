import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DbModule } from './db/db.module';
import { UserModule } from './user/user.module';
import { AvailabilityModule } from './availability/availability.module';
import { MeetingModule } from './meeting/meeting.module';
import { BookingModule } from './booking/booking.module';
import { VideoModule } from './video/video.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DbModule,
    UserModule,
    AvailabilityModule,
    MeetingModule,
    BookingModule,
    VideoModule,
    AuthModule,
    GroupModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
