// Sign-in page — single Google button, no fallback. Users not on the Airtable
// allow-list bounce back here with ?error=AccessDenied which we surface in
// plain language so they know to ask Flemo.
import SignInForm from "./_form";
import { googleConfigured } from "@/auth";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return <SignInForm googleEnabled={googleConfigured} />;
}
