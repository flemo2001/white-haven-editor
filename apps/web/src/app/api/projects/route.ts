// GET  /api/projects                — list all active shared projects
// POST /api/projects                — upsert a project (save body JSON)
//
// v1 sharing model: any signed-in WHC user can read + write any project.
// Per-row ownership is recorded (Owner Email) but not enforced as a write
// gate — that's a v2 layer when permissions arrive.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listProjects, saveProject } from "@/lib/projects-airtable";

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

export async function GET() {
  const gate = await requireSession();
  if ("response" in gate) return gate.response;
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e).slice(0, 300) },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireSession();
  if ("response" in gate) return gate.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  const projectId = String(body.projectId || "").trim();
  const name = String(body.name || "Untitled").trim();
  const data = typeof body.data === "string" ? body.data : "";

  if (!projectId) {
    return NextResponse.json({ error: "missing-projectId" }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "missing-data" }, { status: 400 });
  }

  try {
    const result = await saveProject({
      projectId,
      name,
      data,
      userEmail: gate.email,
    });
    return NextResponse.json({ ok: true, project: result });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg.includes("too large") ? 413 : 502;
    return NextResponse.json({ error: msg.slice(0, 300) }, { status });
  }
}
