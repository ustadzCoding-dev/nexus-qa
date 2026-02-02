"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const SEVERITY_OPTIONS = ["Critical", "Major", "Minor"] as const;

type Props = {
  defectId: string;
  initialTitle: string;
  initialSeverity: string;
  initialDescription: string | null;
  initialEvidenceUrl: string | null;
};

export default function DefectDetailsEditor({
  defectId,
  initialTitle,
  initialSeverity,
  initialDescription,
  initialEvidenceUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [severity, setSeverity] = useState(initialSeverity || "Major");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(initialEvidenceUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/defects/${defectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          severity: severity.trim() || "Major",
          description: description.trim() || null,
          evidenceUrl: evidenceUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to update defect");
      }

      router.refresh();
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const normalizedSeverity = SEVERITY_OPTIONS.find(
    (option) => option.toLowerCase() === severity.toLowerCase(),
  );

  return (
    <div className="space-y-1 text-[11px] text-neutral-400">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-0.5 text-[11px] font-medium text-neutral-100 hover:bg-neutral-900"
      >
        {open ? "Cancel edit" : "Edit details"}
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-1 space-y-2 rounded-md border border-neutral-800 bg-neutral-950/80 p-2"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[120px] flex-1 flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Severity
              </label>
              <select
                value={normalizedSeverity ?? severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-[160px] flex-1 flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Evidence URL
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                placeholder="https://..."
                className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            {error && (
              <span className="text-[10px] text-rose-400" title={error}>
                {error}
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto rounded-md bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
