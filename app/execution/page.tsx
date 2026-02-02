import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResultStatusControl from "./ResultStatusControl";

type ResolvedExecutionSearchParams = {
  runId?: string;
  [key: string]: string | string[] | undefined;
};

type ExecutionPageProps = {
  searchParams: Promise<ResolvedExecutionSearchParams>;
};

type RunWithResults = Awaited<ReturnType<typeof getRunsForDashboard>>[number];
type ResultWithRelations = RunWithResults["results"][number];
type DefectWithLink = ResultWithRelations["defects"][number];

async function getRunsForDashboard() {
  return prisma.testRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: {
        include: {
          testCase: {
            include: {
              suite: {
                include: {
                  project: true,
                },
              },
            },
          },
          defects: true,
        },
      },
    },
  });
}

function summarizeRun(run: RunWithResults) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  let skipped = 0;
  let untested = 0;

  for (const result of run.results) {
    total += 1;
    switch (result.status) {
      case "PASSED":
        passed += 1;
        break;
      case "FAILED":
        failed += 1;
        break;
      case "BLOCKED":
        blocked += 1;
        break;
      case "SKIPPED":
        skipped += 1;
        break;
      case "UNTESTED":
        untested += 1;
        break;
      default:
        break;
    }
  }

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return { total, passed, failed, blocked, skipped, untested, passRate };
}

function ExecutionDashboard({
  runs,
  query,
}: {
  runs: RunWithResults[];
  query?: ResolvedExecutionSearchParams;
}) {
  if (runs.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Execution & TSR</h1>
              <p className="text-sm text-neutral-400">
                No test runs have been recorded yet.
              </p>
            </div>
            <Link
              href="/projects"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-800"
            >
              Back to Projects
            </Link>
          </header>
          <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-10 text-center text-sm text-neutral-400">
            Seed data creates at least one demo run. If you do not see it, ensure seeding completed successfully.
          </div>
        </div>
      </div>
    );
  }

  const rawRunId = query?.runId;
  const activeRunId = typeof rawRunId === "string" ? rawRunId : runs[0]?.id;
  const activeRun = runs.find((run) => run.id === activeRunId) ?? runs[0];
  const summary = summarizeRun(activeRun);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Link href="/projects" className="hover:underline">
                Projects
              </Link>
              <span>/</span>
              <span className="text-neutral-500">Execution & TSR</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Execution & TSR</h1>
            <p className="text-sm text-neutral-400">
              Overview of manual runs, statuses, and defects derived from test results.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              <span>Test runs</span>
              <span className="text-neutral-500">{runs.length}</span>
            </div>
            <div className="max-h-[520px] space-y-1 overflow-auto">
              {runs.map((run) => {
                const isActive = run.id === activeRun.id;
                const s = summarizeRun(run);

                return (
                  <Link
                    key={run.id}
                    href={`/execution?runId=${run.id}`}
                    className={`flex flex-col rounded-md border px-2 py-1.5 text-[11px] leading-snug ${
                      isActive
                        ? "border-neutral-200 bg-neutral-100 text-neutral-950"
                        : "border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate font-medium">{run.name}</span>
                    <span className="text-[10px] text-neutral-400">
                      {run.environment} · {new Date(run.createdAt).toLocaleString()}
                    </span>
                    <span className="mt-0.5 text-[10px] text-neutral-400">
                      {s.total} cases · {s.passRate}% passed
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>

          <main className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-50">{activeRun.name}</h2>
                <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400">
                  <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                    Environment: {activeRun.environment}
                  </span>
                  <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                    {new Date(activeRun.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                  Passed: {summary.passed}
                </span>
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-rose-300">
                  Failed: {summary.failed}
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                  Blocked: {summary.blocked}
                </span>
                <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-sky-200">
                  Skipped: {summary.skipped}
                </span>
                <span className="rounded-full border border-neutral-600 bg-neutral-800 px-2 py-0.5 text-neutral-200">
                  Untested: {summary.untested}
                </span>
              </div>
            </div>

            {activeRun.results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/60 px-6 py-8 text-center text-sm text-neutral-400">
                This run does not have any recorded results yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/60">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-neutral-900/80 text-[11px] uppercase tracking-wide text-neutral-400">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Test case</th>
                      <th className="px-3 py-2 text-left font-medium">Project / Suite</th>
                      <th className="px-3 py-2 text-left font-medium">Status & actual</th>
                      <th className="px-3 py-2 text-right font-medium">Defects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRun.results.map((result: ResultWithRelations) => {
                      const project = result.testCase.suite.project;
                      const hasDefects = result.defects.length > 0;

                      const statusLabel = result.status;
                      let statusClass = "bg-neutral-800 text-neutral-100 border-neutral-600";

                      if (statusLabel === "PASSED") {
                        statusClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
                      } else if (statusLabel === "FAILED") {
                        statusClass = "bg-rose-500/10 text-rose-300 border-rose-500/40";
                      } else if (statusLabel === "BLOCKED") {
                        statusClass = "bg-amber-500/10 text-amber-200 border-amber-500/40";
                      } else if (statusLabel === "SKIPPED") {
                        statusClass = "bg-sky-500/10 text-sky-200 border-sky-500/40";
                      }

                      return (
                        <tr
                          key={result.id}
                          className="border-t border-neutral-800/80 hover:bg-neutral-900/80"
                        >
                          <td className="px-3 py-2 align-top text-neutral-100">
                            {result.testCase.title}
                          </td>
                          <td className="px-3 py-2 align-top text-[11px] text-neutral-400">
                            <div className="truncate">
                              <span className="font-medium text-neutral-300">{project.name}</span>
                              <span className="text-neutral-500"> · {result.testCase.suite.title}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-neutral-200">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                              <ResultStatusControl
                                resultId={result.id}
                                initialStatus={result.status as any}
                                initialActualResult={result.actualResult}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-right text-[11px] text-neutral-300">
                            {hasDefects ? (
                              <span className="inline-flex items-center justify-end gap-1">
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
                                <span>{result.defects.length}</span>
                              </span>
                            ) : (
                              <span className="text-neutral-500">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default async function ExecutionPage({ searchParams }: ExecutionPageProps) {
  const [runs, resolvedSearchParams] = await Promise.all([
    getRunsForDashboard(),
    searchParams,
  ]);

  return <ExecutionDashboard runs={runs} query={resolvedSearchParams} />;
}
