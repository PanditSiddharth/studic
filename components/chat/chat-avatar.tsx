"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatKind } from "@/modals/chat.model";
import { cn } from "@/modals/utils";
import { avatarTone, initials } from "./chat-utils";

interface ChatAvatarProps {
  name: string;
  image?: string;
  kind?: ChatKind;
  seed?: string;
  className?: string;
  fallbackClassName?: string;
}

export default function ChatAvatar({
  name,
  image,
  kind = "direct",
  seed,
  className,
  fallbackClassName,
}: ChatAvatarProps) {
  const isGroup = kind === "group";
  return (
    <Avatar className={cn("h-11 w-11 border", className)}>
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br text-[13px] font-semibold text-white",
          avatarTone(seed || name),
          fallbackClassName
        )}
      >
        {isGroup ? <Users size={18} /> : initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
