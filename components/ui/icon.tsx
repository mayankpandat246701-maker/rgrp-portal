type IconName =
  | "shield"
  | "upload"
  | "id-card"
  | "scan"
  | "eye"
  | "eye-off"
  | "lock"
  | "user"
  | "check";

type IconProps = {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 20 }: IconProps) {
  const sharedProps = {
    "aria-hidden": true as const,
    className: "shrink-0",
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: size,
  };

  switch (name) {
    case "shield":
      return (
        <svg {...sharedProps}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...sharedProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m17 8-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
      );
    case "id-card":
      return (
        <svg {...sharedProps}>
          <rect height="16" rx="2" width="20" x="2" y="4" />
          <circle cx="8" cy="10" r="2" />
          <path d="M5 16c.8-1.3 1.8-2 3-2s2.2.7 3 2" />
          <path d="M14 9h5M14 13h5" />
        </svg>
      );
    case "scan":
      return (
        <svg {...sharedProps}>
          <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
          <path d="M4 12h16" />
        </svg>
      );
    case "eye":
      return (
        <svg {...sharedProps}>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...sharedProps}>
          <path d="m3 3 18 18" />
          <path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.6 10.6 0 0 0 3-.4" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...sharedProps}>
          <rect height="11" rx="2" width="16" x="4" y="11" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "user":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      );
    case "check":
      return (
        <svg {...sharedProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
  }
}
