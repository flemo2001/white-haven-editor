"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { storageService } from "@/services/storage/service";
import type { TProject } from "@/project/types";

type CloudProjectMeta = {
  projectId: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
  updatedAt: string;
  recordId: string;
};

type LocalProjectMeta = {
  id: string;
  name: string;
  updatedAt: Date;
};

export default function SharedProjectsClient() {
  const router = useRouter();
  const [cloudProjects, setCloudProjects] = useState<CloudProjectMeta[]>([]);
  const [localProjects, setLocalProjects] = useState<LocalProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refreshCloud = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setCloudProjects(json.projects || []);
    } catch (e: any) {
      toast.error(`Failed to load shared projects: ${e.message}`);
    }
  }, [router]);

  const refreshLocal = useCallback(async () => {
    try {
      const list = await storageService.loadAllProjectsMetadata();
      setLocalProjects(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          updatedAt: p.updatedAt,
        })),
      );
    } catch (e: any) {
      toast.error(`Failed to load local projects: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshCloud(), refreshLocal()]);
      setLoading(false);
    })();
  }, [refreshCloud, refreshLocal]);

  const handlePull = async (cloud: CloudProjectMeta) => {
    setBusyId(cloud.projectId);
    try {
      const res = await fetch(`/api/projects/${cloud.projectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { project: serialized } = await res.json();
      // Reconstruct TProject — dates come back as ISO strings, scene tracks/etc
      // stay raw. The editor expects Date instances on metadata + scenes.
      const reconstructed: TProject = {
        ...serialized,
        metadata: {
          ...serialized.metadata,
          createdAt: new Date(serialized.metadata.createdAt),
          updatedAt: new Date(serialized.metadata.updatedAt),
        },
        scenes: (serialized.scenes || []).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
      };
      await storageService.saveProject({ project: reconstructed });
      toast.success(`Pulled "${cloud.name}" to local. Opening…`);
      router.push(`/editor/${cloud.projectId}`);
    } catch (e: any) {
      toast.error(`Pull failed: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handlePush = async (local: LocalProjectMeta) => {
    setBusyId(local.id);
    try {
      const result = await storageService.loadProject({ id: local.id });
      if (!result) throw new Error("Local project not found");
      const project = result.project;
      const serialized = {
        metadata: {
          ...project.metadata,
          createdAt: project.metadata.createdAt.toISOString(),
          updatedAt: project.metadata.updatedAt.toISOString(),
        },
        scenes: project.scenes.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        currentSceneId: project.currentSceneId,
        settings: project.settings,
        version: project.version,
        timelineViewState: project.timelineViewState,
      };
      const payload = JSON.stringify(serialized);
      if (payload.length > 100_000) {
        toast.error(
          `Project too large (${(payload.length / 1024).toFixed(0)}KB > 100KB). Shrink scenes or media references.`,
        );
        return;
      }
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.metadata.id,
          name: project.metadata.name,
          data: payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      toast.success(`Pushed "${project.metadata.name}" to team.`);
      await refreshCloud();
    } catch (e: any) {
      toast.error(`Push failed: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const cloudIds = new Set(cloudProjects.map((p) => p.projectId));
  const onlyLocal = localProjects.filter((p) => !cloudIds.has(p.id));
  const localById = new Map(localProjects.map((p) => [p.id, p]));

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">
              Shared with Team
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Projects pushed to the team cloud. Anyone signed in can pull and
              edit. Saves stay local until you Push.
            </p>
          </div>
          <Link
            href="/projects"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Local projects
          </Link>
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
                On the team cloud ({cloudProjects.length})
              </h2>
              {cloudProjects.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nothing shared yet. Push a local project below to get started.
                </p>
              ) : (
                <ul className="border-border/40 divide-border/40 divide-y rounded-lg border">
                  {cloudProjects.map((p) => {
                    const haveLocal = localById.has(p.projectId);
                    return (
                      <li
                        key={p.projectId}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-foreground truncate font-medium">
                            {p.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Last edited by {p.ownerName || p.ownerEmail} ·{" "}
                            {new Date(p.updatedAt).toLocaleString()}
                            {haveLocal && (
                              <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                                local copy
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === p.projectId}
                            onClick={() => handlePull(p)}
                            className="border-border/40 hover:bg-accent rounded-md border px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            {busyId === p.projectId
                              ? "Pulling…"
                              : haveLocal
                                ? "Pull & overwrite"
                                : "Pull to local"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
                Local-only ({onlyLocal.length})
              </h2>
              {onlyLocal.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Every local project is on the team cloud.
                </p>
              ) : (
                <ul className="border-border/40 divide-border/40 divide-y rounded-lg border">
                  {onlyLocal.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-foreground truncate font-medium">
                          {p.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Updated {p.updatedAt.toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() =>
                          handlePush({
                            id: p.id,
                            name: p.name,
                            updatedAt: p.updatedAt,
                          })
                        }
                        className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        {busyId === p.id ? "Pushing…" : "Push to team"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
