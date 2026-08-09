/** Static product defaults. Company branding, currency, and the live pipeline
 * are stored in SQLite and editable from Settings. */
export const TRACKER_CONFIG = {
  product: {
    name: "Project Ledger",
    tagline: "Projects, deadlines and payments",
  },

  defaultSettings: {
    companyName: "Your Company",
    logoSrc: "",
    symbol: "$",
    code: "USD",
    minorUnitsPerMajor: 100,
    fractionDigits: 2,
    onboardingComplete: false,
  },

  atRiskDays: 3,
  dueThisWeekDays: 6,

  defaultStages: [
    "Discovery",
    "Proposal",
    "Planning",
    "In progress",
    "Client review",
    "Revisions",
    "Ready to deliver",
    "Completed",
  ],

  serviceTypes: [
    "Advisory engagement",
    "Research project",
    "Data analysis",
    "Editing and review",
    "Custom",
  ],

  paymentMethods: ["Bank transfer", "Cash", "Mobile payment", "Card", "Other"],
} as const;

export type ServiceType = (typeof TRACKER_CONFIG.serviceTypes)[number];
export type PaymentMethod = (typeof TRACKER_CONFIG.paymentMethods)[number];
