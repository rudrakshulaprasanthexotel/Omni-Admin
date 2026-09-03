import { AxiosError } from 'axios';

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

export function getApiErrorData<D>(error: unknown): D | undefined {
  return error instanceof AxiosError ? (error.response?.data as D | undefined) : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const body = getApiErrorData<{ message?: unknown }>(error);
  if (typeof body?.message === 'string' && body.message.trim() !== '') {
    return body.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
