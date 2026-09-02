import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants/auth";
import { CV_ENDPOINT } from "@/lib/constants/endpoint";
import { API_PREFIX, BACKEND_URL } from "@/lib/constants/service";
import { getCookies } from "@/lib/utils/http";

// GET /cvs/:id/export returns a raw PDF authenticated by Bearer token — the
// browser can't attach that itself (the token lives in an httpOnly cookie),
// so this route runs server-side, adds the header, and streams the PDF back.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await getCookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(`${BACKEND_URL}${API_PREFIX}${CV_ENDPOINT.EXPORT(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!backendResponse.ok || !backendResponse.body) {
    const errorBody = await backendResponse.json().catch(() => ({ message: "Xuất CV thất bại." }));
    return NextResponse.json(errorBody, { status: backendResponse.status });
  }

  return new NextResponse(backendResponse.body, {
    status: 200,
    headers: {
      "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/pdf",
      "Content-Disposition": backendResponse.headers.get("Content-Disposition") ?? "attachment",
    },
  });
}
