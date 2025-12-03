"use client";

import Link from "next/link";
import { Gift, GiftIcon } from "lucide-react";

export function Header() {
  return (
    <header className="relative w-full bg-background border-b py-3 z-50">
      <div className="max-w-[1440px] mx-auto h-full px-4 flex items-center justify-center">
        {/* Logo - Centered */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-[25px] h-[23px] flex items-center justify-center">
            <Gift className="w-full h-full text-[#DDBC7C] stroke-2" />
          </div>
          <span
            className="text-foreground text-[26px] leading-[26px] font-normal"
          >
            MonnieGift
          </span>
        </Link>
      </div>
    </header>
  );
}
