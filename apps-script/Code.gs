/**
 * Alumni Bio-Data — Google Apps Script backend
 *
 * What it does on each submission:
 *   1. Rejects the submission if consent is not "Yes" or required fields are missing.
 *   2. Appends a row to the Google Sheet.
 *   3. Emails the submitter a copy of their bio-data.
 *
 * SETUP
 *   1. Create a Google Sheet. Open Extensions > Apps Script and paste this file
 *      into Code.gs (replace the default code).
 *   2. Leave SPREADSHEET_ID blank if the script was opened from the sheet
 *      (Extensions > Apps Script). Otherwise paste the sheet ID from its URL.
 *   3. Click Deploy > New deployment > type "Web app":
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Authorise the permissions prompt (Sheets + Gmail).
 *   4. Copy the Web app URL and paste it into src/config.js as SCRIPT_URL.
 *   5. After editing this file later, use Deploy > Manage deployments > Edit >
 *      New version, otherwise the web app keeps running the old code.
 *   6. Optional: run testSubmission() once from the editor to check the sheet
 *      and email. Set TEST_EMAIL to your own address first.
 *
 * NOTE: MailApp quota is about 100 emails/day on a personal Google account and
 * about 1,500/day on Google Workspace.
 */

const SPREADSHEET_ID = ""; // blank = the spreadsheet this script is attached to
const SHEET_NAME = "Responses";
const ASSOCIATION_NAME = "Alumni Association"; // shown in the email
const EMAIL_SUBJECT = "Your Alumni Bio-Data submission";
const TEST_EMAIL = "you@example.com"; // used only by testSubmission()

// Column order in the sheet. [form key, column heading]
const FIELDS = [
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
  ["consent", "Consent given"],
  ["timestamp", "Submitted at (device)"],
];

const REQUIRED = ["fullName", "email", "phone", "city", "gradYear"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Health check: open the Web app URL in a browser to confirm it is live. */
function doGet() {
  return json({ ok: true, message: "Alumni bio-data endpoint is running." });
}

/** Receives the form POST sent by the React app (application/x-www-form-urlencoded). */
function doPost(e) {
  const data = (e && e.parameter) || {};

  const error = validate(data);
  if (error) return json({ ok: false, error: error });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    console.error("Could not get script lock: " + err);
    return json({ ok: false, error: "Server is busy, please try again." });
  }
  try {
    appendRow(data);
  } catch (err) {
    console.error("Sheet write failed: " + err);
    return json({ ok: false, error: "Could not save the submission." });
  } finally {
    lock.releaseLock();
  }

  // Email is sent after the lock is released and failures do not undo the saved row.
  let emailed = true;
  try {
    sendConfirmationEmail(data);
  } catch (err) {
    emailed = false;
    console.error("Confirmation email failed for " + data.email + ": " + err);
  }

  return json({ ok: true, emailed: emailed });
}

function validate(data) {
  if (data.consent !== "Yes") {
    return "Consent is required to store your details.";
  }
  for (const key of REQUIRED) {
    if (!String(data[key] || "").trim()) {
      return "Missing required field: " + key;
    }
  }
  if (!EMAIL_RE.test(String(data.email).trim())) {
    return "Invalid email address.";
  }
  return null;
}

function getSheet() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function appendRow(data) {
  const sheet = getSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Received at (server)"].concat(FIELDS.map((f) => f[1])));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, FIELDS.length + 1).setFontWeight("bold");
  }

  const row = [new Date()].concat(
    FIELDS.map(([key]) => String(data[key] || "").trim())
  );
  sheet.appendRow(row);
}

function sendConfirmationEmail(data) {
  const firstName = String(data.fullName).trim().split(/\s+/)[0] || "there";
  const rows = FIELDS.filter(([key]) => key !== "consent" && key !== "timestamp")
    .map(([key, label]) => {
      const value = String(data[key] || "").trim() || "—";
      return (
        '<tr>' +
        '<td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;white-space:nowrap">' +
        escapeHtml(label) + "</td>" +
        '<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">' +
        escapeHtml(value) + "</td></tr>"
      );
    })
    .join("");

  const htmlBody =
    '<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:560px">' +
    '<h2 style="color:#1e3a8a;margin-bottom:4px">Thank you, ' + escapeHtml(firstName) + "!</h2>" +
    "<p>Your bio-data has been received. Here is a copy of what you submitted:</p>" +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' + rows + "</table>" +
    '<p style="margin-top:24px">Welcome back to the family — ' + escapeHtml(ASSOCIATION_NAME) + ".</p>" +
    "</div>";

  const plainBody =
    "Thank you, " + firstName + "!\n\n" +
    "Your bio-data has been received. Here is a copy of what you submitted:\n\n" +
    FIELDS.filter(([key]) => key !== "consent" && key !== "timestamp")
      .map(([key, label]) => label + ": " + (String(data[key] || "").trim() || "—"))
      .join("\n") +
    "\n\nWelcome back to the family — " + ASSOCIATION_NAME + ".";

  MailApp.sendEmail({
    to: String(data.email).trim(),
    subject: EMAIL_SUBJECT,
    body: plainBody,
    htmlBody: htmlBody,
    name: ASSOCIATION_NAME,
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Run this from the Apps Script editor to test the sheet and email end to end. */
function testSubmission() {
  const fake = {
    fullName: "Test Person",
    nickname: "Tester",
    gender: "Male",
    birthday: "15 March",
    email: TEST_EMAIL,
    phone: "08012345678",
    city: "Lagos",
    country: "Nigeria",
    gradYear: "2015",
    classArm: "SS3 Science A",
    house: "HOUSE 1",
    post: "",
    occupation: "Engineer",
    qualification: "B.Sc/B.A",
    willingToSupport: "Yes",
    consent: "Yes",
    timestamp: new Date().toISOString(),
  };
  const result = doPost({ parameter: fake });
  Logger.log(result.getContent());
}
