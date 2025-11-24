import React from "react";
import logo from "../assets/logo.png";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur bg-white/80 dark:bg-zinc-950/70">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center">
              <img src={logo} alt="ToolSight logo" className="h-6 w-auto object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">ToolSight</div>
              <div className="text-xs text-zinc-500">for Teng Tools</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}