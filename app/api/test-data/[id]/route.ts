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
    return NextResponse.json({ error: "Missing test data id" }, { status: 400 });
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

  const data: Record<string, unknown> = {};

  if (typeof key !== "undefined") {
    if (typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    data.key = key.trim().slice(0, 200);
  }

  if (typeof value !== "undefined") {
    if (typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }
    data.value = value.trim().slice(0, 2000);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.testData.update({
      where: { id },
      data,
    });

    return NextResponse.json({ testData: updated });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing test data id" }, { status: 400 });
  }

  try {
    await prisma.testData.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
