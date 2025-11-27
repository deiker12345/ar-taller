export interface Foto {
  folder: 'public';
  dataUrl: string;
  filenameBase?: string;
  cacheControl?: string;
  upsert?: boolean;
}