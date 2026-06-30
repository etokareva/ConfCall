import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VideoMeeting {
  id: string;
  joinUrl: string;
}

interface TelemostConferenceResponse {
  id: string;
  join_url: string;
}

@Injectable()
export class VideoService {
  constructor(private readonly config: ConfigService) {}

  async createMeeting(
    _title: string,
    _startTime: Date,
    _endTime: Date,
  ): Promise<VideoMeeting> {
    return this.createTelemostMeeting();
  }

  private async createTelemostMeeting(): Promise<VideoMeeting> {
    const token = this.config.get<string>('TELEMOST_OAUTH_TOKEN');
    if (!token) {
      throw new ServiceUnavailableException({
        messageKey: 'video.telemost.not_configured',
      });
    }

    const response = await fetch(
      'https://cloud-api.yandex.net/v1/telemost-api/conferences',
      {
        method: 'POST',
        headers: {
          Authorization: `OAuth ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waiting_room_level: 'PUBLIC',
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw this.toTelemostError(response.status, details);
    }

    const conference = (await response.json()) as TelemostConferenceResponse;
    return {
      id: conference.id,
      joinUrl: conference.join_url,
    };
  }

  private toTelemostError(status: number, details: string) {
    if (status === 401) {
      return new ServiceUnavailableException({
        messageKey: 'video.telemost.invalid_token',
      });
    }

    if (status === 403) {
      return new ServiceUnavailableException({
        messageKey: 'video.telemost.forbidden',
      });
    }

    if (status === 400) {
      return new BadRequestException({
        messageKey: 'video.telemost.invalid_request',
      });
    }

    return new ServiceUnavailableException({
      messageKey: 'video.telemost.unavailable',
      messageParams: details ? { details } : undefined,
    });
  }
}
