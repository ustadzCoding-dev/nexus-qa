"use client";

import { useState } from "react";

const STATUS_OPTIONS = ["PASSED", "FAILED", "BLOCKED", "SKIPPED", "UNTESTED"] as const;

type Status = (typeof STATUS_OPTIONS)[number];

type Props = {
  resultId: string;
  initialStatus: Status;
  initialActualResult: string | null;
};

export default function ResultStatusControl({
  resultId,
  initialStatus,
  initialActualResult,
}: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [actualResult, setActualResult] = useState<string>(initialActualResult ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangeStatus = async (nextStatus: Status) => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/test-results/${resultId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          actualResult: actualResult || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update result");
      }

      const data = (await response.json()) as {
        result?: { status?: Status; actualResult?: string | null };
      };

      if (data.result?.status) {
        setStatus(data.result.status);
      }
      if (typeof data.result?.actualResult === "string") {
        setActualResult(data.result.actualResult);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleBlurActual = async () => {
    await handleChangeStatus(status);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          value={status}
          disabled={saving}
          onChange={(event) => handleChangeStatus(event.target.value as Status)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {saving && <span className="text-[11px] text-neutral-400">Saving…</span>}
      </div>
      <textarea
        className="min-h-[40px] w-full resize-y rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
        placeholder="Actual result / notes"
        value={actualResult}
        onChange={(event) => setActualResult(event.target.value)}
        onBlur={handleBlurActual}
      />
      {error && (
        <span className="text-[11px] text-rose-400" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
