import { SCHOOL_NAME } from "../config.js";

export default function ThankYou({ firstName, email, onReset }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <div className="animate-pop-in flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-16 w-16 text-emerald-600"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="animate-fade-up mt-8 space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Thank you, {firstName}!
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Your bio-data has been received. A copy has been sent to{" "}
          <span className="font-semibold text-slate-800 break-all">{email}</span>.
        </p>
        <p className="text-base text-slate-600 sm:text-lg">
          Welcome back to the family — {SCHOOL_NAME} Alumni Association.
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="animate-fade-up mt-10 w-full rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:w-auto"
      >
        Submit another response
      </button>
    </section>
  );
}
