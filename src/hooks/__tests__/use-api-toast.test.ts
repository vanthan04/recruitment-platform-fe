import { renderHook, waitFor, act } from "@testing-library/react";
import { toast } from "sonner";
import { useApiToast } from "@/hooks/use-api-toast";
import { ApiError } from "@/lib/api/error";
import { logout } from "@/lib/services/auth.service";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/services/auth.service", () => ({
  logout: jest.fn(),
}));

const mockedLogout = logout as jest.Mock;
const mockedToastError = toast.error as jest.Mock;
const mockedToastSuccess = toast.success as jest.Mock;

describe("useApiToast", () => {
  beforeEach(() => {
    mockedLogout.mockReset();
    mockedToastError.mockReset();
    mockedToastSuccess.mockReset();
  });

  describe("run", () => {
    it("shows the success toast and calls onSuccess when the action resolves", async () => {
      const { result } = renderHook(() => useApiToast());
      const onSuccess = jest.fn();

      act(() => {
        result.current.run(() => Promise.resolve("ok"), {
          successMessage: "Đã lưu.",
          onSuccess,
        });
      });

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("ok"));
      expect(mockedToastSuccess).toHaveBeenCalledWith("Đã lưu.");
      expect(mockedLogout).not.toHaveBeenCalled();
    });

    it("shows the backend's message and does not log out for a non-401 ApiError", async () => {
      const { result } = renderHook(() => useApiToast());
      const onError = jest.fn();

      act(() => {
        result.current.run(() => Promise.reject(new ApiError("Job not found", 404)), { onError });
      });

      await waitFor(() => expect(onError).toHaveBeenCalled());
      expect(mockedToastError).toHaveBeenCalledWith("Job not found");
      expect(mockedLogout).not.toHaveBeenCalled();
    });

    it("forces a logout on a 401 — the refresh flow already failed by the time this reaches the UI", async () => {
      const { result } = renderHook(() => useApiToast());
      const onError = jest.fn();

      act(() => {
        result.current.run(() => Promise.reject(new ApiError("Unauthorized", 401)), { onError });
      });

      await waitFor(() => expect(mockedLogout).toHaveBeenCalledTimes(1));
      expect(onError).toHaveBeenCalled();
      expect(mockedToastError).toHaveBeenCalledWith(expect.stringContaining("hết hạn"));
    });
  });

  describe("callApi", () => {
    it("resolves with the value on success", async () => {
      const { result } = renderHook(() => useApiToast());

      const value = await act(() => result.current.callApi(Promise.resolve(42)));

      expect(value).toBe(42);
      expect(mockedLogout).not.toHaveBeenCalled();
    });

    it("returns undefined and forces a logout on a 401", async () => {
      const { result } = renderHook(() => useApiToast());

      const value = await act(() =>
        result.current.callApi(Promise.reject(new ApiError("Unauthorized", 401))),
      );

      expect(value).toBeUndefined();
      expect(mockedLogout).toHaveBeenCalledTimes(1);
    });

    it("returns undefined without logging out for a non-401 error", async () => {
      const { result } = renderHook(() => useApiToast());

      const value = await act(() =>
        result.current.callApi(Promise.reject(new ApiError("Server error", 500))),
      );

      expect(value).toBeUndefined();
      expect(mockedLogout).not.toHaveBeenCalled();
      expect(mockedToastError).toHaveBeenCalledWith("Server error");
    });
  });
});
