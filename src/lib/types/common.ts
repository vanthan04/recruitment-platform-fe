/**
 * Shape mà backend trả về qua network cho **mọi** endpoint.
 * Xem: src/common/dtos/response.dto.ts (phía BE).
 *
 * @template T  - kiểu dữ liệu nằm trong `data`
 * @template M  - kiểu metadata (mặc định là `ListMeta` cho list endpoint,
 *                để `undefined` cho endpoint trả về object đơn)
 */
export interface ApiResponse<T = unknown, M = undefined> {
  success: boolean;
  message: string;
  /** Mã nội bộ, ví dụ "USER_NOT_FOUND". Optional vì 204 không có body. */
  code?: string;
  data: T;
  metadata?: M;
  /** ISO 8601 timestamp do BE gắn vào mọi response. */
  timestamp: string;
}

/**
 * Alias nội bộ cho `ApiResponse` — dùng trong `api/index.ts` để tách biệt
 * "internal envelope" với "wire type mà caller nhìn thấy".
 * Hai type này hoàn toàn tương đương; chỉ đặt tên khác để code dễ đọc.
 */
export type ApiEnvelope<T, M = undefined> = ApiResponse<T, M>;

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
}
