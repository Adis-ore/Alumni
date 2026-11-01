import { useCallback, useState } from "react";
import BioDataForm from "./components/BioDataForm.jsx";
import ThankYou from "./components/ThankYou.jsx";
import Welcome from "./components/Welcome.jsx";

const CURRENT_YEAR = new Date().getFullYear();
const WELCOMED_KEY = "alumni-welcomed";

export default function App() {
  // Show the welcome screen once per browser tab; refreshing the form won't replay it.
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return sessionStorage.getItem(WELCOMED_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitter, setSubmitter] = useState({ fullName: "", email: "" });

  const finishWelcome = useCallback(() => {
    try {
      sessionStorage.setItem(WELCOMED_KEY, "1");
    } catch {
      // Storage blocked: the welcome may show again on refresh, which is harmless.
    }
    setShowWelcome(false);
  }, []);

  const handleSuccess = ({ fullName, email }) => {
    setSubmitter({ fullName, email });
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitter({ fullName: "", email: "" });
  };

  const firstName = submitter.fullName.split(/\s+/)[0] || "there";

  let content;
  if (showWelcome) {
    content = <Welcome onDone={finishWelcome} />;
  } else if (submitted) {
    content = <ThankYou firstName={firstName} email={submitter.email} onReset={handleReset} />;
  } else {
    content = <BioDataForm onSuccess={handleSuccess} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans text-slate-900 antialiased">
      <main className="flex-1">{content}</main>

      <footer className="px-4 pb-8 pt-4 text-center text-xs text-slate-500">
        © {CURRENT_YEAR} Alumni Association
      </footer>
    </div>
  );
}
