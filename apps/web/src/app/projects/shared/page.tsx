// Shared (team-wide) projects page. Lists projects on the cloud and offers
// Pull-to-local + Push-from-local. Saves don't auto-sync yet — user explicitly
// pushes to share. Roadmap: auto-push-through on local save (TODO).
import SharedProjectsClient from "./_client";

export const dynamic = "force-dynamic";

export default function SharedProjectsPage() {
  return <SharedProjectsClient />;
}
