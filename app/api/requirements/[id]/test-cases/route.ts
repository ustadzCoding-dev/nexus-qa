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
    return NextResponse.json({ error: "Missing requirement id" }, { status: 400 });
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

  const { testCaseIds } = body as {
    testCaseIds?: string[];
  };

  if (!Array.isArray(testCaseIds)) {
    return NextResponse.json({ error: "testCaseIds must be an array" }, { status: 400 });
  }

  const cleanedIds = Array.from(
    new Set(
      testCaseIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

  try {
    const updated = await prisma.requirement.update({
      where: { id },
      data: {
        testCases: {
          set: cleanedIds.map((testCaseId) => ({ id: testCaseId })),
        },
      },
      include: {
        testCases: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({ requirement: updated });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
