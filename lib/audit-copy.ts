const ACTION_LABELS: Record<string, string> = {
  staff_login: "Signed in to the officer console",
  staff_logout: "Signed out",
  staff_login_failed: "Tried to sign in with the wrong password",
  voters_upload: "Uploaded the voter list",
  voter_create: "Added a voter",
  voter_update: "Updated a voter",
  voter_delete: "Removed a voter",
  position_create: "Added a position",
  position_update: "Renamed a position",
  position_delete: "Removed a position",
  candidate_create: "Added a candidate",
  candidate_update: "Updated a candidate",
  candidate_photo: "Uploaded a candidate photo",
  candidate_delete: "Removed a candidate",
  election_open: "Opened voting",
  election_close: "Closed voting",
  election_restart: "Restarted the election",
  election_rename: "Renamed the election",
  device_reset: "Reset a voter’s device",
  password_reset: "Reset a voter’s password",
  report_download: "Downloaded a report",
  account_created: "A voter created their password",
  login_ok: "A voter signed in",
  login_rejected: "Someone not on the list tried to sign in",
  login_already_voted: "Someone who already voted tried to sign in again",
  device_blocked: "Blocked a sign-in from a different device",
  ballot_cast: "A vote was recorded",
};

const ACTOR_LABELS: Record<string, string> = {
  admin: "Admin",
  observer: "Observer",
  voter: "Voter",
  unknown: "Unknown person",
  system: "System",
};

function looksTechnical(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return true;
  if (/^c[a-z0-9]{20,}$/i.test(trimmed)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) return true;
  if (trimmed.includes("file:") || trimmed.includes("json")) return true;
  return false;
}

export function actorLabel(actor: string) {
  return ACTOR_LABELS[actor] || "Someone";
}

export function actionLabel(action: string) {
  return ACTION_LABELS[action] || "Made a change";
}

export function noteLabel(detail: string | null | undefined) {
  if (!detail || looksTechnical(detail)) return "";
  if (detail.endsWith(" rows")) return `${detail.replace(" rows", "")} people on the list`;
  return detail;
}

export function formatWhen(date: Date) {
  return date.toISOString().replace("T", " · ").slice(0, 18);
}
