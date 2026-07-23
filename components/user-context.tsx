"use client";

import { createContext, useContext, type ReactNode } from "react";

type UserPrefs = { lang: string; currency: string; firstName: string; lastName: string };

const UserPrefsContext = createContext<UserPrefs>({ lang: "en", currency: "SGD", firstName: "", lastName: "" });

export function UserPrefsProvider({ value, children }: { value: UserPrefs; children: ReactNode }) {
  return <UserPrefsContext.Provider value={value}>{children}</UserPrefsContext.Provider>;
}

export function useUserPrefs() {
  return useContext(UserPrefsContext);
}
