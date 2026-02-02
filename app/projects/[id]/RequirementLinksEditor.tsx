"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TestCaseOption = {
  id: string;
  title: string;
  suiteTitle: string;
};

type Props = {
  requirementId: string;
  initialLinkedIds: string[];
  allTestCases: TestCaseOption[];
};

export default function RequirementLinksEditor({
  requirementId,
  initialLinkedIds,
  allTestCases,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialLinkedIds),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const body = {
        testCaseIds: Array.from(selectedIds),
      };

      const response = await fetch(
        `/api/requirements/${encodeURIComponent(requirementId)}/test-cases`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to update links");
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

  const linkedCount = selectedIds.size;

  return (
    <div className="space-y-1 text-xs text-neutral-400">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          {linkedCount === 0
            ? "No linked test cases yet."
            : `${linkedCount} linked test case${linkedCount > 1 ? "s" : ""}.`}
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-0.5 text-[11px] font-medium text-neutral-100 hover:bg-neutral-900"
        >
          {open ? "Close" : "Edit links"}
        </button>
      </div>

      {open && (
        <div className="mt-1 rounded-md border border-neutral-800 bg-neutral-950/80 p-2">
          <div className="max-h-40 space-y-1 overflow-auto pr-1">
            {allTestCases.length === 0 ? (
              <div className="text-[11px] text-neutral-500">
                No test cases available in this project yet.
              </div>
            ) : (
              allTestCases.map((testCase) => (
                <label
                  key={testCase.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[11px] hover:bg-neutral-900"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-neutral-600 bg-neutral-950 text-neutral-100"
                    checked={selectedIds.has(testCase.id)}
                    onChange={() => toggleId(testCase.id)}
                  />
                  <span className="truncate">
                    <span className="text-neutral-400">{testCase.suiteTitle}</span>
                    <span className="text-neutral-600"> · </span>
                    <span className="text-neutral-100">{testCase.title}</span>
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            {error && (
              <span className="text-[10px] text-rose-400" title={error}>
                {error}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="ml-auto rounded-md bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save links"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
