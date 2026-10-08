import { NextResponse } from "next/server";

// Certificates are generated on request rather than in a batch: most are never
// downloaded, and a job queue is not worth running for the ones that are.
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
