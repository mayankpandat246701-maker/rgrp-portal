import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const scriptSource = isProduction
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  scriptSource,
  "connect-src 'self'",
  "font-src 'self' data:",
  "media-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(), microphone=()",
  },
];
const hstsHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};

const privateNoStoreHeaders = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...(isProduction
        ? [
            {
              source: "/:path*",
              has: [
                {
                  type: "header" as const,
                  key: "x-forwarded-proto",
                  value: "https",
                },
              ],
              headers: [hstsHeader],
            },
          ]
        : []),
      {
        source: "/admin/:path*",
        headers: privateNoStoreHeaders,
      },
      ...[
        "/api/admin/:path*",
        "/api/auth/admin/:path*",
        "/api/karyakarta/upload",
        "/api/karyakarta/:id/generate-qr",
        "/api/verify-qr",
        "/api/application-status",
      ].map((source) => ({ source, headers: privateNoStoreHeaders })),
    ];
  },
};

export default nextConfig;
