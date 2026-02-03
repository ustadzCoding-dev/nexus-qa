import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing suite id" }, { status: 400 });
  }

  try {
    const suite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
    });

    if (!suite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    if (suite._count.testCases > 0) {
      return NextResponse.json(
        { error: "Cannot delete suite with existing test cases. Delete test cases first." },
        { status: 400 },
      );
    }

    await prisma.testSuite.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
