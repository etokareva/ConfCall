import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { EmailService } from '../auth/email.service';

@Module({
  controllers: [GroupController],
  providers: [GroupService, EmailService],
})
export class GroupModule {}
