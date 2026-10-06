const RATE_LIMITED_MESSAGE =
  "बहुत अधिक प्रयास किए गए हैं। कृपया कुछ समय बाद फिर से प्रयास करें।";

const FALLBACK_MESSAGE =
  "दस्तावेज़ अपलोड नहीं हो सके। कृपया जानकारी और फ़ाइलें जाँचकर फिर प्रयास करें।";

const CODE_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: "फ़ाइल का आकार अनुमत सीमा (2 MB) से अधिक है।",
  UNSUPPORTED_MEDIA_TYPE:
    "फ़ाइल का प्रकार समर्थित नहीं है। फोटो के लिए JPG/PNG और आधार दस्तावेज़ के लिए JPG/PNG/PDF चुनें।",
  INVALID_FILE_CONTENT:
    "फ़ाइल की सामग्री मान्य नहीं है। कृपया दूसरी फ़ाइल चुनकर फिर प्रयास करें।",
  EMPTY_FILE: "चयनित फ़ाइल खाली है।",
  INVALID_FILE_INPUT: "फ़ाइल सही ढंग से नहीं चुनी गई है।",
  MALFORMED_FORM_DATA: "अनुरोध सही नहीं है। पृष्ठ रीफ़्रेश कर फिर प्रयास करें।",
  APPLICATION_REFERENCE_REQUIRED: "आवेदन संदर्भ संख्या आवश्यक है।",
  INVALID_APPLICATION_REFERENCE: "आवेदन संदर्भ संख्या सही नहीं है।",
  MOBILE_REQUIRED: "पंजीकृत मोबाइल नंबर आवश्यक है।",
  INVALID_MOBILE_NUMBER: "पंजीकृत मोबाइल नंबर सही नहीं है।",
  DOCUMENT_TYPE_REQUIRED: "कम से कम एक दस्तावेज़ (फोटो या आधार) चुनें।",
  UPLOAD_SERVICE_UNAVAILABLE:
    "अपलोड सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।",
  UPLOAD_FAILED: FALLBACK_MESSAGE,
};

export function acquireUploadLock(lock: { current: boolean }): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function getUploadErrorMessage(
  status: number,
  responseBody: unknown,
): string {
  if (status === 429) {
    if (
      typeof responseBody === "object" &&
      responseBody !== null &&
      "retryAfterSeconds" in responseBody &&
      typeof responseBody.retryAfterSeconds === "number" &&
      Number.isFinite(responseBody.retryAfterSeconds) &&
      responseBody.retryAfterSeconds > 0
    ) {
      const totalSeconds = Math.ceil(responseBody.retryAfterSeconds);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const waitTime = [
        ...(minutes > 0 ? [`${minutes} मिनट`] : []),
        ...(seconds > 0 ? [`${seconds} सेकंड`] : []),
      ].join(" ");

      return `${RATE_LIMITED_MESSAGE} कृपया ${waitTime} बाद फिर से प्रयास करें।`;
    }

    return RATE_LIMITED_MESSAGE;
  }

  if (
    typeof responseBody === "object" &&
    responseBody !== null &&
    "code" in responseBody &&
    typeof responseBody.code === "string" &&
    CODE_MESSAGES[responseBody.code]
  ) {
    return CODE_MESSAGES[responseBody.code];
  }

  if (
    typeof responseBody === "object" &&
    responseBody !== null &&
    "error" in responseBody &&
    typeof responseBody.error === "string"
  ) {
    return responseBody.error;
  }

  return FALLBACK_MESSAGE;
}
