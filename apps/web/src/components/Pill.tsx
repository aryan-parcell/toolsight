import React from "react";
import { cn } from "@/lib/utils";

export function Pill({ color, children }: { color: "green" | "red" | "amber" | "zinc"; children: React.ReactNode }) {
    const map = {
        green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
        red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        zinc: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200",
    };

    return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", map[color])}>{children}</span>;
}