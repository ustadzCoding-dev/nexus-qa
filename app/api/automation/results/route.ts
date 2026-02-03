import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Status } from "@prisma/client";

type ReportAutomationResultBody = {
  testRunId: string;
  testCaseId: string;
  status: Status;
  actualResult?: string | null;
};

const ALLOWED_STATUSES: Status[] = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "UNTESTED",
];

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

  const { testRunId, testCaseId, status, actualResult } = body as ReportAutomationResultBody;

  if (!testRunId || !testCaseId || !status) {
    return NextResponse.json(
      { error: "testRunId, testCaseId and status are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const existing = await prisma.testResult.findFirst({
      where: {
        testRunId,
        testCaseId,
      },
      include: {
        defects: true,
        testCase: {
          include: {
            suite: {
              include: {
                project: true,
              },
            },
            steps: true,
          },
        },
        testRun: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Test result not found" }, { status: 404 });
    }

    const operations: any[] = [];

    const nextActualResult = actualResult ?? existing.actualResult ?? null;

    operations.push(
      prisma.testResult.update({
        where: { id: existing.id },
        data: {
          status,
          actualResult: nextActualResult,
        },
      }),
    );

    if (status === "FAILED" && existing.defects.length === 0) {
      const testCaseTitle = existing.testCase.title;
      const environment = existing.testRun?.environment;
      const projectName = existing.testCase.suite?.project?.name;
      const suiteTitle = existing.testCase.suite?.title;

      const contextParts: string[] = [];

      if (projectName) {
        contextParts.push(projectName);
      }

      if (environment) {
        contextParts.push(environment);
      }

      const contextSuffix =
        contextParts.length > 0 ? ` (${contextParts.join(" · ")})` : "";

      let actualSnippet: string | null = null;
      if (typeof nextActualResult === "string" && nextActualResult.trim().length > 0) {
        const trimmed = nextActualResult.trim();
        actualSnippet =
          trimmed.length > 80 ? `${trimmed.slice(0, 77).trimEnd()}...` : trimmed;
      }

      const titleBase = `[Auto defect] ${testCaseTitle}${contextSuffix}`;
      const fullTitle = actualSnippet
        ? `${titleBase} · Actual: ${actualSnippet}`
        : titleBase;

      const descriptionLines: string[] = [];

      if (projectName) {
        descriptionLines.push(`Project: ${projectName}`);
      }

      if (suiteTitle) {
        descriptionLines.push(`Suite: ${suiteTitle}`);
      }

      descriptionLines.push(`Test case: ${testCaseTitle}`);

      const hasActualText =
        typeof nextActualResult === "string" && nextActualResult.trim().length > 0;

      if (environment || hasActualText) {
        descriptionLines.push("");

        if (environment) {
          descriptionLines.push(`Environment: ${environment}`);
        }

        if (hasActualText) {
          descriptionLines.push(
            `Actual result: ${nextActualResult!.toString().trim()}`,
          );
        }
      }

      const steps = Array.isArray(existing.testCase.steps)
        ? existing.testCase.steps.slice()
        : [];

      if (steps.length > 0) {
        descriptionLines.push("");
        descriptionLines.push("Steps to reproduce:");

        steps
          .sort((a, b) => {
            const ao = (a.order ?? 0) as number;
            const bo = (b.order ?? 0) as number;
            return ao - bo;
          })
          .forEach((step, index) => {
            const label =
              typeof step.order === "number" && !Number.isNaN(step.order)
                ? step.order
                : index + 1;
            const actionText = (step.action ?? "").trim();
            const expectedText = (step.expected ?? "").trim();

            let line = `${label}. ${actionText}`;
            if (expectedText) {
              line += ` (Expected: ${expectedText})`;
            }

            descriptionLines.push(line);
          });
      }

      const description =
        descriptionLines.length > 0 ? descriptionLines.join("\n") : null;

      operations.push(
        prisma.defect.create({
          data: {
            title: fullTitle,
            severity: "Major",
            status: "OPEN",
            evidenceUrl: null,
            description,
            testResultId: existing.id,
          },
        }),
      );
    }

    await prisma.$transaction(operations as any[]);

    const reloaded = await prisma.testResult.findUnique({
      where: { id: existing.id },
      include: {
        defects: true,
      },
    });

    return NextResponse.json({ result: reloaded });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
