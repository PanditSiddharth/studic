
"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const logo = (
    <span
      className={`inline-block text-2xl font-tdb leading-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent ${textClassName}`}
    >
      Studic
    </span>
  );

  return (
    <div className={className}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="cursor-pointer"
          aria-label="Studic"
        >
          {logo}
        </button>
      ) : (
        <Link
          href={href}
          className="inline-flex items-center"
          aria-label="Studic home"
        >
          {logo}
        </Link>
      )}
    </div>
  );
}
