import type { NextConfig } from "next";

import { publicImageStoreHost } from "./lib/storage/public-image-host";

const isProduction = process.env.NODE_ENV === "production";
const scriptSource = isProduction
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

// Images are allowed only from this project's exact public Blob store host
// (derived from BLOB_PUBLIC_READ_WRITE_TOKEN). No wildcards: when the token
// is absent, no additional image origin is granted at all.
const publicImageHost = publicImageStoreHost(
  process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
);
const imageSource = publicImageHost
  ? `img-src 'self' data: blob: https://${publicImageHost}`
  : "img-src 'self' data: blob:";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  imageSource,
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