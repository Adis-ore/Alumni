import { useEffect } from "react";
import { SCHOOL_NAME } from "../config.js";

const WELCOME_MS = 5000;

export default function Welcome({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, WELCOME_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="animate-pop-in flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-600 shadow-lg motion-reduce:animate-none">
        <svg
          viewBox="0 0 64 64"
          className="h-14 w-14"
          aria-hidden="true"
        >
          <path d="M32 14 L56 26 L32 38 L8 26 Z" fill="#ffffff" />
          <path d="M18 32 V44 C18 47 24 50 32 50 C40 50 46 47 46 44 V32 L32 39 Z" fill="#ffffff" opacity="0.85" />
          <path d="M52 27 V40" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="52" cy="42" r="2.5" fill="#ffffff" />
        </svg>
      </div>

      <h1 className="animate-fade-up mt-8 text-4xl font-bold text-slate-900 sm:text-5xl motion-reduce:animate-none">
        Welcome
      </h1>
      <p className="animate-fade-up mt-3 text-lg text-slate-600 motion-reduce:animate-none">
        to the {SCHOOL_NAME} Alumni Association
      </p>

      <div className="mt-10 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full origin-left animate-fill-bar rounded-full bg-brand-600 motion-reduce:animate-none" />
      </div>
      <p className="mt-3 text-sm text-slate-500">Taking you to the bio-data form…</p>
    </section>
  );
}
