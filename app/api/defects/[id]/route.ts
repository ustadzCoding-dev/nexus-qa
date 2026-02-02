import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing defect id" }, { status: 400 });
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

  const { status } = body as { status?: string };

  if (!status || !ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  try {
    const updated = await prisma.defect.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ defect: updated });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
