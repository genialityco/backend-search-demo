/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './activity.schema';
import { Transcript } from 'src/transcripts/transcript.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Transcript.name) private transcriptModel: Model<Transcript>,
  ) {}

  async create(activityData: Partial<Activity>): Promise<Activity> {
    const activity = new this.activityModel(activityData);
    return activity.save();
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: Activity[]; total: number }> {
    const data = await this.activityModel
      .find()
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await this.activityModel.countDocuments();
    return { data, total };
  }

  // Con Index
  async search(query: string, page: number, limit: number) {
    // 1. Buscar transcripts que coincidan con el texto (campo 'text')
    //    Ordenamos por relevancia (score) si queremos
    const transcripts = await this.transcriptModel
    .find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } } // Score de relevancia
    )
    .select('activity_id text segments') // ✅ Ahora devuelve también "text"
    .sort({ score: { $meta: 'textScore' } }) // Ordenar por relevancia
    .lean();
  

    // 2. Si no hay transcripts, devolvemos sin resultados
    if (!transcripts.length) {
      return { data: [], total: 0 };
    }

    // 3. Conseguir los IDs de las actividades relacionadas
    const activityIds = transcripts.map((t) => t.activity_id);

    // 4. Buscar las actividades que tengan estos IDs (paginamos)
    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 5. Para cada actividad, filtrar los segments que contengan el texto
    const activitiesWithSegments = activities.map((activity) => {
      const relatedTranscript = transcripts.find(
        (t) => String(t.activity_id) === String(activity._id),
      );
    
      const queryWords = query.toLowerCase().split(/\s+/); 

      const matchingSegments =
        relatedTranscript?.segments?.filter(segment => {
          const segmentText = segment.text.toLowerCase();
          return queryWords.some(word => segmentText.includes(word));
        }) || [];
      
      return {
        ...activity,
        matching_segments: matchingSegments, 
        text: relatedTranscript?.text || "",
      };
    });
    
    const total = await this.activityModel.countDocuments({
      _id: { $in: activityIds },
    });

    return { data: activitiesWithSegments, total };
  }

  // Con $regex
  // async search(query: string, page: number, limit: number) {
  //   // 1️⃣ Buscar `transcripts` donde `text` contenga las palabras clave
  //   const words = query.split(/\s+/).map(word => `(?=.*${word})`).join("");
  //   const regex = new RegExp(words, "i"); // Ejemplo: (?=.*riesgo)(?=.*residual) busca ambas palabras en cualquier orden
  
  //   const transcripts = await this.transcriptModel
  //     .find({ text: { $regex: regex } }) // Buscar en todo el texto concatenado
  //     .select('activity_id segments')
  //     .lean();
  
  //   if (!transcripts.length) {
  //     return { data: [], total: 0 }; // Si no hay coincidencias, devolver vacío
  //   }
  
  //   // 2️⃣ Extraer IDs de actividades
  //   const activityIds = transcripts.map(t => t.activity_id);
  
  //   // 3️⃣ Buscar actividades relacionadas
  //   const activities = await this.activityModel
  //     .find({ _id: { $in: activityIds } })
  //     .skip((page - 1) * limit)
  //     .limit(limit)
  //     .lean();
  
  //   // 4️⃣ Filtrar `segments` que contienen la palabra clave
  //   const activitiesWithSegments = activities.map(activity => {
  //     const relatedTranscript = transcripts.find(t => String(t.activity_id) === String(activity._id));
  
  //     // 🔍 Filtrar segmentos específicos con coincidencias
  //     const matchingSegments = relatedTranscript?.segments?.filter(segment =>
  //       words.split(/\)\(\?/).some(w => new RegExp(w.replace(/[\(\)\.\*\?\=]/g, ""), "i").test(segment.text))
  //     ) || [];
  
  //     return {
  //       ...activity,
  //       matching_segments: matchingSegments,
  //     };
  //   });
  
  //   // 5️⃣ Contar total de actividades
  //   const total = await this.activityModel.countDocuments({ _id: { $in: activityIds } });
  
  //   return { data: activitiesWithSegments, total };
  // }

  async saveTranscript(data: {
    activity_id: string;
    activity_name: string;
    hosts_ids: string[];
    text: string;
    segments: { start_time: number; end_time: number; text: string }[];
  }) {
    const transcript = new this.transcriptModel({
      activity_id: data.activity_id,
      activity_name: data.activity_name, // ✅ Guardamos el nombre de la actividad
      hosts_ids: data.hosts_ids, // ✅ Guardamos los hosts
      text: data.text,
      segments: data.segments, // ✅ Guardamos los segmentos con tiempos
    });

    return transcript.save();
  }

  async updateActivityWithTranscript(
    activity_id: string,
    transcription_id: string,
  ) {
    return this.activityModel.findByIdAndUpdate(
      activity_id,
      { transcription_id },
      { new: true },
    );
  }

  async findById(activity_id: string) {
    return this.activityModel.findById(activity_id);
  }
}
