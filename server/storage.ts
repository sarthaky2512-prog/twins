import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { UPLOADS_DIR } from './db.js';

export interface StoredMediaResult {
  url: string;
  storageProvider: 'supabase' | 'local_disk' | 'inline_fallback';
  sizeBytes: number;
  mimeType: string;
}

export async function persistUploadedMedia(
  dataUrl: string,
  filenameRaw: string
): Promise<StoredMediaResult> {
  const match = /^data:(image\/(jpeg|jpg|png|webp)|video\/mp4);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error('Supported uploads are JPG, JPEG, PNG, WEBP images or MP4 videos.');
  }

  const mimeType = match[1].toLowerCase();
  const ext = mimeType === 'video/mp4' ? 'mp4' : mimeType.split('/')[1].replace('jpeg', 'jpg');
  const safeStem = filenameRaw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) || 'media';
  const finalName = `${safeStem}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const buffer = Buffer.from(match[3], 'base64');

  // Option 1: Supabase Storage when configured via environment variables
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'studio-media';

  if (supabaseUrl && supabaseKey) {
    try {
      const objectPath = `uploads/${finalName}`;
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
            'Content-Type': mimeType,
            'x-upsert': 'true',
          },
          body: buffer,
        }
      );
      if (uploadRes.ok) {
        return {
          url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`,
          storageProvider: 'supabase',
          sizeBytes: buffer.length,
          mimeType,
        };
      }
      console.warn('Supabase upload returned status:', uploadRes.status);
    } catch (err) {
      console.warn('Supabase upload failed, falling back to local persistent storage:', err);
    }
  }

  // Option 2: Persistent local disk storage (/data/uploads served at /uploads)
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, finalName), buffer);
    return {
      url: `/uploads/${finalName}`,
      storageProvider: 'local_disk',
      sizeBytes: buffer.length,
      mimeType,
    };
  } catch {
    return {
      url: dataUrl,
      storageProvider: 'inline_fallback',
      sizeBytes: buffer.length,
      mimeType,
    };
  }
}
