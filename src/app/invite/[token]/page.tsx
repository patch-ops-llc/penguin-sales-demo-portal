import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, GoogleButton, OrDivider } from "@/components/auth-card";
import { env } from "@/lib/env";
import { LinkInvalid, SetPasswordForm } from "@/components/set-password-form";
import { lookupInvite, setPasswordWithToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your account" };

export default async function Page({ params, searchParams }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const lookup = await lookupInvite(token);

  async function submit(formData: FormData): Promise<void> {
    "use server";
    const name = String(formData.get("name") ?? "").trim().slice(0, 120) || null;
    const result = await setPasswordWithToken("invite", token, String(formData.get("password") ?? ""), String(formData.get("confirm") ?? ""), name);
    if (!result.ok) {
      redirect(`/invite/${encodeURIComponent(token)}?error=${result.reason}`);
    }
    await setSessionCookie(result);
    redirect("/launchpad");
  }

  return (
    <AuthCard title="Set up your account" description={lookup.ok ? "You have been invited to the Penguin Sales Demo Portal. Choose a password to finish." : undefined}>
      {lookup.ok ? (
        <div className="space-y-4">
          {env.googleEnabled ? (
            <>
              <GoogleButton label={`Continue with Google as ${lookup.user.email}`} />
              <OrDivider />
            </>
          ) : null}
          <SetPasswordForm
          action={submit}
          email={lookup.user.email}
          name={lookup.user.name}
          askName={true}
          error={typeof query.error === "string" ? query.error : undefined}
          submitLabel="Create account"
          />
        </div>
      ) : (
        <LinkInvalid what="invite" />
      )}
    </AuthCard>
  );
}
