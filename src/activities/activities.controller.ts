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
  async generateTranscription(
    @Param('id') activityId: string,
    @Query('engine') engine: string = 'whisper-turbo',
  ) {
    const activity = await this.activitiesService.findById(activityId);
  
    if (!activity || !activity.video) {
      console.log('[ERROR] Actividad no encontrada o no tiene video');
      return { error: 'No se encontró la actividad o no tiene un video' };
    }
  
    try {
      console.log(`[INFO] Enviando solicitud de transcripción para: ${activity.video}`);
      console.log(`[INFO] Usando motor de transcripción: ${engine}`);
  
      const response = await this.httpService
        .post('http://localhost:5001/transcribe', {
          vimeo_url: activity.video,
          engine, // "whisper-normal" o "whisper-turbo"
          model_name: 'medium',
          language: 'es',
        })
        .toPromise();
  
      console.log('[DEBUG] Respuesta del microservicio:', response.data);
  
      if (!response.data || !response.data.transcription) {
        console.log('[ERROR] No se recibió transcripción válida');
        return { error: 'Error en la transcripción' };
      }
  
      let formattedSegments = [];
  
      if (engine === 'whisper-normal' && response.data.transcription.segments) {
        // ✅ Whisper Normal devuelve "segments"
        formattedSegments = response.data.transcription.segments.map((segment: any) => ({
          start_time: segment.start,
          end_time: segment.end,
          text: segment.text,
        }));
      } else if (engine === 'whisper-turbo' && response.data.transcription.chunks) {
        // ✅ Whisper Turbo devuelve "chunks"
        formattedSegments = response.data.transcription.chunks.map((chunk: any) => ({
          start_time: chunk.timestamp[0], // Turbo usa timestamp como [inicio, fin]
          end_time: chunk.timestamp[1],
          text: chunk.text,
        }));
      }
  
      console.log('[DEBUG] Segmentos formateados:', formattedSegments);
  
      // Guardar la transcripción en la BD
      const transcript = await this.activitiesService.saveTranscript({
        activity_id: activityId,
        activity_name: activity.name,
        hosts_ids: activity.host_ids,
        text: response.data.transcription.text,
        segments: formattedSegments,
      });
  
      console.log('[INFO] Transcripción guardada en la BD:', transcript);
  
      // Vincular transcripción con la actividad
      const transcriptId = String(transcript._id);
      await this.activitiesService.updateActivityWithTranscript(activityId, transcriptId);
  
      return {
        message: 'Transcripción generada con éxito',
        engine_used: engine,
        transcript,
      };
    } catch (error) {
      console.error('[ERROR] Fallo al generar la transcripción:', error);
      return { error: 'Fallo al generar la transcripción' };
    }
  }
  
  
}
