import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateAutomationRunBody = {
  projectId: string;
  name?: string;
  environment?: string;
  testCaseIds: string[];
};

export async function POST(request: Request) {
  const expectedKey = process.env.AUTOMATION_API_KEY;
  if (expectedKey) {
    const headerKey = request.headers.get("x-automation-key");
    if (!headerKey || headerKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { projectId, name, environment, testCaseIds } = body as CreateAutomationRunBody;

  if (!projectId || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    return NextResponse.json(
      { error: "projectId and non-empty testCaseIds are required" },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const testCases = await prisma.testCase.findMany({
      where: {
        id: { in: testCaseIds },
        suite: {
          projectId,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (testCases.length === 0) {
      return NextResponse.json(
        { error: "No valid test cases found for this project" },
        { status: 400 },
      );
    }

    if (testCases.length !== testCaseIds.length) {
      return NextResponse.json(
        { error: "Some testCaseIds do not belong to the specified project" },
        { status: 400 },
      );
    }

    const defaultName =
      name && name.trim().length > 0
        ? name.trim()
        : `Automation run - ${project.name}`;

    const effectiveEnvironment =
      environment && environment.trim().length > 0
        ? environment.trim()
        : "automation";

    const { run, results } = await prisma.$transaction(async (tx) => {
      const run = await tx.testRun.create({
        data: {
          name: defaultName,
          environment: effectiveEnvironment,
        },
      });

      const results = await Promise.all(
        testCases.map((testCase) =>
          tx.testResult.create({
            data: {
              testRunId: run.id,
              testCaseId: testCase.id,
            },
          }),
        ),
      );

      return { run, results };
    });

    return NextResponse.json({
      testRun: run,
      results: results.map((result) => ({
        id: result.id,
        testCaseId: result.testCaseId,
        status: result.status,
      })),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
