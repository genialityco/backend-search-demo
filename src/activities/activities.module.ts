/* eslint-disable prettier/prettier */
import { HttpModule } from '@nestjs/axios'; // Importa HttpModule
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity, ActivitySchema } from './activity.schema';
import { TranscriptModule } from '../transcripts/transcript.module';

@Module({
  imports: [
    HttpModule, // Importa HttpModule para usar HttpService
    TranscriptModule,
    MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]),
  ],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}