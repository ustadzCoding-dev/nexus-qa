import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TestCaseStepsEditor from "./TestCaseStepsEditor";
import NewSuiteForm from "./NewSuiteForm";
import NewTestCaseInlineForm from "./NewTestCaseInlineForm";
import SuiteActions from "./SuiteActions";
import TestCaseActions from "./TestCaseActions";

type ResolvedSearchParams = {
  caseId?: string;
  suiteId?: string;
  q?: string;
  [key: string]: string | string[] | undefined;
};

type TestCaseGridPageProps = {
  searchParams: Promise<ResolvedSearchParams>;
};

async function getProjectForGrid() {
  return prisma.project.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      suites: {
        include: {
          testCases: {
            include: {
              steps: {
                orderBy: { order: "asc" },
              },
              requirements: true,
              _count: {
                select: {
                  results: true,
                },
              },
            },
            orderBy: {
              title: "asc",
            },
          },
        },
        orderBy: {
          title: "asc",
        },
      },
    },
  });
}

type ProjectWithGrid = NonNullable<Awaited<ReturnType<typeof getProjectForGrid>>>;
type SuiteWithCases = ProjectWithGrid["suites"][number];
type TestCaseWithRelations = SuiteWithCases["testCases"][number];
type RequirementWithLink = TestCaseWithRelations["requirements"][number];
type StepWithOrder = TestCaseWithRelations["steps"][number];

function TestCaseGridView({
  project,
  query,
}: {
  project: ProjectWithGrid;
  query?: ResolvedSearchParams;
}) {
  const suites = project.suites;
  const rawSuiteId = query?.suiteId;
  const suiteFilter = typeof rawSuiteId === "string" ? rawSuiteId : undefined;

  const rawQ = query?.q;
  const searchQuery =
    typeof rawQ === "string" ? rawQ.trim().toLowerCase() : "";

  const filteredSuites =
    suiteFilter != null
      ? suites.filter((suite: SuiteWithCases) => suite.id === suiteFilter)
      : suites;

  const allTestCases = filteredSuites
    .flatMap((suite: SuiteWithCases) => suite.testCases)
    .filter((testCase: TestCaseWithRelations) => {
      if (searchQuery && !testCase.title.toLowerCase().includes(searchQuery)) {
        return false;
      }
      return true;
    });

  if (allTestCases.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Test Case Grid</h1>
              <p className="text-sm text-neutral-400">
                No test cases found for this project yet.
              </p>
            </div>
            <Link
              href="/projects"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-800"
            >
              Back to Projects
            </Link>
          </header>

          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-6 text-sm text-neutral-400">
              <p>
                Start by creating a test suite for this project, then add test cases under each
                suite.
              </p>
            </div>

            <NewSuiteForm projectId={project.id} />

            {suites.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-xs text-neutral-200">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  Suites
                </div>
                <div className="space-y-2">
                  {suites.map((suite: SuiteWithCases) => (
                    <div key={suite.id} className="rounded-md border border-neutral-800 bg-neutral-950/80">
                      <div className="px-3 pt-2 pb-1">
                        <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
                          {suite.title}
                        </div>
                        <div className="mt-1">
                          <SuiteActions suiteId={suite.id} />
                        </div>
                      </div>
                      <NewTestCaseInlineForm suiteId={suite.id} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const rawCaseId = query?.caseId;
  const activeCaseId = typeof rawCaseId === "string" ? rawCaseId : allTestCases[0]?.id;
  const activeCase =
    allTestCases.find((tc: TestCaseWithRelations) => tc.id === activeCaseId) ?? allTestCases[0];

  const activeSuite = filteredSuites.find((suite: SuiteWithCases) =>
    suite.testCases.some((tc: TestCaseWithRelations) => tc.id === activeCase.id),
  );

  const activeCaseHasHistory = (activeCase._count?.results ?? 0) > 0;

  const requirementCodes = activeCase.requirements
    .map((req: RequirementWithLink) => req.code)
    .join(", ");

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
              <span className="text-neutral-500">Test Case Grid</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Test Case Grid</h1>
            <p className="text-sm text-neutral-400">
              Spreadsheet-like view of test cases and steps for declarative testing.
            </p>
          </div>
        </header>

        <NewSuiteForm projectId={project.id} />

        <form
          method="GET"
          action="/test-case"
          className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-3 text-xs text-neutral-300"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">
              Suite
            </label>
            <select
              name="suiteId"
              defaultValue={typeof query?.suiteId === "string" ? query.suiteId : ""}
              className="w-48 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            >
              <option value="">All suites</option>
              {suites.map((suite: SuiteWithCases) => (
                <option key={suite.id} value={suite.id}>
                  {suite.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">
              Search
            </label>
            <input
              type="text"
              name="q"
              defaultValue={typeof query?.q === "string" ? query.q : ""}
              placeholder="Search test case title..."
              className="w-56 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-[11px] font-medium text-neutral-100 hover:bg-neutral-800"
          >
            Apply
          </button>
        </form>

        <div className="flex min-h-[480px] gap-4 rounded-lg border border-neutral-800 bg-neutral-900/60">
          <aside className="w-72 border-r border-neutral-800 bg-neutral-950/80">
            <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 text-xs text-neutral-400">
              <span className="font-medium text-neutral-200">{project.name}</span>
              <span>{filteredSuites.length} suites</span>
            </div>
            <div className="max-h-[540px] space-y-2 overflow-auto px-2 py-2 text-xs">
              {filteredSuites.map((suite: SuiteWithCases) => (
                <div
                  key={suite.id}
                  className="space-y-1 rounded-md border border-transparent hover:border-neutral-800"
                >
                  <div className="px-2 pt-1">
                    <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                      {suite.title}
                    </div>
                    <div className="mt-1">
                      <SuiteActions suiteId={suite.id} />
                    </div>
                  </div>
                  <NewTestCaseInlineForm suiteId={suite.id} />
                  <div className="space-y-0.5 pb-1">
                    {suite.testCases.map((testCase: TestCaseWithRelations) => {
                      const isActive = testCase.id === activeCase.id;
                      const hasHistory = testCase._count?.results > 0;

                      return (
                        <div
                          key={testCase.id}
                          className="flex items-center justify-between gap-1 px-1"
                        >
                          <Link
                            href={`/test-case?caseId=${testCase.id}`}
                            className={`flex-1 rounded-md px-2 py-1 text-[11px] leading-snug ${
                              isActive
                                ? "bg-neutral-100 text-neutral-900"
                                : "text-neutral-200 hover:bg-neutral-800"
                            }`}
                          >
                            <span className="font-medium">{testCase.title}</span>
                          </Link>
                          <TestCaseActions testCaseId={testCase.id} hasHistory={hasHistory} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="flex-1 p-4 text-sm">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-800 pb-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-50">
                  {activeCase.title}
                </h2>
                <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400">
                  {activeSuite && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                      Suite: {activeSuite.title}
                    </span>
                  )}
                  <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                    Priority: {activeCase.priority}
                  </span>
                  {requirementCodes && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                      Requirements: {requirementCodes}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activeCase.preCondition && (
                  <div className="max-w-sm rounded-md border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs text-neutral-300">
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                      Pre-condition
                    </div>
                    <p className="leading-snug">{activeCase.preCondition}</p>
                  </div>
                )}
              </div>
            </div>

            <div key={activeCase.id}>
              <TestCaseStepsEditor
                testCaseId={activeCase.id}
                initialSteps={activeCase.steps as StepWithOrder[]}
                hasHistory={activeCaseHasHistory}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default async function TestCaseGridPage({ searchParams }: TestCaseGridPageProps) {
  const [project, resolvedSearchParams] = await Promise.all([
    getProjectForGrid(),
    searchParams,
  ]);

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Test Case Grid</h1>
              <p className="text-sm text-neutral-400">
                No projects found in the database yet. Create a project first to manage test cases.
              </p>
            </div>
            <Link
              href="/projects"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-800"
            >
              Go to Projects
            </Link>
          </header>
        </div>
      </div>
    );
  }

  return <TestCaseGridView project={project} query={resolvedSearchParams} />;
}
