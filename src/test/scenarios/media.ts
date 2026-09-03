import type { Scenario } from './types';

/**
 * Voice recording and chat transcript blobs. The API-states doc puts these out
 * of scope — they fetch opaque server-supplied URLs — but the preview panel
 * has real loading, failure and retry UI for both, so the states it can render
 * are covered here.
 */
export const voiceLogScenarios: Scenario[] = [
  {
    id: 'VL-200',
    api: 'voiceLogBlob',
    state: 200,
    title: 'Recording downloads as a blob',
    isDefault: true,
    response: { status: 200, text: 'fake-mp3-bytes', contentType: 'audio/mpeg' },
  },
  {
    id: 'VL-404',
    api: 'voiceLogBlob',
    state: 404,
    title: 'Recording missing — panel shows the load error plus Retry',
    response: { status: 404, text: 'Not Found', contentType: 'text/plain' },
  },
  {
    id: 'VL-500',
    api: 'voiceLogBlob',
    state: 500,
    title: 'Recording fetch fails server-side',
    response: { status: 500, text: 'Internal Server Error', contentType: 'text/plain' },
  },
];

export const chatTranscriptScenarios: Scenario[] = [
  {
    id: 'CT-200',
    api: 'chatTranscriptBlob',
    state: 200,
    title: 'Transcript downloads as a blob',
    isDefault: true,
    response: {
      status: 200,
      text: JSON.stringify([
        { sender: 'customer', message: 'Hi, I need help', timestamp: 1681715000570 },
        { sender: 'agent', message: 'Happy to help', timestamp: 1681715010570 },
      ]),
      contentType: 'application/json',
    },
  },
  {
    id: 'CT-404',
    api: 'chatTranscriptBlob',
    state: 404,
    title: 'Transcript missing — panel shows the transcript load error',
    response: { status: 404, text: 'Not Found', contentType: 'text/plain' },
  },
];
