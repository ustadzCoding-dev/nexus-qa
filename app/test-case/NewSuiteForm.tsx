"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
};

export default function NewSuiteForm({ projectId }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Suite title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/suites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to create suite");
      }

      setTitle("");
      setDescription("");

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-3 text-xs text-neutral-200">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-[11px] font-medium text-neutral-300">New suite</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Login Suite"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          />
        </div>
        <div className="flex min-w-[200px] flex-[2] flex-col gap-1">
          <label className="text-[11px] font-medium text-neutral-300">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="High-level grouping, e.g. Authentication"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-8 rounded-md bg-neutral-100 px-3 text-[11px] font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add suite"}
        </button>
        {error && (
          <p className="w-full text-[11px] text-rose-400" title={error}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
