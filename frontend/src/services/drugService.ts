import api from './api';
import { DrugInfo, AnalysisResult, UploadResponse } from '../types';

export const uploadImages = async (files: File[]): Promise<UploadResponse[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
  const response = await api.post<UploadResponse[]>('/api/drugs/upload', formData);
  return response.data;
};

export const analyzeImage = async (imageId: string): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>(`/api/drugs/${imageId}/analyze`);
  return response.data;
};

export const getDrugs = async (): Promise<DrugInfo[]> => {
  const response = await api.get<DrugInfo[]>('/api/drugs');
  return response.data;
};

export const deleteDrug = async (drugId: string): Promise<void> => {
  await api.delete(`/api/drugs/${drugId}`);
};

export const getExpiringDrugs = async (): Promise<DrugInfo[]> => {
  const response = await api.get<DrugInfo[]>('/api/drugs/expiring');
  return response.data;
};

export const updateDrug = async (drugId: string, data: Partial<DrugInfo>): Promise<DrugInfo> => {
  const response = await api.put<DrugInfo>(`/api/drugs/${drugId}`, data);
  return response.data;
};

export const searchDrugs = async (query: string): Promise<DrugInfo[]> => {
  const response = await api.get<DrugInfo[]>(`/api/drugs/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const analyzeBatchImages = async (imageIds: string[]): Promise<any> => {
  const response = await api.post('/api/drugs/analyze-batch', imageIds);
  return response.data;
};

