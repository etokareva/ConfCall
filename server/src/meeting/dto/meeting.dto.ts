import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsArray()
  @IsString({ each: true })
  participantEmails: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantNames?: string[];

  @IsOptional()
  @IsString()
  videoPlatform?: string;
}
