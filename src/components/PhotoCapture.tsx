import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Unit } from '../types';
import { Button, useToast } from './ui';

const MAX_SIDE = 1600;

async function compress(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob || file;
  } catch {
    return file;
  }
}

export function PhotoCapture({ unit, onChanged }: { unit: Unit; onChanged: () => Promise<void> }) {
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadUnitPhoto(unit.id, await compress(file));
      await onChanged();
      toast('Photo saved.');
    } catch (e: any) {
      toast(e?.message || 'Could not save the photo', 'error');
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove this photo?')) return;
    setBusy(true);
    try {
      await api.deleteUnitPhoto(unit.id);
      await onChanged();
      toast('Photo removed.');
    } catch (e: any) {
      toast(e?.message || 'Could not remove the photo', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <Button busy={busy} onClick={() => cameraRef.current?.click()}>
        <Camera size={16} />
        {unit.photo_url ? 'Retake photo' : 'Take photo'}
      </Button>
      <Button variant="quiet" disabled={busy} onClick={() => galleryRef.current?.click()}>
        <ImageIcon size={16} />
        From gallery
      </Button>
      {unit.photo_url && (
        <Button variant="ghost" disabled={busy} aria-label="Remove photo" onClick={remove}>
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}
