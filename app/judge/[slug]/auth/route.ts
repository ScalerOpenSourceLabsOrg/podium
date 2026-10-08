import { NextResponse } from "next/server";

// Magic-link redemption. A judge arrives here from their email with a token,
// gets a session, and is redirected into the queue.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
