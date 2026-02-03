import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing test case id" }, { status: 400 });
  }

  try {
    const steps = await prisma.$transaction(async (tx) => {
      const existingTestCase = await tx.testCase.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingTestCase) {
        return null;
      }

      const lastStep = await tx.testStep.findFirst({
        where: { testCaseId: id },
        orderBy: [{ order: "desc" }, { id: "desc" }],
        select: { order: true },
      });

      const nextOrder = (lastStep?.order ?? 0) + 1;

      await tx.testStep.create({
        data: {
          testCaseId: id,
          order: nextOrder,
          action: "",
          expected: "",
        },
      });

      const allSteps = await tx.testStep.findMany({
        where: { testCaseId: id },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });

      await Promise.all(
        allSteps.map((step, index) =>
          tx.testStep.update({
            where: { id: step.id },
            data: { order: index + 1 },
          }),
        ),
      );

      return tx.testStep.findMany({
        where: { testCaseId: id },
        orderBy: { order: "asc" },
      });
    });

    if (!steps) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    return NextResponse.json({ steps }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
