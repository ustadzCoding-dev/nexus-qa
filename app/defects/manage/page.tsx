import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DefectStatusSelect from "../DefectStatusSelect";
import DefectDetailsEditor from "../DefectDetailsEditor";

export const dynamic = "force-dynamic";

async function getDefectsForManage(projectId?: string) {
  return prisma.defect.findMany({
    where: projectId
      ? {
          testResult: {
            testCase: {
              suite: {
                projectId,
              },
            },
          },
        }
      : undefined,
    orderBy: {
      status: "asc",
    },
    include: {
      testResult: {
        include: {
          testRun: true,
          testCase: {
            include: {
              suite: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

type DefectRow = Awaited<ReturnType<typeof getDefectsForManage>>[number];

function getSeverityClass(severity: string) {
  const value = severity.toLowerCase();

  if (value.includes("critical") || value.includes("blocker")) {
    return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  }

  if (value.includes("major") || value.includes("high")) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }

  if (value.includes("minor") || value.includes("medium")) {
    return "border-sky-500/40 bg-sky-500/10 text-sky-200";
  }

  return "border-neutral-600 bg-neutral-800 text-neutral-100";
}

function DefectsManageTable({ defects }: { defects: DefectRow[] }) {
  if (defects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/60 px-6 py-8 text-center text-sm text-neutral-400">
        There are no defects yet. When a test result is marked as FAILED, an auto-generated defect will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/60">
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-neutral-900/80 text-[11px] uppercase tracking-wide text-neutral-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Defect</th>
            <th className="px-3 py-2 text-left font-medium">Severity</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Project / Suite / Test case</th>
            <th className="px-3 py-2 text-left font-medium">Run</th>
            <th className="px-3 py-2 text-left font-medium">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {defects.map((defect) => {
            const result = defect.testResult;
            const run = result.testRun;
            const testCase = result.testCase;
            const suite = testCase.suite;
            const project = suite.project;

            return (
              <tr
                key={defect.id}
                className="border-t border-neutral-800/80 hover:bg-neutral-900/80"
              >
                <td className="px-3 py-2 align-top text-neutral-100">
                  <div className="space-y-1">
                    <div className="font-medium">{defect.title}</div>
                    <div className="text-[11px] text-neutral-400">
                      Linked to {testCase.title}
                    </div>
                    {defect.description && (
                      <div className="whitespace-pre-line text-[11px] text-neutral-500">
                        {defect.description}
                      </div>
                    )}
                    <DefectDetailsEditor
                      defectId={defect.id}
                      initialTitle={defect.title}
                      initialSeverity={defect.severity}
                      initialDescription={defect.description}
                      initialEvidenceUrl={defect.evidenceUrl}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getSeverityClass(
                      defect.severity,
                    )}`}
                  >
                    {defect.severity}
                  </span>
                </td>
                <td className="px-3 py-2 align-top">
                  <DefectStatusSelect
                    defectId={defect.id}
                    initialStatus={defect.status}
                  />
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-neutral-300">
                  <div className="truncate">
                    <span className="font-medium text-neutral-100">{project.name}</span>
                    <span className="text-neutral-500"> · {suite.title}</span>
                    <span className="text-neutral-500"> · {testCase.title}</span>
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-neutral-300">
                  <div className="space-y-0.5">
                    <div className="text-neutral-100">{run.name}</div>
                    <div className="text-neutral-500">{run.environment}</div>
                    <Link
                      href={`/execution?projectId=${project.id}&runId=${run.id}`}
                      className="inline-flex text-[11px] text-sky-300 hover:underline"
                    >
                      View run
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-neutral-300">
                  {defect.evidenceUrl ? (
                    <Link
                      href={defect.evidenceUrl}
                      className="text-sky-300 hover:underline"
                      target="_blank"
                    >
                      Evidence
                    </Link>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type DefectsManageSearchParams = {
  projectId?: string;
  [key: string]: string | string[] | undefined;
};

type DefectsManagePageProps = {
  searchParams: Promise<DefectsManageSearchParams>;
};

export default async function DefectsManagePage({ searchParams }: DefectsManagePageProps) {
  const [projects, resolvedSearchParams] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
      },
    }),
    searchParams,
  ]);

  if (projects.length === 0) {
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
                <Link href="/defects" className="hover:underline">
                  Defects
                </Link>
                <span>/</span>
                <span className="text-neutral-500">Manage</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Manage Defects</h1>
              <p className="text-sm text-neutral-400">
                No projects found in the database yet. Create a project first to manage defects.
              </p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  const rawProjectId = resolvedSearchParams.projectId;
  const selectedProjectId =
    typeof rawProjectId === "string" && rawProjectId.length > 0
      ? rawProjectId
      : projects[0].id;

  const defects = await getDefectsForManage(selectedProjectId);

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
              <Link href="/defects" className="hover:underline">
                Defects
              </Link>
              <span>/</span>
              <span className="text-neutral-500">Manage</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Manage Defects</h1>
            <p className="text-sm text-neutral-400">
              Review and update defect status created from test execution.
            </p>
          </div>
        </header>

        <form
          method="GET"
          action="/defects/manage"
          className="mb-3 inline-flex items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs text-neutral-300"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">
              Project
            </label>
            <select
              name="projectId"
              defaultValue={selectedProjectId}
              className="w-60 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-neutral-100 hover:bg-neutral-800"
          >
            Apply
          </button>
        </form>

        <DefectsManageTable defects={defects} />
      </div>
    </div>
  );
}
