import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import RequirementLinksEditor from "./RequirementLinksEditor";
import NewRequirementForm from "./NewRequirementForm";
import ProjectTestDataSection from "./ProjectTestDataSection";
import NewMilestoneForm from "./NewMilestoneForm";
import MilestoneActions from "./MilestoneActions";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RequirementWithCases = Prisma.RequirementGetPayload<{
  include: {
    testCases: true;
  };
}>;

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const [project, requirements, testCases, groupedResults, projectResults] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: {
            startDate: "asc",
          },
        },
        testData: true,
      },
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
        title: true,
        suite: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        title: "asc",
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
    prisma.testResult.findMany({
      where: {
        testCase: {
          suite: {
            projectId: id,
          },
        },
      },
      include: {
        testRun: true,
        testCase: {
          include: {
            requirements: true,
          },
        },
        defects: true,
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

  const testCaseOptions = testCases.map((tc) => ({
    id: tc.id,
    title: tc.title,
    suiteTitle: tc.suite.title,
  }));

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

  const milestones = project.milestones;
  const totalRequirementsForMilestones = requirementsCount;

  const milestoneSummaries = milestones.map((milestone) => {
    const resultsInWindow = projectResults.filter((result) => {
      const createdAt = result.testRun.createdAt;
      return createdAt >= milestone.startDate && createdAt <= milestone.endDate;
    });

    let windowTotalResults = 0;
    let windowPassed = 0;
    let windowFailed = 0;
    let windowBlocked = 0;
    let windowSkipped = 0;
    let windowUntested = 0;

    const runIds = new Set<string>();
    const requirementIdsWithPass = new Set<string>();
    let defectCount = 0;
    let openDefects = 0;

    for (const result of resultsInWindow) {
      windowTotalResults += 1;
      runIds.add(result.testRunId);

      switch (result.status) {
        case "PASSED":
          windowPassed += 1;
          break;
        case "FAILED":
          windowFailed += 1;
          break;
        case "BLOCKED":
          windowBlocked += 1;
          break;
        case "SKIPPED":
          windowSkipped += 1;
          break;
        case "UNTESTED":
          windowUntested += 1;
          break;
        default:
          break;
      }

      if (result.status === "PASSED") {
        for (const req of result.testCase.requirements) {
          requirementIdsWithPass.add(req.id);
        }
      }

      for (const defect of result.defects) {
        defectCount += 1;
        if (defect.status === "OPEN" || defect.status === "IN_PROGRESS") {
          openDefects += 1;
        }
      }
    }

    const runsCount = runIds.size;
    const windowPassRate = windowTotalResults > 0 ? Math.round((windowPassed / windowTotalResults) * 100) : 0;
    const requirementsWithPass = requirementIdsWithPass.size;
    const requirementCoverageForMilestone =
      totalRequirementsForMilestones > 0
        ? Math.round((requirementsWithPass / totalRequirementsForMilestones) * 100)
        : 0;

    return {
      milestone,
      runsCount,
      windowTotalResults,
      windowPassed,
      windowFailed,
      windowBlocked,
      windowSkipped,
      windowUntested,
      windowPassRate,
      requirementsWithPass,
      requirementCoverageForMilestone,
      defectCount,
      openDefects,
    };
  });

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

          <NewRequirementForm projectId={project.id} />

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
                          <div className="space-y-1">
                            <div>{req.title}</div>
                            <RequirementLinksEditor
                              requirementId={req.id}
                              initialLinkedIds={req.testCases.map(
                                (tc: RequirementWithCases["testCases"][number]) => tc.id,
                              )}
                              allTestCases={testCaseOptions}
                            />
                          </div>
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

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-200">
              Milestones & progress
            </h2>
            <p className="text-xs text-neutral-500">
              Time-boxed view of requirement coverage, execution, and defects for this project.
            </p>
          </div>

          <NewMilestoneForm projectId={project.id} />

          {milestones.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-8 text-center text-sm text-neutral-400">
              No milestones defined for this project yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-neutral-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-300">Milestone</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-300">Requirements</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-300">Execution</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-300">Defects</th>
                  </tr>
                </thead>
                <tbody>
                  {milestoneSummaries.map((row) => {
                    const m = row.milestone;

                    return (
                      <tr
                        key={m.id}
                        className="border-t border-neutral-800/80 hover:bg-neutral-800/40"
                      >
                        <td className="px-4 py-3 align-top text-sm text-neutral-100">
                          <div className="flex flex-col gap-1">
                            <div className="space-y-0.5">
                              <div className="font-medium">{m.name}</div>
                              <div className="text-xs text-neutral-400">
                                {m.startDate.toLocaleDateString()} {" to "}
                                {m.endDate.toLocaleDateString()}
                              </div>
                            </div>
                            <MilestoneActions
                              milestoneId={m.id}
                              initialName={m.name}
                              initialStartDate={m.startDate.toISOString()}
                              initialEndDate={m.endDate.toISOString()}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-neutral-100">
                          <div className="space-y-1">
                            <div className="text-xs text-neutral-200">
                              {row.requirementsWithPass}/{totalRequirementsForMilestones} requirements
                              &nbsp;with at least one PASSED result
                            </div>
                            <div className="text-xs text-neutral-400">
                              Coverage in this window:&nbsp;
                              <span className="font-semibold text-neutral-100">
                                {row.requirementCoverageForMilestone}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-neutral-100">
                          {row.windowTotalResults === 0 ? (
                            <span className="text-xs text-neutral-400">No runs in this window</span>
                          ) : (
                            <div className="space-y-1 text-xs text-neutral-200">
                              <div>
                                <span className="font-semibold">{row.runsCount}</span> runs,
                                &nbsp;
                                <span className="font-semibold">{row.windowTotalResults}</span> results
                              </div>
                              <div className="text-neutral-400">
                                Pass rate:&nbsp;
                                <span className="font-semibold text-emerald-300">
                                  {row.windowPassRate}%
                                </span>
                                &nbsp;· Passed {row.windowPassed}, Failed {row.windowFailed}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-right text-xs text-neutral-100">
                          <div className="space-y-1">
                            <div>
                              <span className="font-semibold">{row.defectCount}</span> defects
                              &nbsp;linked to runs in this window
                            </div>
                            <div className="text-neutral-400">
                              <span className="font-semibold text-rose-300">
                                {row.openDefects}
                              </span>{" "}
                              open / in progress
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-200">
              Test data catalog
            </h2>
            <p className="text-xs text-neutral-500">
              Centralize reusable test data (accounts, configs, URLs) for this project.
            </p>
          </div>

          <ProjectTestDataSection projectId={project.id} initialItems={project.testData} />
        </section>
      </div>
    </div>
  );
}
