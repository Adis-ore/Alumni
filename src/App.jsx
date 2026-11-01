import { useState } from "react";
import BioDataForm from "./components/BioDataForm.jsx";
import ThankYou from "./components/ThankYou.jsx";

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  const [submitted, setSubmitted] = useState(false);
  const [submitter, setSubmitter] = useState({ fullName: "", email: "" });

  const handleSuccess = ({ fullName, email }) => {
    setSubmitter({ fullName, email });
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitter({ fullName: "", email: "" });
  };

  const firstName = submitter.fullName.split(/\s+/)[0] || "there";

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans text-slate-900 antialiased">
      <main className="flex-1">
        {submitted ? (
          <ThankYou firstName={firstName} email={submitter.email} onReset={handleReset} />
        ) : (
          <BioDataForm onSuccess={handleSuccess} />
        )}
      </main>

      <footer className="px-4 pb-8 pt-4 text-center text-xs text-slate-500">
        © {CURRENT_YEAR} Alumni Association
      </footer>
    </div>
  );
}
