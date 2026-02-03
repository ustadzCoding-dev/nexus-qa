"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type TestCaseOption = {
  id: string;
  title: string;
  suiteTitle: string;
  projectName: string;
};

type Props = {
  testCases: TestCaseOption[];
};

export default function NewManualRunForm({ testCases }: Props) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("Manual");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const toggleSelection = (id: string) => {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    if (selectedIds.size === 0) {
      setError("Select at least one test case");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/test-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          environment: environment.trim() || undefined,
          testCaseIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to create manual run");
      }

      const data = (await response.json()) as { runId?: string };

      if (data.runId) {
        router.push(`/execution?runId=${data.runId}`);
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (testCases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-4 py-3 text-xs text-neutral-400">
        No test cases available to create a manual run.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-xs">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-300">Run name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Manual run - Login smoke"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex min-w-[180px] flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-300">Environment</label>
            <input
              type="text"
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
              placeholder="Manual / Staging / Prod"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="h-8 rounded-md bg-neutral-100 px-3 text-[11px] font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create manual run"}
          </button>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-medium text-neutral-300">Select test cases</div>
          <div className="max-h-48 space-y-1 overflow-auto rounded-md border border-neutral-800 bg-neutral-950/80 p-2">
            {testCases.map((tc) => {
              const checked = selectedIds.has(tc.id);

              return (
                <label
                  key={tc.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-[11px] hover:bg-neutral-900"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3 w-3 rounded border-neutral-600 bg-neutral-950 text-neutral-100"
                    checked={checked}
                    onChange={() => toggleSelection(tc.id)}
                  />
                  <span className="flex-1">
                    <span className="block font-medium text-neutral-100">{tc.title}</span>
                    <span className="block text-[10px] text-neutral-500">
                      {tc.projectName} · {tc.suiteTitle}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-rose-400" title={error}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
