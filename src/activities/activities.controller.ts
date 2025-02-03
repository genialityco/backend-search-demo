/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ActivitiesService } from './activities.service';
import { Activity } from './activity.schema';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly httpService: HttpService,
  ) {}

  @Post()
  async create(@Body() activityData: Partial<Activity>): Promise<Activity> {
    return this.activitiesService.create(activityData);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: Activity[]; total: number }> {
    return this.activitiesService.findAll(page, limit);
  }

  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: Activity[]; total: number }> {
    return this.activitiesService.search(query, page, limit);
  }

  @Post(':id/generate-transcription')
  async generateTranscription(@Param('id') activityId: string) {
    const activity = await this.activitiesService.findById(activityId);
  
    if (!activity || !activity.video) {
      return { error: 'No se encontró la actividad o no tiene un video' };
    }
  
    try {
      // Enviar solicitud al microservicio Whisper
      const response = await this.httpService
        .post('http://localhost:5001/transcribe', {
          vimeo_url: activity.video,
          model_name: 'base',
          language: 'es',
        })
        .toPromise();
  
      if (!response.data || !response.data.transcription) {
        return { error: 'Error en la transcripción' };
      }
  
      // ✅ Extraer los segmentos con `start` y `end`
      const formattedSegments = response.data.transcription.segments.map((segment: any) => ({
        start_time: segment.start,
        end_time: segment.end,
        text: segment.text,
      }));
  
      // ✅ Guardar transcripción en la colección transcripts con más información
      const transcript = await this.activitiesService.saveTranscript({
        activity_id: activityId,
        activity_name: activity.name,  // ✅ Agregamos el nombre de la actividad
        hosts_ids: activity.host_ids,  // ✅ Guardamos los hosts de la actividad
        text: response.data.transcription.text, 
        segments: formattedSegments,  // ✅ Guardamos los segmentos con `start_time` y `end_time`
      });
  
      // ✅ Corregir error de tipo en _id
      const transcriptId = String(transcript._id);
  
      // ✅ Vincular transcript con la actividad
      await this.activitiesService.updateActivityWithTranscript(activityId, transcriptId);
  
      return { message: 'Transcripción generada con éxito', transcript };
    } catch (error) {
      console.error('Error en la transcripción:', error);
      return { error: 'Fallo al generar la transcripción' };
    }
  }
  
}
