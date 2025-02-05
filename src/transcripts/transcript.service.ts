/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transcript } from './transcript.schema';

@Injectable()
export class TranscriptService {
  constructor(@InjectModel(Transcript.name) private transcriptModel: Model<Transcript>) {}

  async searchTranscripts(query: string) {
    return this.transcriptModel.find({ $text: { $search: query } }).limit(10);
  }

  async getTranscript(activityId: string, query?: string) {
    const transcript = await this.transcriptModel.findOne({ activity_id: activityId });

    if (!transcript) {
      return { error: 'No se encontró la transcripción' };
    }

    let matchingSegments = [];

    if (query) {
      const regex = new RegExp(query, 'i');
      matchingSegments = transcript.segments.filter(segment => regex.test(segment.text));
    }

    return {
      activity_id: transcript.activity_id,
      activity_name: transcript.activity_name,
      text: transcript.text,
      segments: transcript.segments,
      matching_segments: matchingSegments,
    };
  }
}
