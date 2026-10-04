import "server-only";

import { Prisma, type KaryakartaStatus } from "@prisma/client";

export class InputError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
    this.name = "InputError";
  }
}

function text(form: FormData, key: string, max: number, required: boolean, label: string): string | null {
  const raw = form.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    if (required) throw new InputError(`${label} आवश्यक है।`);
    return null;
  }
  if (value.length > max) throw new InputError(`${label} अधिकतम ${max} अक्षरों का हो सकता है।`);
  return value;
}

function bool(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

function date(form: FormData, key: string, label: string): Date | null {
  const value = text(form, key, 10, false, label);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputError(`${label} मान्य तिथि नहीं है।`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new InputError(`${label} मान्य तिथि नहीं है।`);
  return parsed;
}

export function parseLeaderForm(form: FormData) {
  const orderRaw = text(form, "displayOrder", 6, false, "क्रम");
  const displayOrder = orderRaw === null ? 0 : Number(orderRaw);
  if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 9999) {
    throw new InputError("क्रम 0 से 9999 के बीच की संख्या होनी चाहिए।");
  }
  return {
    fullName: text(form, "fullName", 120, true, "पूरा नाम")!,
    designation: text(form, "designation", 120, true, "पद")!,
    shortBio: text(form, "shortBio", 300, false, "संक्षिप्त परिचय"),
    fullBio: text(form, "fullBio", 4000, false, "विस्तृत परिचय"),
    messageTitle: text(form, "messageTitle", 200, false, "संदेश शीर्षक"),
    message: text(form, "message", 4000, true, "संदेश")!,
    displayOrder,
    isVisible: bool(form, "isVisible"),
  };
}

const STATUSES: readonly KaryakartaStatus[] = ["PENDING", "APPROVED", "BLOCKED", "REJECTED", "INACTIVE"];

export function parsePassword(form: FormData, required: boolean): string | null {
  const raw = form.get("password");
  const value = typeof raw === "string" ? raw : "";
  if (!value) {
    if (required) throw new InputError("पासवर्ड आवश्यक है।");
    return null;
  }
  if (value.length < 8 || value.length > 72) throw new InputError("पासवर्ड 8 से 72 अक्षरों का होना चाहिए।");
  return value;
}

export function parsePhone(form: FormData, required: boolean): string | null {
  const phone = text(form, "phone", 15, required, "मोबाइल नंबर");
  if (phone && !/^[6-9]\d{9}$/.test(phone)) throw new InputError("मोबाइल नंबर 10 अंकों का मान्य भारतीय नंबर होना चाहिए।");
  return phone;
}

export function parseEmail(form: FormData): string | null {
  const email = text(form, "email", 160, false, "ईमेल")?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("ईमेल पता मान्य नहीं है।");
  return email;
}

export function parseKaryakartaForm(form: FormData) {
  const regNo = text(form, "regNo", 40, true, "पंजीकरण संख्या")!.toUpperCase();
  if (!/^[A-Z0-9/-]+$/.test(regNo)) throw new InputError("पंजीकरण संख्या में केवल अक्षर, अंक, - और / हो सकते हैं।");
  const statusRaw = text(form, "status", 20, true, "स्थिति") as KaryakartaStatus;
  if (!STATUSES.includes(statusRaw)) throw new InputError("स्थिति मान्य नहीं है।");

  return {
    regNo,
    name: text(form, "name", 120, true, "नाम")!,
    phone: parsePhone(form, true)!,
    email: parseEmail(form),
    designation: text(form, "designation", 120, false, "पद"),
    state: text(form, "state", 80, false, "राज्य"),
    zone: text(form, "zone", 80, false, "ज़ोन"),
    district: text(form, "district", 80, false, "ज़िला"),
    address: text(form, "address", 500, false, "पता"),
    dateOfBirth: date(form, "dateOfBirth", "जन्म तिथि"),
    joiningDate: date(form, "joiningDate", "जुड़ने की तिथि"),
    status: statusRaw,
    allowSelfEdit: bool(form, "allowSelfEdit"),
  };
}

export function parseSelfProfileForm(form: FormData) {
  return {
    phone: parsePhone(form, true)!,
    email: parseEmail(form),
    address: text(form, "address", 500, false, "पता"),
  };
}

export function uniqueConflictMessage(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String((error.meta?.target as string[] | string | undefined) ?? "");
    if (target.includes("regNo")) return "यह पंजीकरण संख्या पहले से मौजूद है।";
    if (target.includes("phone")) return "यह मोबाइल नंबर पहले से पंजीकृत है।";
    if (target.includes("email")) return "यह ईमेल पहले से पंजीकृत है।";
    return "यह जानकारी पहले से मौजूद है।";
  }
  return null;
}
