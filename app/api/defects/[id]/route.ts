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

  const { status, title, description, severity, evidenceUrl } = body as {
    status?: string;
    title?: string;
    description?: string | null;
    severity?: string;
    evidenceUrl?: string | null;
  };

  const data: Record<string, unknown> = {};

  if (typeof status !== "undefined") {
    if (!status || !ALLOWED_STATUSES.includes(status as AllowedStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    data.status = status;
  }

  if (typeof title !== "undefined") {
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    data.title = title.trim().slice(0, 200);
  }

  if (typeof description !== "undefined") {
    if (description === null) {
      data.description = null;
    } else if (typeof description === "string") {
      const d = description.trim();
      data.description = d.length > 0 ? d : null;
    } else {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
  }

  if (typeof severity !== "undefined") {
    if (typeof severity !== "string" || !severity.trim()) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }
    data.severity = severity.trim().slice(0, 50);
  }

  if (typeof evidenceUrl !== "undefined") {
    if (evidenceUrl === null) {
      data.evidenceUrl = null;
    } else if (typeof evidenceUrl === "string") {
      const e = evidenceUrl.trim();
      data.evidenceUrl = e.length > 0 ? e : null;
    } else {
      return NextResponse.json({ error: "Invalid evidenceUrl" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.defect.update({
      where: { id },
      data,
    });

    return NextResponse.json({ defect: updated });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
