import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing suite id" }, { status: 400 });
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

  const { title, preCondition, priority } = body as {
    title?: string;
    preCondition?: string | null;
    priority?: string | null;
  };

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Test case title is required" }, { status: 400 });
  }

  const trimmedTitle = title.trim().slice(0, 200);

  let trimmedPreCondition: string | null = null;
  if (typeof preCondition === "string") {
    const p = preCondition.trim();
    trimmedPreCondition = p.length > 0 ? p : null;
  }

  let normalizedPriority = "P2";
  if (typeof priority === "string" && priority.trim()) {
    const upper = priority.trim().toUpperCase();
    if (upper === "P1" || upper === "P2" || upper === "P3") {
      normalizedPriority = upper;
    }
  }

  try {
    const suite = await prisma.testSuite.findUnique({ where: { id } });

    if (!suite) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    const created = await prisma.testCase.create({
      data: {
        title: trimmedTitle,
        preCondition: trimmedPreCondition,
        priority: normalizedPriority,
        suiteId: id,
      },
      select: {
        id: true,
        title: true,
        priority: true,
        preCondition: true,
      },
    });

    return NextResponse.json({ testCase: created }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
