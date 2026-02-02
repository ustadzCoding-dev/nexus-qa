"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type TestDataItem = {
  id: string;
  key: string;
  value: string;
};

type Props = {
  projectId: string;
  initialItems: TestDataItem[];
};

export default function ProjectTestDataSection({ projectId, initialItems }: Props) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (savingNew) return;

    const trimmedKey = newKey.trim();
    const trimmedValue = newValue.trim();

    if (!trimmedKey || !trimmedValue) {
      setError("Key and value are required");
      return;
    }

    setSavingNew(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/test-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: trimmedKey,
          value: trimmedValue,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to create test data");
      }

      setNewKey("");
      setNewValue("");

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSavingNew(false);
    }
  };

  const startEdit = (item: TestDataItem) => {
    setEditingId(item.id);
    setEditKey(item.key);
    setEditValue(item.value);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditKey("");
    setEditValue("");
  };

  const handleEditSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingId) return;

    const trimmedKey = editKey.trim();
    const trimmedValue = editValue.trim();

    if (!trimmedKey || !trimmedValue) {
      setError("Key and value are required");
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/test-data/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: trimmedKey,
          value: trimmedValue,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update test data");
      }

      cancelEdit();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId || !window.confirm("Delete this test data entry?")) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/test-data/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete test data");
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 text-sm">
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">Key</label>
            <input
              type="text"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
              placeholder="e.g. valid_user_email"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex min-w-[220px] flex-[2] flex-col gap-1">
            <label className="text-xs font-medium text-neutral-300">Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              placeholder="e.g. qa.user@example.com / password123"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={savingNew}
            className="h-9 rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingNew ? "Adding..." : "Add test data"}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-rose-400" title={error}>
            {error}
          </p>
        )}
      </div>

      {initialItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-6 text-center text-sm text-neutral-400">
          No test data entries yet for this project.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-neutral-900/80">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-neutral-300">Key</th>
                <th className="px-4 py-2 text-left font-medium text-neutral-300">Value</th>
                <th className="px-4 py-2 text-right font-medium text-neutral-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialItems.map((item) => {
                const isEditing = item.id === editingId;
                const isDeleting = item.id === deletingId;

                return (
                  <tr
                    key={item.id}
                    className="border-t border-neutral-800/80 hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-2 align-top text-xs font-mono text-neutral-200">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editKey}
                          onChange={(event) => setEditKey(event.target.value)}
                          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-neutral-400"
                        />
                      ) : (
                        item.key
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-neutral-100">
                      {isEditing ? (
                        <form onSubmit={handleEditSave} className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(event) => setEditValue(event.target.value)}
                            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-neutral-400"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="h-7 rounded-md bg-neutral-100 px-2 text-xs font-medium text-neutral-900 hover:bg-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="h-7 rounded-md border border-neutral-600 px-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <span className="whitespace-pre-wrap break-words text-[11px] leading-snug text-neutral-100">
                          {item.value}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-right text-xs">
                      {!isEditing && (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded-md border border-neutral-600 px-2 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(item.id)}
                            className="rounded-md border border-rose-700 px-2 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
