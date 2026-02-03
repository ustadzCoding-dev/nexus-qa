"use client";

import { useState } from "react";

type Props = {
  testCaseId: string;
  initialPreCondition: string | null;
  initialPostCondition: string | null;
  initialPriority: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function TestCaseDetailsEditor({
  testCaseId,
  initialPreCondition,
  initialPostCondition,
  initialPriority,
}: Props) {
  const [preCondition, setPreCondition] = useState(initialPreCondition ?? "");
  const [postCondition, setPostCondition] = useState(initialPostCondition ?? "");
  const [priority, setPriority] = useState(initialPriority || "P2");
  const [status, setStatus] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (status === "saving") return;

    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preCondition: preCondition.trim() || null,
          postCondition: postCondition.trim() || null,
          priority,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update test case");
      }

      setStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus("error");
      setErrorMessage(message);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 text-xs text-neutral-300">
      <div className="flex flex-wrap justify-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Priority
          </label>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="min-w-[80px] rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[220px]">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Pre-condition
          </label>
          <textarea
            value={preCondition}
            onChange={(event) => {
              setPreCondition(event.target.value);
              setStatus("idle");
              setErrorMessage(null);
            }}
            rows={2}
            className="min-h-[40px] w-full resize-y rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[220px]">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Post-condition
          </label>
          <textarea
            value={postCondition}
            onChange={(event) => {
              setPostCondition(event.target.value);
              setStatus("idle");
              setErrorMessage(null);
            }}
            rows={2}
            className="min-h-[40px] w-full resize-y rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        {status === "saving" && <span className="text-neutral-300">Saving</span>}
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
          {status === "saving" ? "Saving" : "Save details"}
        </button>
      </div>
    </div>
  );
}
