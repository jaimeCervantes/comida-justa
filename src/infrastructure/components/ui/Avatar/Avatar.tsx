"use client";
import React from "react";
import * as AvatarR from "@radix-ui/react-avatar";
import { User } from "next-auth";
import { useInitials } from "./hooks";

export default function Avatar({ user }: { user?: User }) {
  const initials = useInitials(user?.name);

  return (
    <AvatarR.Root className="bg-blackA1 inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full align-middle">
      <AvatarR.Image
        className="h-full w-full rounded-[inherit] object-cover"
        src={user?.image!}
        alt={user?.name!}
      />
      <AvatarR.Fallback
        className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
        delayMs={600}
      >
        {initials}
      </AvatarR.Fallback>
    </AvatarR.Root>
  );
}
