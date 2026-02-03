"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  suiteId: string;
};

export default function SuiteActions({ suiteId }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleDelete = async () => {
    if (deleting) return;

    if (!window.confirm("Delete this suite? Suites with test cases cannot be deleted.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/suites/${suiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete suite");
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-1 text-[11px]">
      <button
        type="button"
        disabled={deleting}
        onClick={handleDelete}
        className="rounded-md border border-rose-700 px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete suite"}
      </button>
      {error && (
        <p className="text-[11px] text-rose-400" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}
