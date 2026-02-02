"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  suiteId: string;
};

export default function NewTestCaseInlineForm({ suiteId }: Props) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Test case title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/suites/${suiteId}/test-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to create test case");
      }

      const data = (await response.json()) as {
        testCase?: { id: string };
      };

      setTitle("");

      const newId = data.testCase?.id;

      if (newId) {
        router.push(`/test-case?caseId=${newId}`);
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 px-2 pb-1 pt-0.5">
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add test case..."
        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
      {error && (
        <span className="ml-2 text-[10px] text-rose-400" title={error}>
          !
        </span>
      )}
    </form>
  );
}
