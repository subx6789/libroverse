import api from './api';

export type ExplainMode = 'explain' | 'simplify' | 'summary' | 'key_terms';

export interface ExplainResponse {
  success: boolean;
  model: string;
  mode: ExplainMode;
  explanation: string;
  isLiveModel: boolean;
  notice?: string;
}

export interface ExplainRequestPayload {
  passage: string;
  bookTitle?: string;
  author?: string;
  mode?: ExplainMode;
}

export const explainPassageAPI = async (
  payload: ExplainRequestPayload
): Promise<ExplainResponse> => {
  const response = await api.post<ExplainResponse>('/ai/explain', payload);
  return response.data;
};
