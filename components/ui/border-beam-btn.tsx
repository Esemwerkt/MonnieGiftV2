"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { BorderBeam } from "./border-beam"

export function BtnBeam() {
  return (
    <Link
      href="/maak-gift"
      className="relative border group inline-flex items-center gap-3 sm:gap-4 px-8 py-4 bg-primary text-primary-foreground rounded-xl sm:rounded-2xl hover:bg-primary/90 transition-all duration-200 font-bold text-lg overflow-hidden"
    >
      Maak een MonnieGift
      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 group-hover:translate-x-1 transition-transform" />
      <BorderBeam
        size={100}
        duration={5}
        borderWidth={2}
        colorFrom="#feca57"
        colorTo="#ff9ff3"
      />
    </Link>
  )
}
