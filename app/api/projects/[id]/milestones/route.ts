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
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
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

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Milestone name is required" }, { status: 400 });
  }

  if (!startDate || typeof startDate !== "string") {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }

  if (!endDate || typeof endDate !== "string") {
    return NextResponse.json({ error: "endDate is required" }, { status: 400 });
  }

  const trimmedName = name.trim().slice(0, 200);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (end < start) {
    return NextResponse.json({ error: "endDate must be on or after startDate" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const milestone = await prisma.milestone.create({
      data: {
        name: trimmedName,
        startDate: start,
        endDate: end,
        projectId: id,
      },
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
