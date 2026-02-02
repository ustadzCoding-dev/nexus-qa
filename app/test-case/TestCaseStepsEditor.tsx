"use client";

import { useState } from "react";

type Step = {
  id: string;
  order: number;
  action: string;
  expected: string;
};

type Props = {
  testCaseId: string;
  initialSteps: Step[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function TestCaseStepsEditor({ testCaseId, initialSteps }: Props) {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [status, setStatus] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onChangeStep = (id: string, field: "action" | "expected", value: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id
          ? {
              ...step,
              [field]: value,
            }
          : step,
      ),
    );
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (steps.length === 0) return;

    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          steps: steps.map((step) => ({
            id: step.id,
            action: step.action,
            expected: step.expected,
          })),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to save changes");
      }

      const data = (await response.json()) as { steps?: Step[] };

      if (Array.isArray(data.steps)) {
        setSteps(data.steps);
      }

      setStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus("error");
      setErrorMessage(message);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/60 px-6 py-8 text-center text-sm text-neutral-400">
        This test case has no steps yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Steps</span>
        <div className="flex items-center gap-2">
          {status === "saving" && <span className="text-neutral-300">Saving…</span>}
          {status === "saved" && <span className="text-emerald-400">Saved</span>}
          {status === "error" && errorMessage && (
            <span className="max-w-xs truncate text-rose-400" title={errorMessage}>
              {errorMessage}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-[11px] font-medium text-neutral-100 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/60">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-neutral-900/80 text-[11px] uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="w-12 px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Action</th>
              <th className="px-3 py-2 text-left font-medium">Expected</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <tr
                key={step.id}
                className="border-t border-neutral-800/80 hover:bg-neutral-900/80"
              >
                <td className="px-3 py-2 align-top text-right tabular-nums text-neutral-400">
                  {step.order}
                </td>
                <td className="px-3 py-2 align-top text-neutral-100">
                  <textarea
                    className="min-h-[40px] w-full resize-y rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
                    value={step.action}
                    onChange={(event) => onChangeStep(step.id, "action", event.target.value)}
                  />
                </td>
                <td className="px-3 py-2 align-top text-neutral-200">
                  <textarea
                    className="min-h-[40px] w-full resize-y rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
                    value={step.expected}
                    onChange={(event) => onChangeStep(step.id, "expected", event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
