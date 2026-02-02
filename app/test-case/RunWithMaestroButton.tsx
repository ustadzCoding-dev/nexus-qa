"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  testCaseId: string;
};

export default function RunWithMaestroButton({ testCaseId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/maestro/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "case",
          caseId: testCaseId,
          environment: "Maestro default",
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to start Maestro run");
      }

      const data = (await response.json()) as { runId?: string };

      if (data.runId) {
        router.push(`/execution?runId=${data.runId}`);
      } else {
        throw new Error("Missing runId in response");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-[11px] font-medium text-neutral-100 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Running with Maestro…" : "Run with Maestro"}
      </button>
      {error && (
        <span className="max-w-xs truncate text-[10px] text-rose-400" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
