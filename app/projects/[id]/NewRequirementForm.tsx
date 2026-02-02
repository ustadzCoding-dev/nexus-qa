"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
};

export default function NewRequirementForm({ projectId }: Props) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const trimmedCode = code.trim();
    const trimmedTitle = title.trim();

    if (!trimmedCode || !trimmedTitle) {
      setError("Code and title are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/requirements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: trimmedCode,
          title: trimmedTitle,
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to create requirement");
      }

      setCode("");
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
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
      <form onSubmit={handleSubmit} className="space-y-2 text-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[120px] flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">Code</label>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="REQ-001"
              className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="User can login with valid credentials"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex min-w-[260px] flex-[2] flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="High-level business rule or behavior"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add requirement"}
          </button>
        </div>
        {error && (
          <p className="text-xs text-rose-400" title={error}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
