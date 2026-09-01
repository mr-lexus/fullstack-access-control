import { describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/server/http";

describe("HTTP error translation", () => {
  it("translates unexpected exceptions to a generic 500 response and logs the exception", async () => {
    const logger = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      const response = errorResponse(
        new Error("database details must stay server-side"),
      );
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected server error occurred.",
        },
      });
      expect(logger).toHaveBeenCalledWith(
        "Unexpected server error",
        expect.objectContaining({
          message: "database details must stay server-side",
        }),
      );
    } finally {
      logger.mockRestore();
    }
  });
});
