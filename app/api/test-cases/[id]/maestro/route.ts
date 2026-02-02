import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function yamlEscape(value: string): string {
  return value.replace(/"/g, "\\\"");
}

function buildMaestroYaml(testCase: any): string {
  const lines: string[] = [];

  lines.push(`name: "${yamlEscape(testCase.title)}"`);

  if (testCase.suite?.project?.name) {
    lines.push(`project: "${yamlEscape(testCase.suite.project.name)}"`);
  }

  if (testCase.suite?.title) {
    lines.push(`suite: "${yamlEscape(testCase.suite.title)}"`);
  }

  if (Array.isArray(testCase.requirements) && testCase.requirements.length > 0) {
    const codes = testCase.requirements
      .map((req: any) => req.code)
      .filter((code: string | null | undefined) => !!code)
      .join(", ");
    if (codes) {
      lines.push(`requirements: "${yamlEscape(codes)}"`);
    }
  }

  lines.push("steps:");

  for (const step of testCase.steps || []) {
    const action: string = typeof step.action === "string" ? step.action : "";
    const lower = action.toLowerCase().trim();

    if (lower.startsWith("klik ") || lower.startsWith("click ")) {
      const target = action.slice(action.indexOf(" ") + 1).trim() || action;
      lines.push(`  - tapOn: "${yamlEscape(target)}"`);
      continue;
    }

    if (
      lower.startsWith("isi ") ||
      lower.startsWith("input ") ||
      lower.startsWith("ketik ")
    ) {
      const text = action.slice(action.indexOf(" ") + 1).trim() || action;
      lines.push(`  - inputText: "${yamlEscape(text)}"`);
      continue;
    }

    lines.push(`  - comment: "${yamlEscape(action || `Step ${step.order}`)}"`);
  }

  if (Array.isArray(testCase.steps) && testCase.steps.length === 0) {
    lines.push("  - comment: \"No defined steps; manual execution only.\"");
  }

  return lines.join("\n");
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing test case id" }, { status: 400 });
  }

  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        suite: {
          include: {
            project: true,
          },
        },
        requirements: true,
      },
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    const automationYaml = buildMaestroYaml(testCase);

    await prisma.testCase.update({
      where: { id },
      data: { automationYaml },
    });

    return NextResponse.json({ automationYaml });
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
