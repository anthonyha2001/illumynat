import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "Create Account — ILLUMYNAT",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">

      {/* Card */}
      <div className="bg-surface border border-border p-10 md:p-12 shadow-sm">

        {/* Header */}
        <div className="mb-10 space-y-2">
          <p className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">
            Join ILLUMYNAT
          </p>
          <h1 className="font-display text-3xl font-light italic text-text">
            Create your account
          </h1>
          <p className="font-body text-sm text-text-muted leading-relaxed">
            Save your addresses, track orders, and build your wishlist.
          </p>
        </div>

        <SignupForm />

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="font-body text-[11px] text-text-faint tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Switch to login */}
        <p className="font-body text-sm text-text-muted text-center">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-text underline underline-offset-4 hover:text-accent transition-colors duration-200"
          >
            Sign in
          </a>
        </p>
      </div>

      {/* Trust signals */}
      <div className="mt-6 flex items-center justify-center gap-6">
        {["No spam, ever", "Cancel anytime", "Secure checkout"].map((t) => (
          <span key={t} className="font-body text-[10px] text-text-faint tracking-wide flex items-center gap-1.5">
            <span className="text-accent">✓</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
