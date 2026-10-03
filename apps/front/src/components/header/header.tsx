"use client";

import Image from "next/image";
import infoSvg from "./image/info.svg"
import StepHeader from "../stepHeader/stepHeader";
import agloLogo from "../sidebar/image/aglo-logo.svg";

export function Header() {
  return (
    <header className="h-16 bg-white border-1 border-[#137FEC1A] px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 pr-8">
          <Image src={agloLogo} width={39} height={39} alt="Aglo" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#0F172A] leading-tight">Contagem automática</h1>
            <StepHeader textColor="text-[#94A3B8]"/> 
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Image src={infoSvg} width={20} height={20} className="rounded-full border" alt="" />
      </div>
    </header>
  );
}
