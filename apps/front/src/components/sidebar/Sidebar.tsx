"use client";
import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";

import agloLogo from "./image/aglo-logo.svg";
import { SvgDashboard, SvgNovaContagem, SvgRelatorios } from "./image/Icons";

export function Sidebar() {
  const pathname = usePathname();

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? "bg-[#137FEC1A] text-[#137FEC]"
      : "text-[#475569] hover:bg-[#137FEC1A] hover:text-[#137FEC]";
  };

  return (
    <aside className="h-screen w-64 bg-white p-4 border-r border-gray-200 flex flex-col">
      <div className="flex text-base font-bold text-[#137FEC] items-center mb-6 mt-4 gap-[10px]">
        <Image src={agloLogo} width={36} height={36} alt="Aglo" />
        <span>Aglo</span>
      </div>

      <nav className="flex flex-col gap-2">
        <Link href="/" className={`p-3 text-base rounded-md transition duration-200 flex gap-[17px] items-center ${getLinkStyle('/')}`}>
          <SvgDashboard/>
          Dashboard
        </Link>

        <Link href="/nova-contagem" className={`p-3 text-base rounded-md transition duration-200 flex gap-[14px] items-center ${getLinkStyle('/nova-contagem')}`}>
          <SvgNovaContagem />
          Nova contagem
        </Link>

        <Link href="/relatorios" className={`p-3 text-base rounded-md transition duration-200 flex gap-[16px] items-center ${getLinkStyle('/relatorios')}`}>
          <SvgRelatorios />
          Relatórios
        </Link>
      </nav>
    </aside>
  );
}
