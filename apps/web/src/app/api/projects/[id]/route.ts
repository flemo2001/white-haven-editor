// GET    /api/projects/[id] — fetch one project's full TProject JSON
// DELETE /api/projects/[id] — soft delete (Active=false)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProject, deleteProject } from "@/lib/projects-airtable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { email: session.user.email };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireSession();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e).slice(0, 300) },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireSession();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const ok = await deleteProject(id);
    if (!ok) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e).slice(0, 300) },
      { status: 502 },
    );
  }
}
