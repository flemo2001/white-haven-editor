// Auth.js v5 handler — binds the central auth config so all /api/auth/* paths
// (signin, callback, signout, providers, csrf, session) resolve correctly.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
