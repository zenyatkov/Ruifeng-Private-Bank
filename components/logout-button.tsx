"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";

export function LogoutButton({ light = false }: { light?: boolean }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  }

  return (
    <Button variant={light ? "ghost" : "secondary"} onClick={handleLogout} className={light ? "text-rice-200" : ""}>
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
