/* eslint-disable prettier/prettier */
// transcript.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'transcripts', timestamps: true })
export class Transcript extends Document {
  @Prop({ required: true })
  activity_id: string;

  @Prop({ required: true })
  activity_name: string; 

  @Prop({ type: [String], default: [] })
  hosts_ids: string[];

  @Prop({ required: true })
  text: string;  // Aquí guardas TODO el texto concatenado de segments si así lo deseas

  @Prop({
    type: [{ start_time: Number, end_time: Number, text: String }],
    default: [],
  })
  segments: { start_time: number; end_time: number; text: string }[];
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);

// Índice de segments sólo en 'text'
TranscriptSchema.index(
  {
    text: 'text',
    'segments.text': 'text',
  },
  {
    default_language: 'spanish',
  },
);

