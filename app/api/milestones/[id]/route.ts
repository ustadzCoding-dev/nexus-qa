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
    return NextResponse.json({ error: "Missing milestone id" }, { status: 400 });
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

  const { name, startDate, endDate } = body as {
    name?: string;
    startDate?: string;
    endDate?: string;
  };

  const data: Record<string, unknown> = {};

  if (typeof name !== "undefined") {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    data.name = name.trim().slice(0, 200);
  }

  if (typeof startDate !== "undefined") {
    if (typeof startDate !== "string") {
      return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
    }
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid startDate format" }, { status: 400 });
    }
    data.startDate = start;
  }

  if (typeof endDate !== "undefined") {
    if (typeof endDate !== "string") {
      return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
    }
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
    }
    data.endDate = end;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    if (data.startDate instanceof Date && data.endDate instanceof Date) {
      if (data.endDate < data.startDate) {
        return NextResponse.json(
          { error: "endDate must be on or after startDate" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data,
    });

    return NextResponse.json({ milestone: updated });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing milestone id" }, { status: 400 });
  }

  try {
    await prisma.milestone.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
