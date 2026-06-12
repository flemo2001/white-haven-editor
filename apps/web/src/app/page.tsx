// Home → redirect straight to /projects. Operators land on the project picker;
// /editor/[project_id] handles the actual editing surface. Marketing routes
// were stripped during the WHC fork (2026-06-12) — this fork is internal-tool
// only, no public landing page needed.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/projects");
}
