import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveEvent } from "@/lib/queries/events";
import { SignInForm } from "./SignInForm";

type SignInPageProps = {
  searchParams: Promise<{ role?: string; callbackUrl?: string }>;
};

export default async function CustomSignInPage({ searchParams }: SignInPageProps) {
  const { role, callbackUrl } = await searchParams;
  const session = await auth();
  const activeEvent = await getActiveEvent();

  const normalizedRole =
    role?.toUpperCase() === "ORGANIZER" || role?.toUpperCase() === "JUDGE" || role?.toUpperCase() === "REGISTRANT"
      ? (role.toUpperCase() as "ORGANIZER" | "JUDGE" | "REGISTRANT")
      : undefined;

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-center items-center p-6 selection:bg-emerald-500 selection:text-black font-sans antialiased">
      <div className="fixed inset-0 bg-[radial-gradient(#1c1d22_1px,transparent_1px)] [bg-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2 font-mono">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 led-glow-emerald animate-pulse" />
            <span className="font-bold text-base">podium</span>
            <span className="text-neutral-600">//</span>
            <span className="text-xs text-neutral-400">auth</span>
          </Link>
          <h1 className="text-xl font-bold text-white pt-2 font-sans tracking-tight uppercase">
            {normalizedRole ? `${normalizedRole} SIGN IN` : "SIGN IN"}
          </h1>
          <p className="text-xs text-neutral-400 font-sans">
            {normalizedRole === "ORGANIZER"
              ? "Organizer credentials required to access event admin workspaces."
              : normalizedRole === "JUDGE"
              ? "Judge credentials required for evaluation workstation."
              : normalizedRole === "REGISTRANT"
              ? "Registrant credentials required for team & project hub."
              : "Enter your credentials to access your hackathon workspace."}
          </p>
        </div>

        <SignInForm
          activeEventSlug={activeEvent?.slug}
          currentUser={session?.user}
          initialRole={normalizedRole}
          callbackUrl={callbackUrl}
        />
      </div>
    </div>
  );
}
