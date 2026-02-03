import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    stepId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, stepId } = await context.params;

  if (!id || !stepId) {
    return NextResponse.json({ error: "Missing test case id or step id" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const testCase = await tx.testCase.findUnique({
        where: { id },
        select: {
          id: true,
          _count: {
            select: {
              results: true,
            },
          },
        },
      });

      if (!testCase) {
        return { status: 404 as const, body: { error: "Test case not found" } };
      }

      if ((testCase._count?.results ?? 0) > 0) {
        return {
          status: 400 as const,
          body: { error: "Cannot delete steps for a test case with execution history" },
        };
      }

      const step = await tx.testStep.findFirst({
        where: { id: stepId, testCaseId: id },
        select: { id: true },
      });

      if (!step) {
        return { status: 404 as const, body: { error: "Step not found" } };
      }

      await tx.testStep.delete({
        where: { id: stepId },
      });

      const remainingSteps = await tx.testStep.findMany({
        where: { testCaseId: id },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });

      await Promise.all(
        remainingSteps.map((s, index) =>
          tx.testStep.update({
            where: { id: s.id },
            data: { order: index + 1 },
          }),
        ),
      );

      const steps = await tx.testStep.findMany({
        where: { testCaseId: id },
        orderBy: { order: "asc" },
      });

      return { status: 200 as const, body: { steps } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
