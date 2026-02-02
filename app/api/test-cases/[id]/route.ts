import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing test case id" }, { status: 400 });
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

  const { steps } = body as {
    steps?: {
      id: string;
      action: string;
      expected: string;
    }[];
  };

  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "steps must be a non-empty array" }, { status: 400 });
  }

  try {
    const existing = await prisma.testCase.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    await prisma.$transaction(
      steps.map((step) =>
        prisma.testStep.update({
          where: { id: step.id },
          data: {
            action: step.action,
            expected: step.expected,
          },
        }),
      ),
    );

    const updatedSteps = await prisma.testStep.findMany({
      where: { testCaseId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ steps: updatedSteps });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
