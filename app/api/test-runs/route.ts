import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateRunBody = {
  name?: string;
  environment?: string;
  testCaseIds?: string[];
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

  const { name, environment, testCaseIds } = body as CreateRunBody;

  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    return NextResponse.json({ error: "testCaseIds must be a non-empty array" }, { status: 400 });
  }

  const uniqueIds = Array.from(
    new Set(
      testCaseIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter((id) => id.length > 0),
    ),
  );

  if (uniqueIds.length === 0) {
    return NextResponse.json({ error: "No valid testCaseIds provided" }, { status: 400 });
  }

  try {
    const testCases = await prisma.testCase.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
      },
      select: {
        id: true,
        title: true,
        suite: {
          select: {
            project: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (testCases.length === 0) {
      return NextResponse.json({ error: "No matching test cases found" }, { status: 400 });
    }

    const trimmedName = (name ?? "").trim();
    const trimmedEnvironment = (environment ?? "").trim();

    let finalName = trimmedName;

    if (!finalName) {
      const first = testCases[0];
      const projectName = first.suite.project.name;
      const count = testCases.length;
      finalName = `Manual run - ${projectName} (${count} case${count > 1 ? "s" : ""})`;
    }

    const run = await prisma.testRun.create({
      data: {
        name: finalName.slice(0, 200),
        environment: (trimmedEnvironment || "Manual").slice(0, 100),
        results: {
          create: testCases.map((tc) => ({
            testCaseId: tc.id,
          })),
        },
      },
    });

    return NextResponse.json({ runId: run.id }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
