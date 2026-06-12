"use client";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInForm({
  googleEnabled,
}: {
  googleEnabled: boolean;
}) {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="border-border/40 bg-card w-full max-w-sm rounded-xl border p-8 shadow-lg">
        <h1 className="text-foreground mb-2 text-xl font-semibold">
          WHC Editor
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Sign in with your WHC Google account to access the editor.
        </p>

        {googleEnabled ? (
          <>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/projects" })}
              className="bg-foreground text-background hover:bg-foreground/90 w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Sign in with Google
            </button>
            {oauthError === "AccessDenied" && (
              <p className="text-destructive mt-3 text-xs">
                Your Google account isn&apos;t on the access list. Ask Flemo
                to add you on whc-review.
              </p>
            )}
            {oauthError && oauthError !== "AccessDenied" && (
              <p className="text-destructive mt-3 text-xs">
                Sign-in failed ({oauthError}). Try again.
              </p>
            )}
          </>
        ) : (
          <p className="text-destructive text-xs">
            Google sign-in not configured. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET on Vercel.
          </p>
        )}
      </div>
    </div>
  );
}
