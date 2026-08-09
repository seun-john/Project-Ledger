/** Seeds default stages and, with --demo, unmistakably fictional sample data. */
import { PrismaClient } from "@prisma/client";
import { TRACKER_CONFIG } from "../src/config/tracker.config";

const prisma = new PrismaClient();
const withDemo = process.argv.includes("--demo");
const toMinor = (amount: number) => amount * TRACKER_CONFIG.defaultSettings.minorUnitsPerMajor;

function offsetDays(days: number): Date {
  const now = new Date();
  const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(base + days * 86_400_000);
}

const DEMO_PROJECTS = [
  {
    clientName: "Sample Client A",
    clientContact: "client-a@example.invalid",
    projectTitle: "Example customer onboarding research",
    serviceType: "Research project",
    stageName: "In progress",
    totalFee: 12_000,
    nextDeadline: offsetDays(3),
    notes: "Fictional demo: interview synthesis is ready for review.",
    payments: [{ amount: 6_000, method: "Bank transfer", note: "Demo deposit" }],
  },
  {
    clientName: "Sample Client B",
    clientContact: "client-b@example.invalid",
    projectTitle: "Placeholder operations improvement plan",
    serviceType: "Advisory engagement",
    stageName: "Proposal",
    totalFee: 8_500,
    nextDeadline: offsetDays(-2),
    notes: "Fictional demo: proposal awaiting sample feedback.",
    payments: [],
  },
  {
    clientName: "Demo Organisation C",
    clientContact: "contact-c@example.invalid",
    projectTitle: "Illustrative market data analysis",
    serviceType: "Data analysis",
    stageName: "Client review",
    totalFee: 5_000,
    nextDeadline: offsetDays(7),
    notes: "Fictional demo: dashboard draft shared with the sample client.",
    payments: [{ amount: 5_000, method: "Card", note: "Demo full payment" }],
  },
  {
    clientName: "Example Studio D",
    clientContact: "studio-d@example.invalid",
    projectTitle: "Sample policy document review",
    serviceType: "Editing and review",
    stageName: "Revisions",
    totalFee: 2_400,
    nextDeadline: offsetDays(12),
    notes: "Fictional demo: final placeholder edits are being applied.",
    payments: [{ amount: 1_200, method: "Bank transfer", note: "Demo deposit" }],
  },
  {
    clientName: "Placeholder Partner E",
    clientContact: "partner-e@example.invalid",
    projectTitle: "Demonstration project delivery roadmap",
    serviceType: "Custom",
    stageName: "Planning",
    totalFee: 15_000,
    nextDeadline: offsetDays(18),
    notes: "Fictional demo: milestones use invented dates and organisations.",
    payments: [{ amount: 3_750, method: "Mobile payment", note: "Demo deposit" }],
  },
  {
    clientName: "Sample Client F",
    clientContact: "client-f@example.invalid",
    projectTitle: "Example quarterly insight report",
    serviceType: "Research project",
    stageName: "Ready to deliver",
    totalFee: 9_000,
    nextDeadline: offsetDays(1),
    notes: "Fictional demo: report package is ready for sample delivery.",
    payments: [{ amount: 9_000, method: "Bank transfer", note: "Demo full payment" }],
  },
  {
    clientName: "Demo Company G",
    clientContact: "company-g@example.invalid",
    projectTitle: "Placeholder service design workshop",
    serviceType: "Advisory engagement",
    stageName: "Discovery",
    totalFee: 6_500,
    nextDeadline: offsetDays(25),
    notes: "Fictional demo: discovery session has not yet taken place.",
    payments: [],
  },
  {
    clientName: "Example Client H",
    clientContact: "client-h@example.invalid",
    projectTitle: "Completed demonstration engagement",
    serviceType: "Custom",
    stageName: "Completed",
    totalFee: 4_000,
    nextDeadline: offsetDays(-20),
    notes: "Fictional demo: completed record for showing archive behaviour.",
    payments: [{ amount: 4_000, method: "Other", note: "Demo full payment" }],
  },
];

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: TRACKER_CONFIG.defaultSettings.companyName,
      logoSrc: TRACKER_CONFIG.defaultSettings.logoSrc,
      currencyCode: TRACKER_CONFIG.defaultSettings.code,
      currencySymbol: TRACKER_CONFIG.defaultSettings.symbol,
      minorUnitsPerMajor: TRACKER_CONFIG.defaultSettings.minorUnitsPerMajor,
      fractionDigits: TRACKER_CONFIG.defaultSettings.fractionDigits,
      onboardingComplete: false,
    },
  });

  if ((await prisma.stage.count()) === 0) {
    await prisma.stage.createMany({
      data: TRACKER_CONFIG.defaultStages.map((name, position) => ({ name, position, ownerId: null })),
    });
    console.log(`Seeded ${TRACKER_CONFIG.defaultStages.length} pipeline stages.`);
  }

  if (!withDemo) {
    console.log("Done. Run `npm run db:seed:demo` to add fictional sample projects.");
    return;
  }

  if ((await prisma.project.count()) > 0) {
    console.log("Projects already exist; fictional demo data was skipped.");
    return;
  }

  const stages = await prisma.stage.findMany();
  const stageIdByName = new Map(stages.map((stage) => [stage.name, stage.id]));

  for (const project of DEMO_PROJECTS) {
    const stageId = stageIdByName.get(project.stageName);
    if (!stageId) continue;

    await prisma.project.create({
      data: {
        ownerId: null,
        clientName: project.clientName,
        clientContact: project.clientContact,
        projectTitle: project.projectTitle,
        serviceType: project.serviceType,
        stageId,
        totalFeeMinor: toMinor(project.totalFee),
        startDate: offsetDays(-30),
        nextDeadline: project.nextDeadline,
        defenceDate: null,
        notes: project.notes,
        payments: {
          create: project.payments.map((payment) => ({
            amountMinor: toMinor(payment.amount),
            date: offsetDays(-14),
            method: payment.method,
            note: payment.note,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${DEMO_PROJECTS.length} fictional demo projects.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
