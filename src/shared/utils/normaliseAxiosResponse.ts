import { AxiosError, AxiosHeaders, type AxiosResponse, type RawAxiosHeaders } from 'axios';

interface NormalisedRequestInfo {
  url: string | undefined;
  method: string | undefined;
  headers: Record<string, string> | undefined;
  params: unknown;
  data: unknown;
}

interface NormalisedResponseInfo<D = any> {
  status: number | undefined;
  statusText: string | undefined;
  headers: Record<string, string> | undefined;
  data: D;
}

export interface NormalisedAxiosResponse<D = any> {
  isSuccess: boolean;
  message: string;
  code?: string;
  request?: NormalisedRequestInfo;
  response?: NormalisedResponseInfo<D>;
}

type NormaliseType = 'success' | 'error';

function toPlainHeaders(headers: unknown): Record<string, string> | undefined {
  if (!headers || typeof headers !== 'object') return undefined;
  return AxiosHeaders.from(headers as RawAxiosHeaders).toJSON(true) as Record<string, string>;
}

function normaliseSuccess<D = any>(response: AxiosResponse<D>): NormalisedAxiosResponse<D> {
  return {
    isSuccess: true,
    message: response.statusText || 'OK',
    code: String(response.status),
    request: {
      url: response.config?.url,
      method: response.config?.method,
      headers: toPlainHeaders(response.config?.headers),
      params: response.config?.params,
      data: response.config?.data,
    },
    response: {
      status: response.status,
      statusText: response.statusText,
      headers: toPlainHeaders(response.headers),
      data: response.data,
    },
  };
}

function normaliseError(error: AxiosError): NormalisedAxiosResponse {
  return {
    isSuccess: false,
    message: error.message,
    code: error.code,
    request: {
      url: error.config?.url,
      method: error.config?.method,
      headers: toPlainHeaders(error.config?.headers),
      params: error.config?.params,
      data: error.config?.data,
    },
    response: {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: toPlainHeaders(error.response?.headers),
      data: error.response?.data,
    },
  };
}

export function normaliseAxiosResponse<D = any>(
  data: AxiosResponse<D> | AxiosError,
  type: NormaliseType
): NormalisedAxiosResponse<D> {
  switch (type) {
  case 'success':
    return normaliseSuccess(data as AxiosResponse<D>);
  case 'error':
    return normaliseError(data as AxiosError) as NormalisedAxiosResponse<D>;
  }
}
