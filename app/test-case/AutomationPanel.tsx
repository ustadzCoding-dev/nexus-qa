"use client";

import { useState } from "react";

type Props = {
  testCaseId: string;
  initialAutomationYaml?: string | null;
};

export default function AutomationPanel({
  testCaseId,
  initialAutomationYaml,
}: Props) {
  const [yaml, setYaml] = useState<string>(initialAutomationYaml ?? "");
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (status === "generating") return;

    setStatus("generating");
    setError(null);

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}/maestro`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to generate Maestro YAML");
      }

      const data = (await response.json()) as { automationYaml?: string };

      if (typeof data.automationYaml === "string") {
        setYaml(data.automationYaml);
      }

      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <section className="mt-4 space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3 text-xs text-neutral-300">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Maestro automation
          </h3>
          <p className="text-[11px] text-neutral-500">
            Generate a simple Maestro-compatible YAML from the current manual steps.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={status === "generating"}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-[11px] font-medium text-neutral-100 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "generating" ? "Generating…" : "Generate Maestro YAML"}
          </button>
          {yaml && (
            <a
              href={`/api/test-cases/${testCaseId}/export-maestro`}
              className="text-[11px] text-sky-300 hover:underline"
            >
              Download .yaml
            </a>
          )}
          {status === "error" && error && (
            <span className="max-w-xs truncate text-[10px] text-rose-400" title={error}>
              {error}
            </span>
          )}
        </div>
      </div>

      <div className="max-h-64 overflow-auto rounded-md border border-neutral-800 bg-neutral-950/80 p-2 font-mono text-[11px] leading-snug text-neutral-100">
        {yaml ? (
          <pre className="whitespace-pre-wrap">{yaml}</pre>
        ) : (
          <span className="text-neutral-500">No YAML generated yet.</span>
        )}
      </div>
    </section>
  );
}
