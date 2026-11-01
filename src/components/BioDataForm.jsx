import { useEffect, useState } from "react";
import { SCRIPT_URL } from "../config.js";

/* ------------------------------------------------------------------
   EDITABLE OPTIONS — change these arrays to update the dropdowns
   ------------------------------------------------------------------ */
const START_YEAR = 2008; // first graduation year offered; the list runs up to the current year
const HOUSES = ["HOUSE 1", "HOUSE 2", "HOUSE 3", "HOUSE 4"];
const QUALIFICATIONS = [
  "SSCE",
  "OND",
  "NCE",
  "HND",
  "B.Sc/B.A",
  "M.Sc/MBA",
  "PhD",
  "Other",
];
const GENDERS = ["Male", "Female"];
const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States", "Canada", "Other"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (_, i) => String(CURRENT_YEAR - i), // newest first
);

const INITIAL_VALUES = {
  fullName: "",
  nickname: "",
  gender: "",
  birthdayDay: "",
  birthdayMonth: "",
  email: "",
  phone: "",
  city: "",
  country: "Nigeria",
  countryOther: "",
  gradYear: "",
  classArm: "",
  house: "",
  post: "",
  occupation: "",
  qualification: "",
  willingToSupport: "",
  consent: false,
};

// Fields shown in the confirmation step, in display order.
const REVIEW_FIELDS = [
  ["fullName", "Full name"],
  ["nickname", "Nickname in school"],
  ["gender", "Gender"],
  ["birthday", "Birthday"],
  ["email", "Email address"],
  ["phone", "Phone / WhatsApp"],
  ["city", "Current city / state"],
  ["country", "Country"],
  ["gradYear", "Year of graduation"],
  ["classArm", "Class / arm"],
  ["house", "House"],
  ["post", "Post held in school"],
  ["occupation", "Occupation"],
  ["qualification", "Highest qualification"],
  ["willingToSupport", "Willing to support / mentor"],
];

// Builds the exact values that get sent (and shown on the confirmation screen).
function buildRecord(values) {
  return {
    fullName: values.fullName.trim(),
    nickname: values.nickname.trim(),
    gender: values.gender,
    birthday:
      values.birthdayDay && values.birthdayMonth
        ? `${values.birthdayDay} ${values.birthdayMonth}`
        : "",
    email: values.email.trim(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    country: values.country === "Other" ? values.countryOther.trim() : values.country,
    gradYear: values.gradYear,
    classArm: values.classArm.trim(),
    house: values.house,
    post: values.post.trim(),
    occupation: values.occupation.trim(),
    qualification: values.qualification,
    willingToSupport: values.willingToSupport,
    consent: values.consent ? "Yes" : "No",
  };
}

// Saved answers survive page refreshes until the form is successfully submitted.
const DRAFT_KEY = "alumni-biodata-draft";

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!saved || typeof saved !== "object") return INITIAL_VALUES;
    // Only keep known keys, so old or tampered drafts can't break the form.
    const merged = { ...INITIAL_VALUES };
    for (const key of Object.keys(INITIAL_VALUES)) {
      if (typeof saved[key] === typeof INITIAL_VALUES[key]) merged[key] = saved[key];
    }
    return merged;
  } catch {
    return INITIAL_VALUES;
  }
}

function saveDraft(values) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // Storage full or blocked (e.g. private mode): the form still works, just without saving.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

/* ------------------------------------------------------------------
   VALIDATION
   ------------------------------------------------------------------ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Nigerian numbers: +234 or 0, then a 7/8/9 network prefix and 9 more digits.
const NG_PHONE_RE = /^(\+?234|0)[789]\d{9}$/;

function validate(values) {
  const errors = {};

  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address, e.g. name@example.com.";
  }

  const phone = values.phone.replace(/[\s()-]/g, "");
  if (!phone) {
    errors.phone = "Phone / WhatsApp number is required.";
  } else if (!NG_PHONE_RE.test(phone)) {
    errors.phone = "Enter a valid Nigerian number, e.g. 08012345678 or +2348012345678.";
  }

  if (!values.city.trim()) errors.city = "Current city / state is required.";
  if (!values.gradYear) errors.gradYear = "Select your year of graduation.";
  if (values.country === "Other" && !values.countryOther.trim()) {
    errors.countryOther = "Type your country name.";
  }
  if (!values.consent) errors.consent = "You must agree before submitting.";

  return errors;
}

/* ------------------------------------------------------------------
   SMALL UI HELPERS
   ------------------------------------------------------------------ */
const baseInput =
  "w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4";
const okInput = "border-slate-300 focus:border-brand-600 focus:ring-brand-100";
const errInput = "border-red-500 focus:border-red-500 focus:ring-red-100";

function Field({ id, label, required, helper, error, className = "", children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {helper && !error && <p className="mt-1.5 text-xs text-slate-500">{helper}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-1 w-full border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wider text-brand-600">
        {title}
      </legend>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function ReviewModal({ record, error, submitting, onEdit, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 id="review-title" className="text-lg font-bold text-slate-900">
            Confirm your details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Please check everything below. You can go back and edit before sending.
          </p>
        </div>

        <dl className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5 sm:px-6">
          {REVIEW_FIELDS.map(([key, label]) => (
            <div key={key} className="grid grid-cols-5 gap-2 py-2.5 text-sm">
              <dt className="col-span-2 text-slate-500">{label}</dt>
              <dd className="col-span-3 break-words font-medium text-slate-900">
                {record[key] || "—"}
              </dd>
            </div>
          ))}
        </dl>

        <div className="space-y-3 border-t border-slate-200 px-5 py-4 sm:px-6">
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onEdit}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50"
            >
              Edit details
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Spinner />
                  Submitting…
                </>
              ) : (
                "Confirm & submit"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   COMPONENT
   ------------------------------------------------------------------ */
export default function BioDataForm({ onSuccess }) {
  const [values, setValues] = useState(loadDraft);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Save every change so a refresh picks up where the user left off.
  useEffect(() => {
    saveDraft(values);
  }, [values]);

  const inputClass = (key) => `${baseInput} ${errors[key] ? errInput : okInput}`;
  const errorProps = (key) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    // Clear this field's error as soon as the user edits it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Step 1: validate, then open the confirmation screen. Nothing is sent yet.
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");

    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setConfirming(true);
  };

  const closeReview = () => {
    if (submitting) return;
    setConfirming(false);
    setSubmitError("");
  };

  // Step 2: the user confirmed on the review screen, so send the data.
  const sendSubmission = async () => {
    setSubmitError("");

    if (SCRIPT_URL.includes("PASTE_")) {
      setSubmitError("This form isn't connected yet. Please contact the Alumni Association.");
      return;
    }

    setSubmitting(true);
    const record = buildRecord(values);
    const payload = new URLSearchParams({
      ...record,
      timestamp: new Date().toISOString(),
    });

    try {
      // no-cors: the Apps Script response is opaque, so we only detect network failures.
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: payload,
      });
      clearDraft();
      onSuccess({ fullName: record.fullName, email: record.email });
    } catch {
      setSubmitError(
        "We couldn't send your bio-data. Check your internet connection and try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:py-12">
      <header className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Alumni Association
        </h1>
        <p className="mt-1 text-lg font-medium text-brand-600">Alumni Bio-Data Form</p>
        <p className="mt-2 text-sm text-slate-500">Takes about 2 minutes.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto max-w-2xl space-y-8 rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8"
      >
        {submitError && !confirming && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <Section title="Personal">
          <Field
            id="fullName"
            label="Full name (Surname first)"
            required
            error={errors.fullName}
            helper="e.g. Okafor Chinedu Emmanuel"
            className="sm:col-span-2"
          >
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={values.fullName}
              onChange={handleChange}
              className={inputClass("fullName")}
              {...errorProps("fullName")}
            />
          </Field>

          <Field id="nickname" label="Nickname in school">
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={values.nickname}
              onChange={handleChange}
              className={inputClass("nickname")}
            />
          </Field>

          <Field id="gender" label="Gender">
            <select
              id="gender"
              name="gender"
              value={values.gender}
              onChange={handleChange}
              className={inputClass("gender")}
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>

          <Field id="birthdayDay" label="Birthday (day and month)" className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <select
                id="birthdayDay"
                name="birthdayDay"
                aria-label="Birthday day"
                value={values.birthdayDay}
                onChange={handleChange}
                className={inputClass("birthdayDay")}
              >
                <option value="">Day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                id="birthdayMonth"
                name="birthdayMonth"
                aria-label="Birthday month"
                value={values.birthdayMonth}
                onChange={handleChange}
                className={inputClass("birthdayMonth")}
              >
                <option value="">Month</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </Field>
        </Section>

        <Section title="Contact">
          <Field
            id="email"
            label="Email address"
            required
            error={errors.email}
            helper="A copy of your submission will be sent here"
            className="sm:col-span-2"
          >
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              className={inputClass("email")}
              {...errorProps("email")}
            />
          </Field>

          <Field
            id="phone"
            label="Phone / WhatsApp number"
            required
            error={errors.phone}
            helper="e.g. 08012345678 or +2348012345678"
          >
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={handleChange}
              className={inputClass("phone")}
              {...errorProps("phone")}
            />
          </Field>

          <Field id="city" label="Current city / state" required error={errors.city}>
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={values.city}
              onChange={handleChange}
              className={inputClass("city")}
              {...errorProps("city")}
            />
          </Field>

          <Field id="country" label="Country" className="sm:col-span-2">
            <select
              id="country"
              name="country"
              value={values.country}
              onChange={handleChange}
              className={inputClass("country")}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          {values.country === "Other" && (
            <Field
              id="countryOther"
              label="Type your country"
              required
              error={errors.countryOther}
              className="sm:col-span-2"
            >
              <input
                id="countryOther"
                name="countryOther"
                type="text"
                autoComplete="country-name"
                value={values.countryOther}
                onChange={handleChange}
                className={inputClass("countryOther")}
                {...errorProps("countryOther")}
              />
            </Field>
          )}
        </Section>

        <Section title="School days">
          <Field id="gradYear" label="Year of graduation (set)" required error={errors.gradYear}>
            <select
              id="gradYear"
              name="gradYear"
              value={values.gradYear}
              onChange={handleChange}
              className={inputClass("gradYear")}
              {...errorProps("gradYear")}
            >
              <option value="">Select year</option>
              {GRAD_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>

          <Field id="classArm" label="Class / arm" helper="e.g. SS3 Science A">
            <input
              id="classArm"
              name="classArm"
              type="text"
              value={values.classArm}
              onChange={handleChange}
              className={inputClass("classArm")}
            />
          </Field>

          <Field id="house" label="House">
            <select
              id="house"
              name="house"
              value={values.house}
              onChange={handleChange}
              className={inputClass("house")}
            >
              <option value="">Select house</option>
              {HOUSES.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </Field>

          <Field
            id="post"
            label="Post held in school"
            helper="e.g. Prefect, Games captain — leave blank if none"
          >
            <input
              id="post"
              name="post"
              type="text"
              value={values.post}
              onChange={handleChange}
              className={inputClass("post")}
            />
          </Field>
        </Section>

        <Section title="Now">
          <Field id="occupation" label="Current occupation / what you do" className="sm:col-span-2">
            <input
              id="occupation"
              name="occupation"
              type="text"
              value={values.occupation}
              onChange={handleChange}
              className={inputClass("occupation")}
            />
          </Field>

          <Field id="qualification" label="Highest qualification">
            <select
              id="qualification"
              name="qualification"
              value={values.qualification}
              onChange={handleChange}
              className={inputClass("qualification")}
            >
              <option value="">Select qualification</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </Field>

          <fieldset className="flex flex-col">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">
              Willing to support school projects / mentor juniors?
            </legend>
            <div className="flex flex-1 items-center gap-6">
              {["Yes", "No"].map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 text-base text-slate-800"
                >
                  <input
                    type="radio"
                    name="willingToSupport"
                    value={option}
                    checked={values.willingToSupport === option}
                    onChange={handleChange}
                    className="h-5 w-5 cursor-pointer accent-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        <section className="space-y-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-700">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              checked={values.consent}
              onChange={handleChange}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "consent-error" : undefined}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-600 focus:ring-4 focus:ring-brand-100"
            />
            <span>
              I agree that my details can be stored and used by the Alumni
              Association.
              <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="text-sm text-red-600">
              {errors.consent}
            </p>
          )}
        </section>

        {!values.consent && (
          <p className="-mb-4 text-center text-sm text-slate-500">
            Tick the consent box above to enable submission.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !values.consent}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed ${
            values.consent ? "disabled:opacity-70" : "opacity-40 blur-[1.5px] grayscale"
          }`}
        >
          {submitting ? (
            <>
              <Spinner />
              Submitting…
            </>
          ) : (
            "Submit Bio-Data"
          )}
        </button>
      </form>

      {confirming && (
        <ReviewModal
          record={buildRecord(values)}
          error={submitError}
          submitting={submitting}
          onEdit={closeReview}
          onConfirm={sendSubmission}
        />
      )}
    </div>
  );
}
