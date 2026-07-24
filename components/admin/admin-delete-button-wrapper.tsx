"use client";

import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { useRouter } from "next/navigation";

export function AdminDeleteButtonWrapper({
  type,
  id,
  label,
}: {
  type: "receipt" | "loan" | "account" | "bill_payment" | "notification" | "transaction" | "card" | "investment" | "beneficiary" | "ticket";
  id: number;
  label?: string;
}) {
  const router = useRouter();
  return <AdminDeleteButton type={type} id={id} label={label} onSuccess={() => router.refresh()} />;
}
