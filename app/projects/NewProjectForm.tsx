"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectForm() {
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          strategy: strategy.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to create project");
      }

      setName("");
      setStrategy("");

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
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">
              Project name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Mobile Banking App"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">
              Test strategy (optional)
            </label>
            <input
              type="text"
              value={strategy}
              onChange={(event) => setStrategy(event.target.value)}
              placeholder="e.g. Risk-based regression on critical journeys"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create project"}
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
