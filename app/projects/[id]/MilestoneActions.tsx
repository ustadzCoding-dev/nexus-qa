"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  milestoneId: string;
  initialName: string;
  initialStartDate: string;
  initialEndDate: string;
};

export default function MilestoneActions({
  milestoneId,
  initialName,
  initialStartDate,
  initialEndDate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(() =>
    initialStartDate ? new Date(initialStartDate).toISOString().slice(0, 10) : "",
  );
  const [endDate, setEndDate] = useState(() =>
    initialEndDate ? new Date(initialEndDate).toISOString().slice(0, 10) : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const trimmedName = name.trim();

    if (!trimmedName || !startDate || !endDate) {
      setError("Name, start date, and end date are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update milestone");
      }

      setEditing(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    if (!window.confirm("Delete this milestone? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete milestone");
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
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="rounded-md border border-neutral-600 px-2 py-0.5 text-[11px] font-medium text-neutral-200 hover:bg-neutral-800"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="rounded-md border border-rose-700 px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {editing && (
        <form onSubmit={handleSubmit} className="space-y-1 text-[11px] text-neutral-200">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 h-7 rounded-md bg-neutral-100 px-2 text-[11px] font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
          {error && (
            <p className="text-[11px] text-rose-400" title={error}>
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
