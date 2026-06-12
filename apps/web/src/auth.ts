// Auth.js v5 central config for white-haven-editor. Mirrors the auth pattern
// used by whc-review (same Google OAuth client, same Airtable Users allow-list
// on the Config base) so the same operator can sign in to both surfaces using
// one Google account.
//
// Env required:
//   AUTH_SECRET           — random 32-byte secret
//   GOOGLE_CLIENT_ID      — same OAuth client as whc-review
//   GOOGLE_CLIENT_SECRET  — ditto
//   AIRTABLE_FLEMO_TOKEN  — schema-read on Config base (appIzvbvPOiDFvp4B)
//
// signIn callback gates on the Users table (tblTjgQ1gtKxsbuVV) Active=true row;
// jwt callback enriches the token with role + AT record id; session callback
// surfaces role + email to client/server components. Member role = read+write
// any project; Admin role gets the future per-project ownership-management UI.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { findActiveUserByEmail, recordLogin } from "@/lib/users-airtable";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/sign-in", error: "/sign-in" },
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [],
  callbacks: {
    async signIn({ user }) {
      const email = (user.email || "").toLowerCase().trim();
      if (!email) return false;
      try {
        const allow = await findActiveUserByEmail(email);
        if (!allow) {
          console.warn(`[auth] sign-in denied: ${email} not in allow-list or inactive`);
          return false;
        }
        recordLogin(allow.id).catch(() => {});
        return true;
      } catch (e: any) {
        console.error(`[auth] signIn allow-list check failed: ${e?.message || e}`);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const u = await findActiveUserByEmail(user.email);
          if (u) {
            token.role = u.role;
            token.userId = u.id;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
});

export { googleConfigured };
