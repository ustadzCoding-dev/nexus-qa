"use client";

import { useState } from "react";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

type Status = (typeof STATUS_OPTIONS)[number];

type Props = {
  defectId: string;
  initialStatus: string;
};

export default function DefectStatusSelect({ defectId, initialStatus }: Props) {
  const initial =
    STATUS_OPTIONS.find((value) => value === initialStatus) ?? "OPEN";

  const [status, setStatus] = useState<Status>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (next: Status) => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/defects/${defectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: next }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Failed to update defect status");
      }

      setStatus(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={status}
        disabled={saving}
        onChange={(event) => handleChange(event.target.value as Status)}
        className="w-32 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {saving && (
        <span className="text-[10px] text-neutral-400">Saving…</span>
      )}
      {error && (
        <span className="text-[10px] text-rose-400" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
