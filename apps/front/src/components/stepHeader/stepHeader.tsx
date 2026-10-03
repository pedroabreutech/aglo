'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import arrow from "./image/arrow-vc.svg";
import { IHeader } from '@/src/app/types/IHeader';

const steps = [
  { name: 'Eventos', href: '/eventos' },
  { name: 'Criar nova contagem', href: '/nova-contagem' },
  { name: 'Análise', href: '/nova-contagem/analise' },
  { name: 'Relatório', href: '/relatorios' },
];

export default function StepHeader({ textColor = "text-[#64748B]" } : IHeader) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isActive = pathname === step.href;

        const isLast = index === steps.length - 1;

        return (
          <div key={step.name} className="flex items-center gap-2">
            {index === 0 ? (
              <span
                className={`text-sm font-light transition-colors ${
                  isActive ? 'text-[#137FEC]' : `${textColor}`
                }`}
              >
                {step.name}
              </span>
            ) : (
              <Link
                href={step.href}
                className={`text-sm font-light transition-colors ${
                  isActive ? 'text-[#137FEC]' : `${textColor}`
                }`}
              >
                {step.name}
              </Link>
            )}

            {!isLast && (
              <span className={`${textColor} text-xs`}> <Image src={arrow} height={20} alt=''/> </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
