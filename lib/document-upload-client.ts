const RATE_LIMITED_MESSAGE =
  "बहुत अधिक प्रयास किए गए हैं। कृपया कुछ समय बाद फिर से प्रयास करें।";

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
    "error" in responseBody &&
    typeof responseBody.error === "string"
  ) {
    return responseBody.error;
  }

  return "दस्तावेज़ अपलोड नहीं हो सके। कृपया जानकारी और फ़ाइलें जाँचकर फिर प्रयास करें।";
}
