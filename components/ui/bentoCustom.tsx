"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "./bento-grid";
import {
  IconBoxAlignRightFilled,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";
import { motion } from "motion/react";


export function BentoGridThirdDemo() {
  return (
    <BentoGrid className="max-w-4xl mx-auto gap-12 md:gap-4 md:auto-rows-[20rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}

const SkeletonOne = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex px-4 flex-1 w-full h-full min-h-[6rem] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-border p-2  items-center space-x-2 bg-background"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
        <div className="w-full bg-muted h-4 rounded-full" />
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-border p-2 items-center space-x-2 w-3/4 ml-auto bg-background"
      >
        <div className="w-full bg-muted h-4 rounded-full" />
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-border p-2 items-center space-x-2 bg-background"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
        <div className="w-full bg-muted h-4 rounded-full" />
      </motion.div>
    </motion.div>
  );
};
const SkeletonTwo = () => {
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: "100%",
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ["0%", "100%"],
      transition: {
        duration: 2,
      },
    },
  };
  const arr = new Array(6).fill(0);
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-black/[0.2] flex-col space-y-2"
    >
      {arr.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxWidth: Math.random() * (100 - 40) + 40 + "%",
          }}
          className="flex flex-row rounded-full border border-border p-2  items-center space-x-2 bg-muted w-full h-4"
        ></motion.div>
      ))}
    </motion.div>
  );
};
const SkeletonThree = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-dot-black/[0.2] flex-col space-y-2"
      style={{
        background:
          "linear-gradient(-45deg, #d4b483, #556b68)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="h-full w-full rounded-lg"></motion.div>
    </motion.div>
  );
};
const SkeletonFour = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-black/[0.2] flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl bg-background p-4 border border-border flex flex-col items-center justify-center"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
        <p className="sm:text-sm text-xs text-center font-semibold text-muted-foreground mt-4">
          Kies bedrag
        </p>
        <p className="border border-primary bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mt-4">
          Stap 1
        </p>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-background p-4 border border-border flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
        <p className="sm:text-sm text-xs text-center font-semibold text-muted-foreground mt-4">
          Voeg bericht toe
        </p>
        <p className="border border-primary bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mt-4">
          Stap 2
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-background p-4 border border-border flex flex-col items-center justify-center"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
        <p className="sm:text-sm text-xs text-center font-semibold text-muted-foreground mt-4">
          Betaal & Verstuur
        </p>
        <p className="border border-primary bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mt-4">
          Stap 3
        </p>
      </motion.div>
    </motion.div>
  );
};
const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-border p-2  items-start space-x-2 bg-background"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Voeg een leuk bericht toe aan je cadeau en kies een animatie...
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-border p-2 items-center justify-end space-x-2 w-3/4 ml-auto bg-background"
      >
        <p className="text-xs text-muted-foreground">Versturen! 🎁</p>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-primary/80 shrink-0" />
      </motion.div>
    </motion.div>
  );
};
const items = [
  {
    title: "Verstuur Geld in 3 Stappen",
    description: (
      <span className="text-sm">
        Eenvoudig geld versturen aan iemand die je liefhebt met MonnieGift. Kies een bedrag, voeg een persoonlijk bericht toe en betaal veilig.
      </span>
    ),
    header: <SkeletonOne />,
    className: "md:col-span-1",
    icon: <IconClipboardCopy className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Direct op de Bankrekening",
    description: (
      <span className="text-sm">
        De ontvanger krijgt het geld direct op de bankrekening gestort via Stripe Connect en ABN AMRO.
      </span>
    ),
    header: <SkeletonTwo />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Veilig en Betrouwbaar",
    description: (
      <span className="text-sm">
        100% veilige betalingen via iDEAL en Stripe. Jouw gegevens zijn altijd beschermd.
      </span>
    ),
    header: <SkeletonThree />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Geen Account Nodig",
    description: (
      <span className="text-sm">
        Verstuur en ontvang cadeaus zonder inloggen. Alleen een authenticatiecode is nodig om je cadeau op te halen.
      </span>
    ),
    header: <SkeletonFour />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-muted-foreground" />,
  },

  {
    title: "Persoonlijke Touch",
    description: (
      <span className="text-sm">
        Voeg een persoonlijk bericht en kies een leuke animatie om je cadeau extra speciaal te maken.
      </span>
    ),
    header: <SkeletonFive />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-muted-foreground" />,
  },
];
