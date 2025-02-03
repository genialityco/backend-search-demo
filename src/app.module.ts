/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesModule } from './activities/activities.module';
import { TranscriptModule } from './transcripts/transcript.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://geniality:FnejsUlpLRXGzRnp@clustergen.r1t60mu.mongodb.net/geniality?retryWrites=true&w=majority',
    ),
    ActivitiesModule,
    TranscriptModule
  ]
})
export class AppModule {}
