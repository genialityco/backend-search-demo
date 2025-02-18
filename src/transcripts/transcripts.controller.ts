/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { TranscriptService } from './transcript.service';

@Controller('transcripts')
export class TranscriptsController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Get('search')
  async searchTranscripts(@Query('query') query: string) {
    return this.transcriptService.searchTranscripts(query);
  }

  @Get(':activityId')
  async getTranscript(@Param('activityId') activityId: string, @Query('query') query?: string) {
    return this.transcriptService.getTranscript(activityId, query);
  }
}
