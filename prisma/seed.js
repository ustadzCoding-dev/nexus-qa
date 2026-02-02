const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.project.findFirst({
    where: { name: "NexusQA Demo Project" },
  });

  if (existing) {
    console.log("Demo project already exists, skipping seed.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "NexusQA Demo Project",
      strategy:
        "Demo project showcasing ISO/IEC/IEEE 29119 traceability from requirements to execution.",
    },
  });

  console.log("Created project:", project.id);

  const milestone = await prisma.milestone.create({
    data: {
      name: "Sprint 1 - Authentication",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: project.id,
    },
  });

  console.log("Created milestone:", milestone.id);

  const reqLogin = await prisma.requirement.create({
    data: {
      code: "REQ-001",
      title: "User can login with valid credentials",
      description: "Valid users should be able to login and land on the dashboard.",
      projectId: project.id,
    },
  });

  const reqInvalid = await prisma.requirement.create({
    data: {
      code: "REQ-002",
      title: "Login should show error for invalid credentials",
      description: "Invalid credentials must not allow access and must show a clear error message.",
      projectId: project.id,
    },
  });

  const reqLockout = await prisma.requirement.create({
    data: {
      code: "REQ-003",
      title: "Account is locked after multiple failed attempts",
      description: "After N failed attempts, the account should be temporarily locked.",
      projectId: project.id,
    },
  });

  console.log("Created requirements:", reqLogin.id, reqInvalid.id, reqLockout.id);

  const suite = await prisma.testSuite.create({
    data: {
      title: "Authentication - Login",
      description: "Scenarios around login behaviour.",
      projectId: project.id,
    },
  });

  console.log("Created suite:", suite.id);

  const loginCase = await prisma.testCase.create({
    data: {
      title: "Login with valid email and password",
      preCondition: "User exists and is active.",
      priority: "P1",
      suiteId: suite.id,
      requirements: {
        connect: [{ id: reqLogin.id }],
      },
      steps: {
        create: [
          {
            order: 1,
            action: "Open the app and navigate to Login screen",
            expected: "Login screen is displayed.",
          },
          {
            order: 2,
            action: "Enter valid email and password",
            expected: "Credentials are accepted.",
          },
          {
            order: 3,
            action: "Tap Login button",
            expected: "User is redirected to dashboard.",
          },
        ],
      },
    },
  });

  const invalidCase = await prisma.testCase.create({
    data: {
      title: "Login with invalid password",
      preCondition: "User exists.",
      priority: "P2",
      suiteId: suite.id,
      requirements: {
        connect: [{ id: reqInvalid.id }],
      },
      steps: {
        create: [
          {
            order: 1,
            action: "Open the app and navigate to Login screen",
            expected: "Login screen is displayed.",
          },
          {
            order: 2,
            action: "Enter valid email and invalid password",
            expected: "Credentials are rejected.",
          },
          {
            order: 3,
            action: "Tap Login button",
            expected: "Error message is shown and user stays on login page.",
          },
        ],
      },
    },
  });

  const lockoutCase = await prisma.testCase.create({
    data: {
      title: "Account lockout after multiple failed attempts",
      preCondition: "User exists and is active.",
      priority: "P2",
      suiteId: suite.id,
      requirements: {
        connect: [{ id: reqLockout.id }, { id: reqInvalid.id }],
      },
      steps: {
        create: [
          {
            order: 1,
            action: "Attempt login with invalid password 5 times",
            expected: "Account becomes locked.",
          },
          {
            order: 2,
            action: "Try login again with valid credentials",
            expected: "User cannot login and sees lockout message.",
          },
        ],
      },
    },
  });

  console.log("Created test cases:", loginCase.id, invalidCase.id, lockoutCase.id);

  await prisma.testData.createMany({
    data: [
      {
        key: "valid_user_email",
        value: "demo@nexusqa.local",
        projectId: project.id,
      },
      {
        key: "valid_user_password",
        value: "Password123!",
        projectId: project.id,
      },
      {
        key: "invalid_password",
        value: "WrongPass!",
        projectId: project.id,
      },
    ],
  });

  console.log("Created test data library entries.");

  const run = await prisma.testRun.create({
    data: {
      name: "Demo Run - Authentication",
      environment: "Staging",
    },
  });

  console.log("Created test run:", run.id);

  const passedResult = await prisma.testResult.create({
    data: {
      testRunId: run.id,
      testCaseId: loginCase.id,
      status: "PASSED",
      actualResult: "User was redirected to dashboard.",
    },
  });

  const failedResult = await prisma.testResult.create({
    data: {
      testRunId: run.id,
      testCaseId: invalidCase.id,
      status: "FAILED",
      actualResult: "No error message was shown.",
    },
  });

  await prisma.testResult.create({
    data: {
      testRunId: run.id,
      testCaseId: lockoutCase.id,
      status: "BLOCKED",
      actualResult: "Lockout flow not fully implemented.",
    },
  });

  console.log("Created test results.");

  const defect = await prisma.defect.create({
    data: {
      title: "No error message for invalid login",
      severity: "Major",
      status: "OPEN",
      evidenceUrl: null,
      testResultId: failedResult.id,
    },
  });

  console.log("Created defect:", defect.id);

  console.log("Demo data seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
