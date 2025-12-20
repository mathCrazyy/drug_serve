export interface DrugInfo {
  id: string;
  name: string;
  production_date: string;
  expiry_date: string;
  image_url?: string;
  image_urls?: string | string[];  // JSON字符串或数组
  created_at: string;
  analysis_result?: any;
}

export interface AnalysisResult {
  name: string;
  production_date: string;
  expiry_date: string;
  confidence?: number;
}

export interface UploadResponse {
  image_id: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

