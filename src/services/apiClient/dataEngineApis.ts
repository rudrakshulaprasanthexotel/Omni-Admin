import { Configuration as DataEngineConfiguration } from '@/boilerplate/dataEngineApis/configuration';
import { apiClient } from '.';

export const dataEngineConfiguration = new DataEngineConfiguration({
  basePath: import.meta.env.VITE_DATA_ENGINE_API_BASE_PATH
});

export const dataEngineApis = {
  // TODO: Add data engine APIs here
};
