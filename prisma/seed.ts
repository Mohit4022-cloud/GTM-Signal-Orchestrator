import {
  AccountStatus,
  AccountTier,
  AuditEventType,
  Geography,
  LeadStatus,
  LifecycleStage,
  Prisma,
  PrismaClient,
  RoutingReason,
  ScoreComponent,
  ScoreEntityType,
  Segment,
  SignalStatus,
  SignalType,
  TaskPriority,
  TaskStatus,
  TaskType,
  Temperature,
} from "@prisma/client";

import { sqliteAdapter } from "../lib/prisma-adapter";

const prisma = new PrismaClient({
  adapter: sqliteAdapter,
});

const baseDate = new Date("2026-03-26T15:00:00.000Z");

const addHours = (date: Date, hours: number) =>
  new Date(date.getTime() + hours * 60 * 60 * 1000);
const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);
const subDays = (date: Date, days: number) =>
  new Date(date.getTime() - days * 24 * 60 * 60 * 1000);

const userSeed = [
  {
    id: "usr_amelia_ross",
    name: "Amelia Ross",
    email: "amelia.ross@gtmso.local",
    role: "SDR Manager",
    team: "North America East",
    geography: Geography.NA_EAST,
    title: "SDR Manager",
    avatarColor: "#0f766e",
  },
  {
    id: "usr_dante_kim",
    name: "Dante Kim",
    email: "dante.kim@gtmso.local",
    role: "Account Executive",
    team: "North America West",
    geography: Geography.NA_WEST,
    title: "Mid-Market AE",
    avatarColor: "#b66a1d",
  },
  {
    id: "usr_priya_singh",
    name: "Priya Singh",
    email: "priya.singh@gtmso.local",
    role: "RevOps Lead",
    team: "Revenue Operations",
    geography: Geography.EMEA,
    title: "RevOps Lead",
    avatarColor: "#0f172a",
  },
  {
    id: "usr_elena_morales",
    name: "Elena Morales",
    email: "elena.morales@gtmso.local",
    role: "Strategic AE",
    team: "Strategic Accounts",
    geography: Geography.NA_EAST,
    title: "Strategic Account Executive",
    avatarColor: "#7c3aed",
  },
  {
    id: "usr_miles_turner",
    name: "Miles Turner",
    email: "miles.turner@gtmso.local",
    role: "SDR",
    team: "North America West",
    geography: Geography.NA_WEST,
    title: "Senior SDR",
    avatarColor: "#1d4ed8",
  },
  {
    id: "usr_noor_haddad",
    name: "Noor Haddad",
    email: "noor.haddad@gtmso.local",
    role: "SDR",
    team: "EMEA Pod",
    geography: Geography.EMEA,
    title: "Enterprise SDR",
    avatarColor: "#2563eb",
  },
  {
    id: "usr_tessa_liu",
    name: "Tessa Liu",
    email: "tessa.liu@gtmso.local",
    role: "Growth Ops",
    team: "APAC Growth",
    geography: Geography.APAC,
    title: "Growth Operations Manager",
    avatarColor: "#059669",
  },
  {
    id: "usr_owen_brooks",
    name: "Owen Brooks",
    email: "owen.brooks@gtmso.local",
    role: "Sales Ops Analyst",
    team: "Revenue Operations",
    geography: Geography.NA_EAST,
    title: "Sales Operations Analyst",
    avatarColor: "#475569",
  },
  {
    id: "usr_hana_cho",
    name: "Hana Cho",
    email: "hana.cho@gtmso.local",
    role: "Enterprise AE",
    team: "APAC Enterprise",
    geography: Geography.APAC,
    title: "Enterprise Account Executive",
    avatarColor: "#c2410c",
  },
  {
    id: "usr_leo_grant",
    name: "Leo Grant",
    email: "leo.grant@gtmso.local",
    role: "RevOps Analyst",
    team: "Revenue Operations",
    geography: Geography.NA_WEST,
    title: "RevOps Analyst",
    avatarColor: "#334155",
  },
];

const ownerPool = [
  "usr_dante_kim",
  "usr_miles_turner",
  "usr_noor_haddad",
  "usr_elena_morales",
  "usr_hana_cho",
  "usr_amelia_ross",
] as const;

const accountBlueprints = [
  ["acc_aperture_robotics", "Aperture Robotics", "aperturerobotics.com", "Manufacturing"],
  ["acc_cedarbridge_health", "CedarBridge Health", "cedarbridgehealth.com", "Healthcare"],
  ["acc_northstar_analytics", "Northstar Analytics", "northstaranalytics.com", "SaaS"],
  ["acc_meridian_freight", "Meridian Freight Cloud", "meridianfreightcloud.com", "Logistics"],
  ["acc_forgeworks_industrial", "Forgeworks Industrial", "forgeworksindustrial.com", "Manufacturing"],
  ["acc_brightharbor_retail", "BrightHarbor Retail", "brightharborretail.com", "Retail"],
  ["acc_atlas_grid", "Atlas Grid Systems", "atlasgridsystems.com", "Energy"],
  ["acc_summitflow_finance", "SummitFlow Finance", "summitflowfinance.com", "Fintech"],
  ["acc_latticebio", "LatticeBio Labs", "latticebio.com", "Healthcare"],
  ["acc_signalnest", "SignalNest Software", "signalnestsoftware.com", "SaaS"],
  ["acc_paragon_freight", "Paragon Freight", "paragonfreight.io", "Logistics"],
  ["acc_rivetstack", "RivetStack Automation", "rivetstackautomation.com", "Manufacturing"],
  ["acc_harborpoint", "HarborPoint SaaS", "harborpointsaas.com", "SaaS"],
  ["acc_beaconops", "BeaconOps Partners", "beaconopspartners.com", "Professional Services"],
  ["acc_novachannel", "NovaChannel Commerce", "novachannelcommerce.com", "Retail"],
  ["acc_pinecrest", "Pinecrest Labs", "pinecrestlabs.com", "Healthcare"],
  ["acc_alloyworks", "AlloyWorks Cloud", "alloyworkscloud.com", "Manufacturing"],
  ["acc_bluemesa", "BlueMesa Tech", "bluemesatech.com", "SaaS"],
  ["acc_frontier_retail", "Frontier Retail Systems", "frontierretailsystems.com", "Retail"],
  ["acc_cedar_loop", "Cedar Loop Finance", "cedarloopfinance.com", "Fintech"],
  ["acc_orbitiq", "OrbitIQ Security", "orbitiqsecurity.com", "Cybersecurity"],
  ["acc_ironpeak", "Iron Peak Manufacturing", "ironpeakmfg.com", "Manufacturing"],
  ["acc_driftline", "Driftline Energy", "driftlineenergy.com", "Energy"],
  ["acc_veritypulse", "VerityPulse Health", "veritypulsehealth.com", "Healthcare"],
] as const;

const segments = [
  Segment.SMB,
  Segment.SMB,
  Segment.MID_MARKET,
  Segment.MID_MARKET,
  Segment.ENTERPRISE,
  Segment.ENTERPRISE,
  Segment.SMB,
  Segment.STRATEGIC,
  Segment.MID_MARKET,
  Segment.MID_MARKET,
  Segment.ENTERPRISE,
  Segment.ENTERPRISE,
  Segment.MID_MARKET,
  Segment.SMB,
  Segment.SMB,
  Segment.MID_MARKET,
  Segment.ENTERPRISE,
  Segment.ENTERPRISE,
  Segment.SMB,
  Segment.MID_MARKET,
  Segment.STRATEGIC,
  Segment.STRATEGIC,
  Segment.ENTERPRISE,
  Segment.STRATEGIC,
] as const;

const geographies = [
  Geography.NA_EAST,
  Geography.NA_EAST,
  Geography.NA_WEST,
  Geography.NA_EAST,
  Geography.EMEA,
  Geography.NA_WEST,
  Geography.NA_WEST,
  Geography.NA_EAST,
  Geography.EMEA,
  Geography.NA_WEST,
  Geography.EMEA,
  Geography.APAC,
  Geography.NA_WEST,
  Geography.NA_EAST,
  Geography.NA_WEST,
  Geography.APAC,
  Geography.EMEA,
  Geography.NA_WEST,
  Geography.NA_EAST,
  Geography.NA_EAST,
  Geography.EMEA,
  Geography.APAC,
  Geography.APAC,
  Geography.NA_EAST,
] as const;

const lifecycleStages = [
  LifecycleStage.PROSPECT,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.PROSPECT,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.ENGAGED,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.NURTURE,
  LifecycleStage.PROSPECT,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.CUSTOMER,
  LifecycleStage.ENGAGED,
  LifecycleStage.ENGAGED,
  LifecycleStage.SALES_READY,
  LifecycleStage.SALES_READY,
  LifecycleStage.CUSTOMER,
  LifecycleStage.SALES_READY,
] as const;

const accountStatuses = [
  AccountStatus.WATCH,
  AccountStatus.HEALTHY,
  AccountStatus.HOT,
  AccountStatus.WATCH,
  AccountStatus.HOT,
  AccountStatus.HEALTHY,
  AccountStatus.WATCH,
  AccountStatus.HOT,
  AccountStatus.HEALTHY,
  AccountStatus.WATCH,
  AccountStatus.HOT,
  AccountStatus.WATCH,
  AccountStatus.HOT,
  AccountStatus.AT_RISK,
  AccountStatus.WATCH,
  AccountStatus.HEALTHY,
  AccountStatus.HOT,
  AccountStatus.HEALTHY,
  AccountStatus.WATCH,
  AccountStatus.WATCH,
  AccountStatus.HOT,
  AccountStatus.HOT,
  AccountStatus.HEALTHY,
  AccountStatus.HOT,
] as const;

const overallScores = [
  63, 58, 88, 67, 86, 55, 61, 92, 64, 69, 84, 73, 89, 44, 57, 62, 85, 78, 60,
  66, 90, 94, 74, 87,
] as const;

const fitScores = [
  22, 20, 27, 23, 29, 18, 22, 28, 21, 24, 26, 25, 28, 15, 19, 20, 27, 25, 21,
  24, 28, 30, 24, 29,
] as const;

const employeeCounts = [
  180, 230, 420, 360, 1600, 900, 210, 4200, 580, 410, 1400, 1120, 510, 140,
  190, 700, 1500, 980, 260, 340, 3200, 5100, 2200, 2800,
] as const;

const revenueBands = [
  "$20M-$50M",
  "$20M-$50M",
  "$50M-$100M",
  "$50M-$100M",
  "$250M-$500M",
  "$100M-$250M",
  "$20M-$50M",
  "$500M+",
  "$50M-$100M",
  "$50M-$100M",
  "$250M-$500M",
  "$250M-$500M",
  "$100M-$250M",
  "$10M-$20M",
  "$20M-$50M",
  "$50M-$100M",
  "$250M-$500M",
  "$100M-$250M",
  "$20M-$50M",
  "$50M-$100M",
  "$500M+",
  "$500M+",
  "$500M+",
  "$500M+",
] as const;

const getAccountTier = (segment: Segment): AccountTier => {
  if (segment === Segment.STRATEGIC) return AccountTier.STRATEGIC;
  if (segment === Segment.ENTERPRISE) return AccountTier.TIER_1;
  if (segment === Segment.MID_MARKET) return AccountTier.TIER_2;
  return AccountTier.TIER_3;
};

const getTemperature = (score: number): Temperature => {
  if (score >= 90) return Temperature.URGENT;
  if (score >= 80) return Temperature.HOT;
  if (score >= 65) return Temperature.WARM;
  return Temperature.COLD;
};

const getLeadStatus = (temperature: Temperature): LeadStatus => {
  if (temperature === Temperature.URGENT) return LeadStatus.QUALIFIED;
  if (temperature === Temperature.HOT) return LeadStatus.WORKING;
  if (temperature === Temperature.WARM) return LeadStatus.NEW;
  return LeadStatus.NURTURING;
};

const getSlaHours = (temperature: Temperature) => {
  if (temperature === Temperature.URGENT) return 1;
  if (temperature === Temperature.HOT) return 4;
  if (temperature === Temperature.WARM) return 12;
  return 24;
};

const signalTriples = [
  {
    second: SignalType.PRICING_PAGE_VISIT,
    third: SignalType.FORM_FILL,
    fourth: SignalType.MEETING_BOOKED,
  },
  {
    second: SignalType.HIGH_INTENT_CLUSTER,
    third: SignalType.WEBINAR_REGISTRATION,
    fourth: SignalType.EMAIL_REPLY,
  },
  {
    second: SignalType.PRICING_PAGE_VISIT,
    third: SignalType.PRODUCT_SIGNUP,
    fourth: SignalType.PRODUCT_USAGE_MILESTONE,
  },
  {
    second: SignalType.THIRD_PARTY_INTENT,
    third: SignalType.FORM_FILL,
    fourth: SignalType.MANUAL_SALES_NOTE,
  },
] as const;

const contactFirstNames = [
  "Avery",
  "Jordan",
  "Sofia",
  "Micah",
  "Leah",
  "Marcus",
  "Priyanka",
  "Julian",
  "Rhea",
  "Noah",
  "Keira",
  "Tobias",
  "Mina",
  "Caleb",
  "Lina",
  "Isaac",
  "Zara",
  "Ethan",
  "Anika",
  "Kai",
  "Nina",
  "Omar",
  "Talia",
  "Reid",
] as const;

const contactLastNames = [
  "Bennett",
  "Park",
  "Velasquez",
  "Khan",
  "Murphy",
  "Hale",
  "Patel",
  "Brooks",
  "Sato",
  "Miller",
  "Nguyen",
  "Wright",
  "Costa",
  "Reyes",
  "Ibrahim",
  "Cole",
  "Foster",
  "Kim",
  "Sullivan",
  "Grant",
  "Parker",
  "Lopez",
  "Chen",
  "Diaz",
] as const;

function contactName(index: number, offset: number) {
  return {
    firstName: contactFirstNames[(index + offset) % contactFirstNames.length],
    lastName: contactLastNames[(index * 3 + offset) % contactLastNames.length],
  };
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.routingDecision.deleteMany();
  await prisma.scoreHistory.deleteMany();
  await prisma.signalEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.ruleConfig.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({ data: userSeed });

  const accounts = accountBlueprints.map(([id, name, domain, industry], index) => ({
    id,
    name,
    domain,
    industry,
    segment: segments[index],
    geography: geographies[index],
    employeeCount: employeeCounts[index],
    annualRevenueBand: revenueBands[index],
    namedOwnerId: ownerPool[index % ownerPool.length],
    accountTier: getAccountTier(segments[index]),
    lifecycleStage: lifecycleStages[index],
    fitScore: fitScores[index],
    overallScore: overallScores[index],
    status: accountStatuses[index],
    createdAt: subDays(baseDate, 45 - index),
    updatedAt: subDays(baseDate, index % 6),
  }));

  await prisma.account.createMany({ data: accounts });

  const contacts = accounts.flatMap((account, index) => {
    const primary = contactName(index, 0);
    const secondary = contactName(index, 7);

    return [
      {
        id: `${account.id}_contact_01`,
        accountId: account.id,
        firstName: primary.firstName,
        lastName: primary.lastName,
        email: `${primary.firstName}.${primary.lastName}@${account.domain}`.toLowerCase(),
        title: "Head of Revenue Operations",
        department: "Revenue Operations",
        seniority: "Director",
        phone: `+1-303-555-${String(1100 + index).padStart(4, "0")}`,
        personaType: "RevOps",
        createdAt: subDays(baseDate, 40 - index),
        updatedAt: subDays(baseDate, index % 4),
      },
      {
        id: `${account.id}_contact_02`,
        accountId: account.id,
        firstName: secondary.firstName,
        lastName: secondary.lastName,
        email: `${secondary.firstName}.${secondary.lastName}@${account.domain}`.toLowerCase(),
        title: index % 2 === 0 ? "Director of Growth" : "VP, Sales Development",
        department: index % 2 === 0 ? "Marketing" : "Sales",
        seniority: "Director",
        phone: `+1-415-555-${String(2100 + index).padStart(4, "0")}`,
        personaType: index % 2 === 0 ? "Demand Gen" : "Sales Leadership",
        createdAt: subDays(baseDate, 38 - index),
        updatedAt: subDays(baseDate, (index + 1) % 5),
      },
    ];
  });

  await prisma.contact.createMany({ data: contacts });

  const baseLeads = accounts.map((account, index) => {
    const createdAt = subDays(baseDate, 12 - (index % 10));
    const temperature = getTemperature(account.overallScore);
    const routedAt = addMinutes(createdAt, 20 + (index % 4) * 15);
    const slaDeadlineAt = addHours(createdAt, getSlaHours(temperature));
    const firstResponseAt =
      index % 5 === 0 ? null : addMinutes(routedAt, 20 + (index % 3) * 25);

    return {
      id: `${account.id}_lead_01`,
      accountId: account.id,
      contactId: `${account.id}_contact_01`,
      source: [
        "Inbound demo",
        "Pricing page",
        "Webinar",
        "Product sign-up",
        "Intent surge",
        "Partner referral",
      ][index % 6],
      inboundType: index % 3 === 0 ? "Inbound" : index % 3 === 1 ? "Product-led" : "Signal-driven",
      currentOwnerId: account.namedOwnerId,
      status: getLeadStatus(temperature),
      score: Math.max(32, account.overallScore - (index % 8)),
      temperature,
      slaDeadlineAt,
      firstResponseAt,
      routedAt,
      createdAt,
      updatedAt: addHours(createdAt, 4),
    };
  });

  const extraLeadAccounts = [accounts[2], accounts[7], accounts[12], accounts[21]];
  const extraLeads = extraLeadAccounts.map((account, index) => {
    const createdAt = subDays(baseDate, 2 + index);
    const routedAt = addMinutes(createdAt, 10 + index * 7);
    return {
      id: `${account.id}_lead_02`,
      accountId: account.id,
      contactId: `${account.id}_contact_02`,
      source: "High-intent revisit",
      inboundType: "Signal-driven",
      currentOwnerId: account.namedOwnerId,
      status: LeadStatus.WORKING,
      score: Math.min(99, account.overallScore + 3),
      temperature: Temperature.HOT,
      slaDeadlineAt: addHours(createdAt, 4),
      firstResponseAt: index % 2 === 0 ? addMinutes(routedAt, 25) : null,
      routedAt,
      createdAt,
      updatedAt: addHours(createdAt, 3),
    };
  });

  const leads = [...baseLeads, ...extraLeads];
  await prisma.lead.createMany({ data: leads });

  const signalEvents = accounts.flatMap((account, index) => {
    const leadId = `${account.id}_lead_01`;
    const contactId = `${account.id}_contact_01`;
    const bundle = signalTriples[index % signalTriples.length];
    const unmatchedEvent = index >= accounts.length - 4;

    return [
      {
        id: `${account.id}_signal_01`,
        sourceSystem: "Web",
        eventType: SignalType.WEBSITE_VISIT,
        accountId: account.id,
        contactId,
        leadId,
        rawPayloadJson: { page: "/solutions", utmSource: "organic" },
        normalizedPayloadJson: { pageCluster: "awareness", signalStrength: "low" },
        occurredAt: subDays(baseDate, 13 - (index % 4)),
        receivedAt: subDays(baseDate, 13 - (index % 4)),
        dedupeKey: `${account.id}_web_01`,
        status: SignalStatus.MATCHED,
      },
      {
        id: `${account.id}_signal_02`,
        sourceSystem: index % 2 === 0 ? "Web" : "Intent",
        eventType: bundle.second,
        accountId: account.id,
        contactId,
        leadId,
        rawPayloadJson: { page: "/pricing", source: index % 2 === 0 ? "session" : "bombora" },
        normalizedPayloadJson: { pageCluster: "high-intent", signalStrength: "medium" },
        occurredAt: subDays(baseDate, 8 - (index % 3)),
        receivedAt: subDays(baseDate, 8 - (index % 3)),
        dedupeKey: `${account.id}_web_02`,
        status: SignalStatus.MATCHED,
      },
      {
        id: `${account.id}_signal_03`,
        sourceSystem: bundle.third === SignalType.PRODUCT_SIGNUP ? "Product" : "Marketing",
        eventType: bundle.third,
        accountId: account.id,
        contactId,
        leadId,
        rawPayloadJson: { campaign: "q1-demand-surge", form: "request-demo" },
        normalizedPayloadJson: { pageCluster: "conversion", signalStrength: "high" },
        occurredAt: subDays(baseDate, 5 - (index % 2)),
        receivedAt: subDays(baseDate, 5 - (index % 2)),
        dedupeKey: `${account.id}_event_03`,
        status: SignalStatus.PROCESSED,
      },
      {
        id: `${account.id}_signal_04`,
        sourceSystem: bundle.fourth === SignalType.MEETING_BOOKED ? "Calendar" : "Sales",
        eventType: bundle.fourth,
        accountId: unmatchedEvent ? null : account.id,
        contactId: unmatchedEvent ? null : contactId,
        leadId: unmatchedEvent ? null : leadId,
        rawPayloadJson: unmatchedEvent
          ? { email: `unknown+${index}@example.com`, page: "/pricing" }
          : { rep: account.namedOwnerId, note: "Strong buying committee interest" },
        normalizedPayloadJson: unmatchedEvent
          ? { matchConfidence: "low", recommendedQueue: "ops-review" }
          : { action: "follow-up", signalStrength: "high" },
        occurredAt: subDays(baseDate, 1),
        receivedAt: subDays(baseDate, 1),
        dedupeKey: `${account.id}_event_04`,
        status: unmatchedEvent ? SignalStatus.UNMATCHED : SignalStatus.MATCHED,
      },
    ];
  });

  await prisma.signalEvent.createMany({ data: signalEvents });

  const routingDecisions = leads.map((lead, index) => {
    const account = accounts.find((item) => item.id === lead.accountId)!;
    const decisionType =
      account.accountTier === AccountTier.STRATEGIC
        ? RoutingReason.STRATEGIC_ESCALATION
        : index % 4 === 0
          ? RoutingReason.NAMED_ACCOUNT
          : index % 4 === 1
            ? RoutingReason.TERRITORY_SEGMENT
            : RoutingReason.ROUND_ROBIN;

    return {
      id: `${lead.id}_route`,
      leadId: lead.id,
      accountId: lead.accountId,
      policyVersion: "routing-2026.03",
      decisionType,
      assignedOwnerId: lead.currentOwnerId,
      assignedTeam:
        account.segment === Segment.STRATEGIC
          ? "Strategic Coverage"
          : `${account.geography.replace("_", " ")} ${account.segment.replace("_", " ")}`,
      assignedQueue:
        lead.temperature === Temperature.URGENT
          ? "hot-inbound"
          : lead.temperature === Temperature.HOT
            ? "signal-followup"
            : "nurture-review",
      explanation:
        decisionType === RoutingReason.STRATEGIC_ESCALATION
          ? "Strategic tier account escalated to paired AE + SDR coverage."
          : decisionType === RoutingReason.NAMED_ACCOUNT
            ? "Existing named account owner retained for continuity."
            : decisionType === RoutingReason.TERRITORY_SEGMENT
              ? "Matched territory and segment policy for this inbound motion."
              : "Lead routed through eligible rotation for balanced coverage.",
      createdAt: lead.routedAt ?? addHours(lead.createdAt, 2),
    };
  });

  await prisma.routingDecision.createMany({ data: routingDecisions });

  const tasks = [
    ...leads.map((lead, index) => {
      const account = accounts.find((item) => item.id === lead.accountId)!;
      return {
        id: `${lead.id}_task_01`,
        leadId: lead.id,
        accountId: lead.accountId,
        ownerId: lead.currentOwnerId,
        taskType: lead.temperature === Temperature.URGENT ? TaskType.CALL : TaskType.EMAIL,
        priority:
          lead.temperature === Temperature.URGENT
            ? TaskPriority.URGENT
            : lead.temperature === Temperature.HOT
              ? TaskPriority.HIGH
              : TaskPriority.MEDIUM,
        dueAt: lead.slaDeadlineAt ?? addHours(lead.createdAt, 12),
        status: index % 6 === 0 ? TaskStatus.IN_PROGRESS : index % 5 === 0 ? TaskStatus.COMPLETED : TaskStatus.OPEN,
        title:
          lead.temperature === Temperature.URGENT
            ? `Call ${account.name} within SLA`
            : `Send tailored follow-up to ${account.name}`,
        description:
          lead.temperature === Temperature.URGENT
            ? "High-intent form and pricing activity detected. Confirm buying timeline and book next step."
            : "Use the latest signal bundle to personalize the next touch and validate ownership.",
        createdAt: lead.createdAt,
        completedAt: index % 5 === 0 ? addHours(lead.createdAt, 6) : null,
      };
    }),
    ...accounts.slice(0, 8).map((account, index) => ({
      id: `${account.id}_task_account_${index + 1}`,
      leadId: null,
      accountId: account.id,
      ownerId: account.namedOwnerId,
      taskType: index % 2 === 0 ? TaskType.RESEARCH : TaskType.REVIEW,
      priority: index < 4 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
      dueAt: addHours(baseDate, 6 + index * 2),
      status: index % 3 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.OPEN,
      title: `Refresh signal context for ${account.name}`,
      description:
        "Review the latest account activity, confirm routing quality, and prepare the next-best action summary.",
      createdAt: subDays(baseDate, 2),
      completedAt: null,
    })),
  ];

  await prisma.task.createMany({ data: tasks });

  const scoreHistory = accounts.flatMap((account) => {
    const intentScore = Math.max(16, Math.round((account.overallScore - account.fitScore) * 0.45));
    const engagementScore = account.overallScore - account.fitScore - intentScore;

    return [
      {
        id: `${account.id}_score_fit`,
        entityType: ScoreEntityType.ACCOUNT,
        entityId: account.id,
        accountId: account.id,
        leadId: null,
        previousScore: 0,
        newScore: account.fitScore,
        delta: account.fitScore,
        scoreComponent: ScoreComponent.FIT,
        reasonCode: "ICP alignment and account tier calibration.",
        createdAt: subDays(baseDate, 14),
      },
      {
        id: `${account.id}_score_intent`,
        entityType: ScoreEntityType.ACCOUNT,
        entityId: account.id,
        accountId: account.id,
        leadId: null,
        previousScore: account.fitScore,
        newScore: account.fitScore + intentScore,
        delta: intentScore,
        scoreComponent: ScoreComponent.INTENT,
        reasonCode: "Pricing visits, demo requests, and intent spikes increased buying signal.",
        createdAt: subDays(baseDate, 8),
      },
      {
        id: `${account.id}_score_engagement`,
        entityType: ScoreEntityType.ACCOUNT,
        entityId: account.id,
        accountId: account.id,
        leadId: null,
        previousScore: account.fitScore + intentScore,
        newScore: account.overallScore,
        delta: engagementScore,
        scoreComponent: ScoreComponent.ENGAGEMENT,
        reasonCode: "Sales touches and follow-up actions increased engagement confidence.",
        createdAt: subDays(baseDate, 3),
      },
    ];
  });

  await prisma.scoreHistory.createMany({ data: scoreHistory });

  const auditLogs = accounts.flatMap((account, index) => {
    const lead = leads.find((item) => item.accountId === account.id);

    return [
      {
        id: `${account.id}_audit_signal`,
        eventType: AuditEventType.SIGNAL_INGESTED,
        actorType: "system",
        actorName: "Signal Ingestion",
        entityType: "Account",
        entityId: account.id,
        accountId: account.id,
        leadId: lead?.id ?? null,
        beforeState: Prisma.JsonNull,
        afterState: { signalCount: signalEvents.filter((event) => event.accountId === account.id).length },
        explanation: "New signal bundle attached to account timeline.",
        createdAt: subDays(baseDate, 5),
      },
      {
        id: `${account.id}_audit_score`,
        eventType: AuditEventType.SCORE_UPDATED,
        actorType: "system",
        actorName: "Scoring Engine",
        entityType: "Account",
        entityId: account.id,
        accountId: account.id,
        leadId: lead?.id ?? null,
        beforeState: { score: Math.max(0, account.overallScore - 12) },
        afterState: { score: account.overallScore },
        explanation: "Account score recalculated after recent intent and engagement signals.",
        createdAt: subDays(baseDate, 3),
      },
      {
        id: `${account.id}_audit_route`,
        eventType: AuditEventType.ROUTE_ASSIGNED,
        actorType: "system",
        actorName: "Routing Engine",
        entityType: lead ? "Lead" : "Account",
        entityId: lead?.id ?? account.id,
        accountId: account.id,
        leadId: lead?.id ?? null,
        beforeState: { queue: "unassigned" },
        afterState: { queue: lead ? "active" : "monitoring" },
        explanation:
          index % 4 === 0
            ? "Named owner preserved after signal surge."
            : "Territory and segment policy assigned the active working queue.",
        createdAt: subDays(baseDate, 2),
      },
    ];
  });

  await prisma.auditLog.createMany({ data: auditLogs });

  await prisma.ruleConfig.createMany({
    data: [
      {
        id: "rule_scoring_2026_03",
        ruleType: "scoring",
        version: "2026.03",
        isActive: true,
        configJson: {
          weights: {
            fit: 0.25,
            intent: 0.2,
            engagement: 0.25,
            recency: 0.1,
            productUsage: 0.15,
            manualPriority: 0.05,
          },
        },
      },
      {
        id: "rule_routing_2026_03",
        ruleType: "routing",
        version: "2026.03",
        isActive: true,
        configJson: {
          precedence: [
            "named-account",
            "territory-segment",
            "round-robin",
            "strategic-escalation",
            "ops-review",
          ],
          queues: {
            urgent: "hot-inbound",
            high: "signal-followup",
            default: "nurture-review",
          },
        },
      },
    ],
  });

  console.log("Seeded GTM Signal Orchestrator demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
