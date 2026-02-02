import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing test case id" }, { status: 400 });
  }

  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      select: {
        title: true,
        automationYaml: true,
      },
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    if (!testCase.automationYaml) {
      return NextResponse.json(
        { error: "No automation YAML generated for this test case" },
        { status: 400 },
      );
    }

    const safeTitle = testCase.title.replace(/[^a-zA-Z0-9_-]+/g, "-") || "test-case";
    const filename = `${safeTitle}.yaml`;

    return new NextResponse(testCase.automationYaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
