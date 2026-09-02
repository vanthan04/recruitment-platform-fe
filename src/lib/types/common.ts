export interface ApiEnvelope<T, M = undefined> {
  success: boolean;
  message: string;
  code: string;
  data: T;
  metadata?: M;
  timestamp: string;
}

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
}
