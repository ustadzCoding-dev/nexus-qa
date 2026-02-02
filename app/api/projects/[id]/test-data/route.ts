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

  const { key, value } = body as {
    key?: string;
    value?: string;
  };

  if (!key || typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "Test data key is required" }, { status: 400 });
  }

  if (!value || typeof value !== "string" || !value.trim()) {
    return NextResponse.json({ error: "Test data value is required" }, { status: 400 });
  }

  const trimmedKey = key.trim().slice(0, 200);
  const trimmedValue = value.trim().slice(0, 2000);

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const created = await prisma.testData.create({
      data: {
        key: trimmedKey,
        value: trimmedValue,
        projectId: id,
      },
    });

    return NextResponse.json({ testData: created }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
