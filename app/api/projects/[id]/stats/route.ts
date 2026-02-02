import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [requirementsCount, testCases, groupedResults] = await Promise.all([
      prisma.requirement.count({
        where: { projectId: id },
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

    const passRate = totalResults > 0 ? passed / totalResults : 0;

    return NextResponse.json({
      projectId: id,
      requirementsCount,
      totalTestCases,
      totalResults,
      passed,
      failed,
      passRate,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
