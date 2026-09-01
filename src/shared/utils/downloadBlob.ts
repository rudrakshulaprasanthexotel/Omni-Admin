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
