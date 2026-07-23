/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false, compact = false, lang }: { className?: string; light?: boolean; compact?: boolean; lang?: string }) {
  const [imgError, setImgError] = useState(false);
  const showChinese = !lang || ["zh-CN","zh-TW","ja","ko"].includes(lang);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {imgError ? (
        // Fallback: jade gradient icon with 峯 character
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl jade-gradient shadow-lg text-white text-sm font-bold">
          峯
        </div>
      ) : (
        <img
          src="/images/logo-icon.png"
          alt="瑞峯"
          className="h-10 w-10 rounded-xl shadow-lg"
          onError={() => setImgError(true)}
        />
      )}
      {!compact && (
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <p className={cn("font-display text-lg font-semibold tracking-wide", light ? "text-rice-50" : "text-ink-900")}>
              {showChinese ? "瑞峯" : "RuiFeng"}
            </p>
            {showChinese && <p className={cn("text-sm font-medium tracking-wider", light ? "text-jade-300/80" : "text-jade-600")}>RuiFeng</p>}
          </div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.22em]", light ? "text-jade-300" : "text-jade-600")}>Private Bank</p>
        </div>
      )}
    </div>
  );
}
