import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ArConfig {
  mode: 'marker' | 'image' | 'location';
  src: string; // asset url (image/video/model)
  markerPreset?: 'hiro' | 'kanji' | 'custom';
  patternUrl?: string;
  width?: number;
  height?: number;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  // Ejemplo: obtener configuración AR por targetId desde tabla 'ar_targets'
  async getArConfig(targetId: string): Promise<ArConfig | null> {
    const { data, error } = await this.client
      .from('ar_targets')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) {
      console.error('Supabase error', error);
      return null;
    }

    // Mapear respuesta a ArConfig
    const cfg: ArConfig = {
      mode: (data.mode as 'marker' | 'image' | 'location') ?? 'marker',
      src: data.src,
      markerPreset: data.markerPreset ?? 'hiro',
      patternUrl: data.patternUrl ?? undefined,
      width: data.width ?? 3,
      height: data.height ?? 4,
    };

    return cfg;
  }
}