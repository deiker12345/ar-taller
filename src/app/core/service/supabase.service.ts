import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Foto } from 'src/app/core/interfaces/foto';

export interface ArConfig {
  mode: 'marker' | 'image' | 'location';
  src: string;
  markerPreset?: 'hiro' | 'kanji' | 'custom';
  patternUrl?: string;
  width?: number;
  height?: number;
  type?: 'image' | 'model' | 'video';
}

export interface ArTarget extends ArConfig {
  id: string;
  title?: string;
}

export interface PublicImageItem {
  name: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  private sanitizeFilename(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '');
  }

  private dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string; ext: string } {
    const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
    if (!match) throw new Error('Formato de dataURL inválido');
    const mime = match[1];
    const b64 = match[2];
    const bin = atob(b64);
    const len = bin.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) buffer[i] = bin.charCodeAt(i);
    const blob = new Blob([buffer], { type: mime });
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'bin';
    return { blob, mime, ext };
  }

  async uploadArImage(foto: Foto): Promise<{ src: string; path: string; contentType: string }> {
    const bucket = 'ar-taller';
    const folder = 'public';
    const { blob, mime } = this.dataUrlToBlob(foto.dataUrl);
    if (mime !== 'image/jpeg') {
      throw new Error('Solo se aceptan imágenes .jpg');
    }
    const baseName = this.sanitizeFilename(foto.filenameBase || `img-${Date.now()}`);
    const filename = baseName.endsWith('.jpg') ? baseName : `${baseName}.jpg`;
    const path = `${folder}/${filename}`;

    const { error: upErr } = await this.client.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        cacheControl: foto.cacheControl ?? '3600',
        upsert: foto.upsert ?? true
      });

    if (upErr) {
      console.error('Upload error', upErr);
      throw upErr;
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    return { src: publicUrl, path: path, contentType: 'image/jpeg' };
  }

  async headPublicUrl(url: string): Promise<{ ok: boolean; status: number; contentType?: string }> {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || undefined };
    } catch (e) {
      return { ok: false, status: 0, contentType: undefined };
    }
  }

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

    const inferType = (src: string): 'image' | 'model' | 'video' => {
      const lower = (src || '').toLowerCase();
      if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'model';
      if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video';
      return 'image';
    };

    const cfg: ArConfig = {
      mode: (data.mode as 'marker' | 'image' | 'location') ?? 'marker',
      src: data.src,
      markerPreset: data.markerPreset ?? 'hiro',
      patternUrl: data.patternUrl ?? undefined,
      width: data.width ?? 3,
      height: data.height ?? 4,
      type: (data.type as 'image' | 'model' | 'video') ?? inferType(data.src)
    };

    return cfg;
  }

  async listArTargets(): Promise<ArTarget[]> {
    const { data, error } = await this.client
      .from('ar_targets')
      .select('*')
      .order('id', { ascending: true });

    const inferType = (src: string): 'image' | 'model' | 'video' => {
      const lower = (src || '').toLowerCase();
      if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'model';
      if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video';
      return 'image';
    };

    const hasRows = !error && Array.isArray(data) && data.length > 0;

    if (hasRows) {
      return (data as any[]).map((row: any) => ({
        id: row.id,
        title: row.title ?? row.id,
        mode: (row.mode as 'marker' | 'image' | 'location') ?? 'marker',
        src: row.src,
        markerPreset: row.markerPreset ?? 'hiro',
        patternUrl: row.patternUrl ?? undefined,
        width: row.width ?? 3,
        height: row.height ?? 4,
        type: (row.type as 'image' | 'model' | 'video') ?? inferType(row.src)
      }));
    }

    return [];
  }

  async listPublicImages(): Promise<PublicImageItem[]> {
    const bucket = 'ar-taller';
    const folderPrefix = 'public/';
    const { data, error } = await this.client
      .from('storage.objects')
      .select('name')
      .eq('bucket_id', bucket)
      .ilike('name', `${folderPrefix}%`)
      .ilike('name', '%.jpg');

    if (error || !data || data.length === 0) return [];

    const items = (data as { name: string }[]) 
      .map(d => {
        const { data: pub } = this.client.storage.from(bucket).getPublicUrl(d.name);
        const url = pub.publicUrl;
        return { name: d.name, url } as PublicImageItem;
      })
      .filter(x => !!x.url);

    const checked = await Promise.all(items.map(async (x) => {
      const head = await this.headPublicUrl(x.url);
      return head.ok && head.status === 200 ? x : null;
    }));

    return checked.filter(Boolean) as PublicImageItem[];
  }
}