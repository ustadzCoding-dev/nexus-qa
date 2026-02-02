import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

  const { name, strategy } = body as {
    name?: string;
    strategy?: string | null;
  };

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const trimmedName = name.trim().slice(0, 200);

  let trimmedStrategy: string | null = null;
  if (typeof strategy === "string") {
    const s = strategy.trim();
    trimmedStrategy = s.length > 0 ? s : null;
  }

  try {
    const created = await prisma.project.create({
      data: {
        name: trimmedName,
        strategy: trimmedStrategy,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
