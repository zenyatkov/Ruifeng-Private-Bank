"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function DeleteBeneficiaryButton({ id }: { id: number }) {
  const router = useRouter();
  async function onDelete() {
    await fetch(`/api/beneficiaries?id=${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button type="button" variant="danger" className="px-3 py-1.5 text-xs" onClick={onDelete}>
      Remove
    </Button>
  );
}
