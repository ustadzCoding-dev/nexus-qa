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

  const { code, title, description } = body as {
    code?: string;
    title?: string;
    description?: string | null;
  };

  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Requirement code is required" }, { status: 400 });
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Requirement title is required" }, { status: 400 });
  }

  const trimmedCode = code.trim().slice(0, 100);
  const trimmedTitle = title.trim().slice(0, 200);

  let trimmedDescription: string | null = null;
  if (typeof description === "string") {
    const d = description.trim();
    trimmedDescription = d.length > 0 ? d : null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const created = await prisma.requirement.create({
      data: {
        code: trimmedCode,
        title: trimmedTitle,
        description: trimmedDescription,
        projectId: id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
