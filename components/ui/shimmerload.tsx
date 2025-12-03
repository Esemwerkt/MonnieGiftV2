import React from "react";
import { LoaderFive } from "@/components/ui/loader";

export function LoaderFiveDemo({ text = "Maak iemand blij met een MonnieGift" }: { text?: string }) {
  return <LoaderFive text={text} />;
}
