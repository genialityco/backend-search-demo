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
}
