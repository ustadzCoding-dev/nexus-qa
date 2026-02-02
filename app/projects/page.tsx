import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import NewProjectForm from "./NewProjectForm";

type ProjectRow = {
  id: string;
  name: string;
  createdAt: Date;
  requirementsCount: number;
  totalTestCases: number;
  totalResults: number;
  passed: number;
  failed: number;
  passRate: number;
};

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    requirements: true;
    suites: {
      include: {
        testCases: {
          include: {
            results: true;
          };
        };
      };
    };
  };
}>;

async function getProjects(): Promise<ProjectRow[]> {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requirements: true,
      suites: {
        include: {
          testCases: {
            include: {
              results: true,
            },
          },
        },
      },
    },
  });

  return projects.map((project: ProjectWithRelations) => {
    const requirementsCount = project.requirements.length;

    let totalTestCases = 0;
    let totalResults = 0;
    let passed = 0;
    let failed = 0;

    for (const suite of project.suites) {
      totalTestCases += suite.testCases.length;
      for (const testCase of suite.testCases) {
        for (const result of testCase.results) {
          totalResults += 1;
          if (result.status === "PASSED") {
            passed += 1;
          } else if (result.status === "FAILED") {
            failed += 1;
          }
        }
      }
    }

    const passRate = totalResults > 0 ? Math.round((passed / totalResults) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      requirementsCount,
      totalTestCases,
      totalResults,
      passed,
      failed,
      passRate,
    };
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-neutral-400">
              Unified view of test strategy, coverage, and execution health.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-800"
            >
              Home
            </Link>
          </div>
        </header>

        <NewProjectForm />

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-10 text-center text-sm text-neutral-400">
            No projects found. Start by creating a project to anchor your requirements and test cases.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-neutral-900/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-300">Project</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-300">Requirements</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-300">Test cases</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-300">Runs</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-300">Pass rate</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-300">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-neutral-800/80 hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-neutral-50 hover:underline"
                        >
                          {project.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {project.requirementsCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {project.totalTestCases}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {project.totalResults}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {project.passRate}%
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-neutral-400">
                      {project.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
