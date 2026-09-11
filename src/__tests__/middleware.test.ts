/**
 * @jest-environment node
 *
 * Builds real NextRequest/NextResponse instances, whose classes extend the
 * native Request/Response — not implemented by jsdom (this project's
 * default test environment). Node's environment provides them natively.
 */
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { withSession } from "@/lib/middlewares/session.middleware";
import { withAuth } from "@/lib/middlewares/auth.middleware";

jest.mock("@/lib/middlewares/session.middleware", () => ({
  withSession: jest.fn(),
}));
jest.mock("@/lib/middlewares/auth.middleware", () => ({
  withAuth: jest.fn((_request, response) => response),
}));

describe("middleware", () => {
  it("runs withSession before withAuth, threading the same request/response through both", async () => {
    const callOrder: string[] = [];
    (withSession as jest.Mock).mockImplementation(() => {
      callOrder.push("session");
    });
    (withAuth as jest.Mock).mockImplementation((_request, response) => {
      callOrder.push("auth");
      return response;
    });

    const request = new NextRequest("http://localhost:3000/jobs");
    await middleware(request);

    expect(callOrder).toEqual(["session", "auth"]);

    const [sessionRequest, sessionResponse] = (withSession as jest.Mock).mock.calls[0] as [
      NextRequest,
      unknown,
    ];
    const [authRequest, authResponse] = (withAuth as jest.Mock).mock.calls[0] as [NextRequest, unknown];

    expect(sessionRequest).toBe(request);
    expect(authRequest).toBe(request);
    // The same response object withSession mutated (e.g. sets cookies on)
    // is the one withAuth then reads from.
    expect(authResponse).toBe(sessionResponse);
  });

  it("returns whatever withAuth returns", async () => {
    const request = new NextRequest("http://localhost:3000/jobs");
    (withSession as jest.Mock).mockResolvedValue(undefined);

    const result = await middleware(request);

    expect(result).toBeDefined();
    expect(withAuth).toHaveBeenCalled();
  });
});
