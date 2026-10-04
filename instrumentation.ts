import { validateProductionEnvironment } from "@/lib/env";

export function register(): void {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    validateProductionEnvironment();
  }
}
