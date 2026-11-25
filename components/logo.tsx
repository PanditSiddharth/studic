
"use client";

import Image from "next/image";
import Link from "next/link";

interface StudicLogoProps {
  className?: string;
  textClassName?: string;
  href?: string;
  onClick?: () => void;
}

export default function StudicLogo({
  className = "",
  textClassName = "",
  href = "/",
  onClick,
}: StudicLogoProps) {
  const logo = (
    <>
      <Image
        src="/studic-neon-orbit-logo.png"
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
      <span className={`inline-block font-tdb leading-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent ${textClassName}`}>
        Studic
      </span>
    </>
  );

  const classNames = `inline-flex items-center gap-2.5 ${className}`;

  return onClick ? (
    <button type="button" onClick={onClick} className={`${classNames} cursor-pointer`} aria-label="Studic">
      {logo}
    </button>
  ) : (
    <Link href={href} className={classNames} aria-label="Studic home">
      {logo}
    </Link>
  );
}
