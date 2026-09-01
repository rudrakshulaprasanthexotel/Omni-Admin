import type { RawAxiosRequestConfig } from 'axios';
import { apiClient } from '@/services/apiClient';

export async function downloadBlob(
  url: string,
  options?: RawAxiosRequestConfig,
): Promise<Blob> {
  const response = await apiClient.get<Blob>(url, {
    responseType: 'blob',
    headers: { Accept: 'application/octet-stream' },
    ...options,
  });
  const blob = response.data;
  if (!(blob instanceof Blob)) {
    throw new Error('invalid-blob');
  }
  return blob;
}

export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari drops the download if the object URL is revoked in the same task.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
