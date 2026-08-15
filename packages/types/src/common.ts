export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message?: string | string[];
  timestamp: string;
  path: string;
}
