"use client";

import { ITitle } from "@/src/app/types/ITitle";

export default function MainTitle({ text } : ITitle) {
  return <h1 className="text-2xl font-bold text-[#0F172A]">{text}</h1>;
}
