import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RequirementWithCases = Awaited<
  ReturnType<typeof prisma.requirement.findMany>
>[number];

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const [project, requirements, testCases, groupedResults] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
    }),
    prisma.requirement.findMany({
      where: { projectId: id },
      include: {
        testCases: true,
      },
      orderBy: {
        code: "asc",
      },
    }),
    prisma.testCase.findMany({
      where: {
        suite: {
          projectId: id,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.testResult.groupBy({
      by: ["status"],
      where: {
        testCase: {
          suite: {
            projectId: id,
          },
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  if (!project) {
    notFound();
  }

  const requirementsCount = requirements.length;
  const requirementsWithCases = requirements.filter((r: RequirementWithCases) => r.testCases.length > 0)
    .length;
  const requirementsCoverage =
    requirementsCount > 0 ? Math.round((requirementsWithCases / requirementsCount) * 100) : 0;

  const totalTestCases = testCases.length;

  let totalResults = 0;
  let passed = 0;
  let failed = 0;

  for (const row of groupedResults) {
    const count = row._count._all;
    totalResults += count;
    if (row.status === "PASSED") {
      passed += count;
    } else if (row.status === "FAILED") {
      failed += count;
    }
  }

  const passRate = totalResults > 0 ? Math.round((passed / totalResults) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Link href="/projects" className="hover:underline">
                Projects
              </Link>
              <span>/</span>
              <span className="text-neutral-500">Detail</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="text-sm text-neutral-400">
              Requirement Traceability Matrix (RTM) and execution snapshot for this project.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm">
            <div className="text-xs text-neutral-400">Requirements</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{requirementsCount}</div>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm">
            <div className="text-xs text-neutral-400">Covered requirements</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{requirementsWithCases}</div>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm">
            <div className="text-xs text-neutral-400">RTM coverage</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{requirementsCoverage}%</div>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm">
            <div className="text-xs text-neutral-400">Test cases / Pass rate</div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-xl font-semibold tabular-nums">{totalTestCases}</span>
              <span className="text-xs text-neutral-400">{passRate}% passed</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-200">
              Requirements & coverage
            </h2>
            <p className="text-xs text-neutral-500">
              Each requirement should be linked to at least one test case for full traceability.
            </p>
          </div>

          {requirements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-8 text-center text-sm text-neutral-400">
              No requirements found for this project.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-neutral-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-300">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-300">Title</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-300">Linked test cases</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-300">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req: RequirementWithCases) => {
                    const linkedCount = req.testCases.length;
                    const covered = linkedCount > 0;

                    return (
                      <tr
                        key={req.id}
                        className="border-t border-neutral-800/80 hover:bg-neutral-800/40"
                      >
                        <td className="px-4 py-3 text-xs font-medium text-neutral-200">
                          {req.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-100">
                          {req.title}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {linkedCount}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          <span
                            className={
                              covered
                                ? "rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400"
                                : "rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-400"
                            }
                          >
                            {covered ? "COVERED" : "GAP"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
