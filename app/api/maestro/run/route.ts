import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ENVIRONMENT = "Maestro default";

type MaestroRequestBody = {
  mode?: "case" | "suite";
  caseId?: string;
  suiteId?: string;
  environment?: string;
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { mode = "case", caseId, suiteId, environment } = body as MaestroRequestBody;

  try {
    if (mode === "case") {
      if (!caseId) {
        return NextResponse.json({ error: "caseId is required for mode=case" }, { status: 400 });
      }

      const testCase = await prisma.testCase.findUnique({
        where: { id: caseId },
        include: {
          suite: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!testCase) {
        return NextResponse.json({ error: "Test case not found" }, { status: 404 });
      }

      const runName = `Maestro Run - ${testCase.title}`;
      const env = environment || DEFAULT_ENVIRONMENT;

      const run = await prisma.testRun.create({
        data: {
          name: runName,
          environment: env,
          results: {
            create: {
              testCaseId: testCase.id,
            },
          },
        },
      });

      return NextResponse.json({ runId: run.id });
    }

    if (mode === "suite") {
      if (!suiteId) {
        return NextResponse.json({ error: "suiteId is required for mode=suite" }, { status: 400 });
      }

      const suite = await prisma.testSuite.findUnique({
        where: { id: suiteId },
        include: {
          testCases: true,
          project: true,
        },
      });

      if (!suite) {
        return NextResponse.json({ error: "Test suite not found" }, { status: 404 });
      }

      if (suite.testCases.length === 0) {
        return NextResponse.json({ error: "Test suite has no test cases" }, { status: 400 });
      }

      const runName = `Maestro Run - ${suite.title}`;
      const env = environment || DEFAULT_ENVIRONMENT;

      const run = await prisma.testRun.create({
        data: {
          name: runName,
          environment: env,
          results: {
            create: suite.testCases.map((testCase) => ({
              testCaseId: testCase.id,
            })),
          },
        },
      });

      return NextResponse.json({ runId: run.id });
    }

    return NextResponse.json({ error: "Unsupported mode" }, { status: 400 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
