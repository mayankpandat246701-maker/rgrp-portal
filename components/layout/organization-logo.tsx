import Image from "next/image";

type OrganizationLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function OrganizationLogo({
  className,
  width = 56,
  height = 56,
  priority = false,
}: OrganizationLogoProps) {
  return (
    <Image
      src="/images/rgrp-logo.png"
      alt="राष्ट्रीय गौ रक्षा परिषद का आधिकारिक लोगो"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}