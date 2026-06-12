// Users allow-list lookup for the editor — same Airtable table whc-review
// uses (Config base appIzvbvPOiDFvp4B / tblTjgQ1gtKxsbuVV). Source of truth
// for who can sign in. Add/remove via whc-review's /admin page.
//
// Field-id keyed reads use the returnFieldsByFieldId=true URL flag — without
// it AT returns fields keyed by display name and the FLD_* lookups return
// undefined, which we learned the hard way 2026-06-12 on whc-review.

const AT_CONFIG_BASE = "appIzvbvPOiDFvp4B";
const AT_USERS_TABLE = "tblTjgQ1gtKxsbuVV";
const FLD_EMAIL = "fldqwkW28QuYVyMVV";
const FLD_ROLE = "fldQqbut2NFoLaCuX";
const FLD_ACTIVE = "fldroCShSNlRbsatU";
const FLD_LAST_LOGIN = "fldByLn1VGdxV2VzH";

export type UserRole = "Admin" | "Member";

export type WhcUser = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
};

function atToken(): string {
  const t = process.env.AIRTABLE_FLEMO_TOKEN || process.env.AIRTABLE_TOKEN;
  if (!t) throw new Error("AIRTABLE_FLEMO_TOKEN or AIRTABLE_TOKEN not set");
  return t;
}

export async function findActiveUserByEmail(email: string): Promise<WhcUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const formula = `LOWER({Email})='${normalized.replace(/'/g, "\\'")}'`;
  const url =
    `https://api.airtable.com/v0/${AT_CONFIG_BASE}/${AT_USERS_TABLE}` +
    `?filterByFormula=${encodeURIComponent(formula)}` +
    `&maxRecords=1&returnFieldsByFieldId=true`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${atToken()}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`users-airtable lookup ${r.status}`);
  const data = await r.json();
  const rec = data.records?.[0];
  if (!rec) return null;
  const active = rec.fields[FLD_ACTIVE] === true;
  if (!active) return null;
  const roleRaw = rec.fields[FLD_ROLE];
  const role: UserRole = roleRaw === "Admin" ? "Admin" : "Member";
  return {
    id: rec.id,
    email: rec.fields[FLD_EMAIL] || normalized,
    role,
    active,
  };
}

export async function recordLogin(userId: string): Promise<void> {
  try {
    await fetch(
      `https://api.airtable.com/v0/${AT_CONFIG_BASE}/${AT_USERS_TABLE}/${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${atToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: { [FLD_LAST_LOGIN]: new Date().toISOString() },
        }),
      },
    );
  } catch {}
}
