"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  testCaseId: string;
  hasHistory: boolean;
};

export default function TestCaseActions({ testCaseId, hasHistory }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleDelete = async () => {
    if (deleting) return;

    if (!window.confirm("Delete this test case? Only test cases without execution history can be deleted.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete test case");
      }

      // After deletion, go back to the grid without a specific caseId to avoid pointing to a deleted case
      router.push("/test-case");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1 text-[11px]">
      {hasHistory ? (
        <span
          className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-400"
          title="This test case has execution history and cannot be deleted."
        >
          Has history
        </span>
      ) : (
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="rounded-md border border-rose-700 px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      )}
      {error && (
        <span className="truncate text-[11px] text-rose-400" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
