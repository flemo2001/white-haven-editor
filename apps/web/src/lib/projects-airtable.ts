// Server-side CRUD for the WHC Editor's shared project store.
// Backed by Airtable Config base / Editor Projects table — chosen over a real
// DB for the v1 multi-user MVP because (a) we already have AT auth scope on
// the same token whc-review uses, (b) project JSON fits in multilineText
// (typical 10-50KB vs 100KB cap), (c) no new infra to provision.
//
// Sharing model v1: any signed-in WHC user (per the Users allow-list) can
// open + save any Active row. Owner Email is recorded but not enforced as
// a write gate — that's a v2 layer when permissions arrive.
//
// Field IDs are pinned (returnFieldsByFieldId=true on reads) so we survive
// any future Airtable display-name renames.

const AT_BASE = "appIzvbvPOiDFvp4B";
const AT_TABLE = "tblKhOj5NqpHArVqi";

const FLD_NAME = "fldz6KXbmTttZcNCf";
const FLD_PROJECT_ID = "fldirszaaIc04kafN";
const FLD_OWNER_EMAIL = "fldxs4Ogf07KgFMNm";
const FLD_DATA = "fldj2BcJfih7RZDKO";
const FLD_SIZE_BYTES = "fldA8sQbaYDg4YpSj";
const FLD_ACTIVE = "fldMKBDcG12EuSsz7";
const FLD_CREATED = "fldYFQ7AoyLGXqEbz";
const FLD_LAST_SAVED = "fldNVkoXpnPa0MK4l";
const FLD_LAST_SAVED_BY = "fldd63tjJ35TCXpeY";

export type EditorProjectMeta = {
  recordId: string;
  projectId: string;
  name: string;
  ownerEmail: string;
  sizeBytes: number;
  createdAt: string | null;
  lastSavedAt: string | null;
  lastSavedBy: string | null;
};

export type EditorProjectFull = EditorProjectMeta & {
  data: string;
};

function atToken(): string {
  const t = process.env.AIRTABLE_FLEMO_TOKEN || process.env.AIRTABLE_TOKEN;
  if (!t) throw new Error("Airtable token missing");
  return t;
}

const MAX_DATA_BYTES = 100_000;

function meta(rec: any): EditorProjectMeta {
  return {
    recordId: rec.id,
    projectId: rec.fields[FLD_PROJECT_ID] || "",
    name: rec.fields[FLD_NAME] || "(untitled)",
    ownerEmail: rec.fields[FLD_OWNER_EMAIL] || "",
    sizeBytes: Number(rec.fields[FLD_SIZE_BYTES] || 0),
    createdAt: rec.fields[FLD_CREATED] || null,
    lastSavedAt: rec.fields[FLD_LAST_SAVED] || null,
    lastSavedBy: rec.fields[FLD_LAST_SAVED_BY] || null,
  };
}

/** List all Active=true projects, newest-saved first. v1: no per-user filter. */
export async function listProjects(): Promise<EditorProjectMeta[]> {
  const params = new URLSearchParams({
    pageSize: "100",
    filterByFormula: `{Active}`,
    "sort[0][field]": "Last Saved",
    "sort[0][direction]": "desc",
    returnFieldsByFieldId: "true",
  });
  const r = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}?${params}`,
    { headers: { Authorization: `Bearer ${atToken()}` }, cache: "no-store" },
  );
  if (!r.ok) throw new Error(`projects list ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.records || []).map(meta);
}

/** Look up an AT record by the editor's stable Project ID. */
async function findRecordByProjectId(projectId: string): Promise<any | null> {
  const formula = `AND({Project ID}='${projectId.replace(/'/g, "\\'")}', {Active})`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
    returnFieldsByFieldId: "true",
  });
  const r = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}?${params}`,
    { headers: { Authorization: `Bearer ${atToken()}` }, cache: "no-store" },
  );
  if (!r.ok) throw new Error(`project lookup ${r.status}`);
  const data = await r.json();
  return data.records?.[0] || null;
}

/** Fetch one project's full TProject JSON. */
export async function getProject(projectId: string): Promise<EditorProjectFull | null> {
  const rec = await findRecordByProjectId(projectId);
  if (!rec) return null;
  return {
    ...meta(rec),
    data: rec.fields[FLD_DATA] || "",
  };
}

/**
 * Upsert a project. If a row with the same Project ID exists, PATCH it;
 * otherwise POST a new row. Atomic semantics around the AT API; concurrent
 * writes for the same projectId are last-write-wins (v1 — no CAS).
 */
export async function saveProject({
  projectId,
  name,
  data,
  userEmail,
}: {
  projectId: string;
  name: string;
  data: string;
  userEmail: string;
}): Promise<EditorProjectMeta> {
  if (Buffer.byteLength(data, "utf8") > MAX_DATA_BYTES) {
    throw new Error(
      `Project too large for AT-backed storage (${Buffer.byteLength(data, "utf8")} > ${MAX_DATA_BYTES} bytes). Time to migrate to Vercel KV or Postgres.`,
    );
  }
  const existing = await findRecordByProjectId(projectId);
  const now = new Date().toISOString();
  const sizeBytes = Buffer.byteLength(data, "utf8");

  if (existing) {
    const patchFields: Record<string, any> = {
      [FLD_NAME]: name,
      [FLD_DATA]: data,
      [FLD_SIZE_BYTES]: sizeBytes,
      [FLD_LAST_SAVED]: now,
      [FLD_LAST_SAVED_BY]: userEmail,
    };
    const r = await fetch(
      `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}/${existing.id}?returnFieldsByFieldId=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${atToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: patchFields }),
      },
    );
    if (!r.ok) throw new Error(`project save ${r.status}: ${await r.text()}`);
    return meta(await r.json());
  }

  const createFields: Record<string, any> = {
    [FLD_NAME]: name,
    [FLD_PROJECT_ID]: projectId,
    [FLD_OWNER_EMAIL]: userEmail,
    [FLD_DATA]: data,
    [FLD_SIZE_BYTES]: sizeBytes,
    [FLD_ACTIVE]: true,
    [FLD_CREATED]: now,
    [FLD_LAST_SAVED]: now,
    [FLD_LAST_SAVED_BY]: userEmail,
  };
  const r = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}?returnFieldsByFieldId=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${atToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields: createFields }] }),
    },
  );
  if (!r.ok) throw new Error(`project create ${r.status}: ${await r.text()}`);
  const created = await r.json();
  return meta(created.records[0]);
}

/** Soft delete — flip Active=false. */
export async function deleteProject(projectId: string): Promise<boolean> {
  const existing = await findRecordByProjectId(projectId);
  if (!existing) return false;
  const r = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}/${existing.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${atToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { [FLD_ACTIVE]: false } }),
    },
  );
  return r.ok;
}
