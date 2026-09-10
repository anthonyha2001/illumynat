import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign In — LUMYNAT",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">

      {/* Card */}
      <div className="bg-surface border border-border p-10 md:p-12 shadow-sm">

        {/* Header */}
        <div className="mb-10 space-y-2">
          <p className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">
            Welcome back
          </p>
          <h1 className="font-display text-3xl font-light italic text-text">
            Sign in to your account
          </h1>
          <p className="font-body text-sm text-text-muted leading-relaxed">
            Access your orders, wishlist, and saved addresses.
          </p>
        </div>

        <LoginForm />

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="font-body text-[11px] text-text-faint tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Switch to signup */}
        <p className="font-body text-sm text-text-muted text-center">
          New to LUMYNAT?{" "}
          <a
            href="/signup"
            className="text-text underline underline-offset-4 hover:text-accent transition-colors duration-200"
          >
            Create an account
          </a>
        </p>
      </div>

      {/* Guest checkout note */}
      <p className="mt-6 text-center font-body text-[11px] text-text-faint leading-relaxed">
        You can also{" "}
        <a href="/checkout" className="underline underline-offset-4 hover:text-text-muted transition-colors duration-200">
          check out as a guest
        </a>{" "}
        — no account required.
      </p>
    </div>
  );
}
