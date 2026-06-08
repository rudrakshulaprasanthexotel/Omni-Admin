import { AxiosError } from 'axios';

interface NormalisedRequestInfo {
  url: string | undefined;
  method: string | undefined;
  headers: Record<string, string> | undefined;
  params: unknown;
  data: unknown;
}

interface NormalisedResponseInfo {
  status: number | undefined;
  statusText: string | undefined;
  headers: Record<string, string> | undefined;
  data: unknown;
}

export interface NormalisedAxiosError {
  message: string;
  code?: string | undefined;
  request?: NormalisedRequestInfo;
  response?: NormalisedResponseInfo;
}

export function normaliseAxiosError(error: AxiosError): NormalisedAxiosError {
  return {
    message: error.message,
    code: error.code,
    request: {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers as Record<string, string> | undefined,
      params: error.config?.params,
      data: error.config?.data,
    },
    response: {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers as Record<string, string> | undefined,
      data: error.response?.data,
    },
  };
}
