/**
 * Canonical handling for a karyakarta's registered mobile number.
 *
 * `Karyakarta.phone` is stored free-form — the admin form accepts
 * `/^[0-9+()\-\s]{7,24}$/`, so values such as "+91 98765 43210" or
 * "98765-43210" are all valid at rest. Comparing raw strings would therefore
 * reject a correct number typed in a different shape, so every comparison
 * goes through the canonical digit form produced here.
 *
 * This module is deliberately isomorphic (no `server-only` marker): the login
 * route and the login form must apply exactly the same rule, or the client
 * would report a number as valid that the server then rejects.
 */

const COUNTRY_CODE = "91";
const COUNTRY_CODE_LENGTH = COUNTRY_CODE.length;
const INDIAN_MOBILE_LENGTH = 10;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Returns the 10-digit Indian mobile number contained in `value`, or null
 * when `value` cannot be read as one.
 *
 * Non-digits are ignored, and a "91" country-code prefix on an otherwise
 * complete number is dropped. This matches the convention already used by the
 * document-upload identity check (`lib/karyakarta-upload-handler.ts`), so
 * every part of the portal reads a mobile number the same way.
 */
export function normalizeIndianMobile(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let digits = value.replace(/\D/g, "");

  if (
    digits.length === INDIAN_MOBILE_LENGTH + COUNTRY_CODE_LENGTH &&
    digits.startsWith(COUNTRY_CODE)
  ) {
    digits = digits.slice(COUNTRY_CODE_LENGTH);
  }

  return INDIAN_MOBILE_PATTERN.test(digits) ? digits : null;
}

/**
 * True only when both representations describe the same registered mobile
 * number.
 *
 * An unreadable number never matches, not even another unreadable one: without
 * that guard two landline-style values would compare as `null === null` and
 * authenticate each other.
 */
export function isSameIndianMobile(left: string, right: string): boolean {
  const normalizedLeft = normalizeIndianMobile(left);
  if (normalizedLeft === null) return false;

  return normalizedLeft === normalizeIndianMobile(right);
}
