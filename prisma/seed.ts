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

import type { IngestSignalInput } from "../lib/contracts/signals";
import { ingestSignal } from "../lib/data/signals";
import { db } from "../lib/db";
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
const subHours = (date: Date, hours: number) =>
  new Date(date.getTime() - hours * 60 * 60 * 1000);
const subMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() - minutes * 60 * 1000);

type AccountBlueprint = {
  id: string;
  name: string;
  domain: string;
  segment: Segment;
  industry: string;
  geography: Geography;
  employeeCount: number;
  annualRevenueBand: string;
  namedOwnerId: string | null;
  lifecycleStage: LifecycleStage;
  fitScore: number;
  overallScore: number;
  status: AccountStatus;
};

type PersonaProfile = {
  title: string;
  department: string;
  seniority: string;
  personaType: string;
};

type SeededAccount = AccountBlueprint & {
  accountTier: AccountTier;
  createdAt: Date;
  updatedAt: Date;
};

type SeededContact = {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  seniority: string;
  phone: string;
  personaType: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeededLead = {
  id: string;
  accountId: string;
  contactId: string;
  source: string;
  inboundType: string;
  currentOwnerId: string;
  status: LeadStatus;
  score: number;
  temperature: Temperature;
  slaDeadlineAt: Date;
  firstResponseAt: Date | null;
  routedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const userSeed: Prisma.UserCreateManyInput[] = [
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
    id: "usr_hana_cho",
    name: "Hana Cho",
    email: "hana.cho@gtmso.local",
    role: "Enterprise AE",
    team: "APAC Enterprise",
    geography: Geography.APAC,
    title: "Enterprise Account Executive",
    avatarColor: "#c2410c",
  },
];

const accountBlueprints: readonly AccountBlueprint[] = [
  {
    id: "acc_northstar_analytics",
    name: "Northstar Analytics",
    domain: "northstaranalytics.com",
    segment: Segment.MID_MARKET,
    industry: "SaaS",
    geography: Geography.NA_WEST,
    employeeCount: 420,
    annualRevenueBand: "$50M-$100M",
    namedOwnerId: "usr_dante_kim",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 29,
    overallScore: 88,
    status: AccountStatus.HOT,
  },
  {
    id: "acc_cedarbridge_health",
    name: "CedarBridge Health",
    domain: "cedarbridgehealth.com",
    segment: Segment.MID_MARKET,
    industry: "Healthcare",
    geography: Geography.NA_EAST,
    employeeCount: 650,
    annualRevenueBand: "$100M-$250M",
    namedOwnerId: "usr_amelia_ross",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 24,
    overallScore: 68,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_rivetstack",
    name: "RivetStack Automation",
    domain: "rivetstackautomation.com",
    segment: Segment.ENTERPRISE,
    industry: "Manufacturing",
    geography: Geography.NA_WEST,
    employeeCount: 1180,
    annualRevenueBand: "$250M-$500M",
    namedOwnerId: "usr_dante_kim",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 27,
    overallScore: 76,
    status: AccountStatus.HEALTHY,
  },
  {
    id: "acc_brightharbor_retail",
    name: "BrightHarbor Retail",
    domain: "brightharborretail.com",
    segment: Segment.SMB,
    industry: "Retail",
    geography: Geography.NA_WEST,
    employeeCount: 180,
    annualRevenueBand: "$20M-$50M",
    namedOwnerId: null,
    lifecycleStage: LifecycleStage.PROSPECT,
    fitScore: 20,
    overallScore: 59,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_summitflow_finance",
    name: "SummitFlow Finance",
    domain: "summitflowfinance.com",
    segment: Segment.STRATEGIC,
    industry: "Fintech",
    geography: Geography.NA_EAST,
    employeeCount: 4200,
    annualRevenueBand: "$500M+",
    namedOwnerId: "usr_elena_morales",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 30,
    overallScore: 92,
    status: AccountStatus.HOT,
  },
  {
    id: "acc_latticebio",
    name: "LatticeBio Labs",
    domain: "latticebio.com",
    segment: Segment.ENTERPRISE,
    industry: "Healthcare",
    geography: Geography.EMEA,
    employeeCount: 1450,
    annualRevenueBand: "$250M-$500M",
    namedOwnerId: "usr_noor_haddad",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 28,
    overallScore: 79,
    status: AccountStatus.HEALTHY,
  },
  {
    id: "acc_harborpoint",
    name: "HarborPoint SaaS",
    domain: "harborpointsaas.com",
    segment: Segment.ENTERPRISE,
    industry: "SaaS",
    geography: Geography.NA_EAST,
    employeeCount: 980,
    annualRevenueBand: "$100M-$250M",
    namedOwnerId: "usr_elena_morales",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 28,
    overallScore: 86,
    status: AccountStatus.HOT,
  },
  {
    id: "acc_alloyworks",
    name: "AlloyWorks Cloud",
    domain: "alloyworkscloud.com",
    segment: Segment.ENTERPRISE,
    industry: "Manufacturing",
    geography: Geography.EMEA,
    employeeCount: 1750,
    annualRevenueBand: "$250M-$500M",
    namedOwnerId: "usr_noor_haddad",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 26,
    overallScore: 74,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_cedar_loop",
    name: "Cedar Loop Finance",
    domain: "cedarloopfinance.com",
    segment: Segment.SMB,
    industry: "Fintech",
    geography: Geography.NA_EAST,
    employeeCount: 240,
    annualRevenueBand: "$20M-$50M",
    namedOwnerId: null,
    lifecycleStage: LifecycleStage.NURTURE,
    fitScore: 19,
    overallScore: 57,
    status: AccountStatus.AT_RISK,
  },
  {
    id: "acc_frontier_retail",
    name: "Frontier Retail Systems",
    domain: "frontierretailsystems.com",
    segment: Segment.MID_MARKET,
    industry: "Retail",
    geography: Geography.APAC,
    employeeCount: 510,
    annualRevenueBand: "$50M-$100M",
    namedOwnerId: "usr_hana_cho",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 24,
    overallScore: 72,
    status: AccountStatus.HEALTHY,
  },
  {
    id: "acc_orbitiq",
    name: "OrbitIQ Security",
    domain: "orbitiqsecurity.com",
    segment: Segment.STRATEGIC,
    industry: "Cybersecurity",
    geography: Geography.EMEA,
    employeeCount: 3100,
    annualRevenueBand: "$500M+",
    namedOwnerId: "usr_elena_morales",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 29,
    overallScore: 90,
    status: AccountStatus.HOT,
  },
  {
    id: "acc_ironpeak",
    name: "Iron Peak Manufacturing",
    domain: "ironpeakmfg.com",
    segment: Segment.STRATEGIC,
    industry: "Manufacturing",
    geography: Geography.NA_WEST,
    employeeCount: 5200,
    annualRevenueBand: "$500M+",
    namedOwnerId: "usr_elena_morales",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 31,
    overallScore: 94,
    status: AccountStatus.HOT,
  },
  {
    id: "acc_signalnest",
    name: "SignalNest Software",
    domain: "signalnestsoftware.com",
    segment: Segment.SMB,
    industry: "SaaS",
    geography: Geography.NA_WEST,
    employeeCount: 220,
    annualRevenueBand: "$20M-$50M",
    namedOwnerId: null,
    lifecycleStage: LifecycleStage.PROSPECT,
    fitScore: 22,
    overallScore: 64,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_pinecrest",
    name: "Pinecrest Labs",
    domain: "pinecrestlabs.com",
    segment: Segment.MID_MARKET,
    industry: "Healthcare",
    geography: Geography.APAC,
    employeeCount: 760,
    annualRevenueBand: "$50M-$100M",
    namedOwnerId: "usr_hana_cho",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 23,
    overallScore: 70,
    status: AccountStatus.HEALTHY,
  },
  {
    id: "acc_novachannel",
    name: "NovaChannel Commerce",
    domain: "novachannelcommerce.com",
    segment: Segment.MID_MARKET,
    industry: "Retail",
    geography: Geography.APAC,
    employeeCount: 680,
    annualRevenueBand: "$50M-$100M",
    namedOwnerId: "usr_hana_cho",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 22,
    overallScore: 67,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_aperture_robotics",
    name: "Aperture Robotics",
    domain: "aperturerobotics.com",
    segment: Segment.ENTERPRISE,
    industry: "Manufacturing",
    geography: Geography.APAC,
    employeeCount: 1600,
    annualRevenueBand: "$250M-$500M",
    namedOwnerId: "usr_hana_cho",
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 27,
    overallScore: 78,
    status: AccountStatus.HEALTHY,
  },
  {
    id: "acc_veritypulse",
    name: "VerityPulse Health",
    domain: "veritypulsehealth.com",
    segment: Segment.MID_MARKET,
    industry: "Healthcare",
    geography: Geography.NA_EAST,
    employeeCount: 720,
    annualRevenueBand: "$50M-$100M",
    namedOwnerId: null,
    lifecycleStage: LifecycleStage.ENGAGED,
    fitScore: 25,
    overallScore: 71,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_meridian_freight",
    name: "Meridian Freight Cloud",
    domain: "meridianfreightcloud.com",
    segment: Segment.ENTERPRISE,
    industry: "Logistics",
    geography: Geography.NA_EAST,
    employeeCount: 2100,
    annualRevenueBand: "$500M+",
    namedOwnerId: "usr_amelia_ross",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 26,
    overallScore: 79,
    status: AccountStatus.HEALTHY,
  },
  {
    id: "acc_beaconops",
    name: "BeaconOps Partners",
    domain: "beaconopspartners.com",
    segment: Segment.SMB,
    industry: "Professional Services",
    geography: Geography.NA_WEST,
    employeeCount: 260,
    annualRevenueBand: "$20M-$50M",
    namedOwnerId: "usr_miles_turner",
    lifecycleStage: LifecycleStage.NURTURE,
    fitScore: 21,
    overallScore: 61,
    status: AccountStatus.WATCH,
  },
  {
    id: "acc_atlas_grid",
    name: "Atlas Grid Systems",
    domain: "atlasgridsystems.com",
    segment: Segment.STRATEGIC,
    industry: "Energy",
    geography: Geography.EMEA,
    employeeCount: 2800,
    annualRevenueBand: "$500M+",
    namedOwnerId: "usr_elena_morales",
    lifecycleStage: LifecycleStage.SALES_READY,
    fitScore: 27,
    overallScore: 77,
    status: AccountStatus.HEALTHY,
  },
] as const;

const seededSignalTypes = Object.values(SignalType);

type SeededSignalType = SignalType;
type JsonObject = Record<string, string | number | boolean | null>;

const secondaryLeadAccountIds = new Set([
  "acc_northstar_analytics",
  "acc_summitflow_finance",
  "acc_harborpoint",
  "acc_orbitiq",
  "acc_ironpeak",
  "acc_rivetstack",
  "acc_latticebio",
  "acc_aperture_robotics",
  "acc_meridian_freight",
  "acc_atlas_grid",
]);

const accountTaskAccountIds = [
  "acc_northstar_analytics",
  "acc_summitflow_finance",
  "acc_harborpoint",
  "acc_orbitiq",
  "acc_ironpeak",
  "acc_rivetstack",
  "acc_latticebio",
  "acc_aperture_robotics",
  "acc_meridian_freight",
  "acc_atlas_grid",
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
] as const;

const primaryLeadSources = [
  "Pricing page revisit",
  "Signal-qualified inbound",
  "Webinar follow-up",
  "Product-led evaluation",
  "Intent surge",
  "Partner referral",
  "Content syndication",
] as const;

const secondaryLeadSources = [
  "Buying committee expansion",
  "Executive follow-up",
  "Late-stage re-engagement",
  "Trial activation",
  "Mutual action plan request",
] as const;

function getAccountTier(segment: Segment): AccountTier {
  if (segment === Segment.STRATEGIC) return AccountTier.STRATEGIC;
  if (segment === Segment.ENTERPRISE) return AccountTier.TIER_1;
  if (segment === Segment.MID_MARKET) return AccountTier.TIER_2;
  return AccountTier.TIER_3;
}

function clampScore(score: number) {
  return Math.max(35, Math.min(99, score));
}

function getTemperature(score: number): Temperature {
  if (score >= 90) return Temperature.URGENT;
  if (score >= 80) return Temperature.HOT;
  if (score >= 65) return Temperature.WARM;
  return Temperature.COLD;
}

function getLeadStatus(temperature: Temperature): LeadStatus {
  if (temperature === Temperature.URGENT) return LeadStatus.QUALIFIED;
  if (temperature === Temperature.HOT) return LeadStatus.WORKING;
  if (temperature === Temperature.WARM) return LeadStatus.NEW;
  return LeadStatus.NURTURING;
}

function getSlaHours(temperature: Temperature) {
  if (temperature === Temperature.URGENT) return 1;
  if (temperature === Temperature.HOT) return 4;
  if (temperature === Temperature.WARM) return 12;
  return 24;
}

function getFallbackLeadOwner(geography: Geography) {
  switch (geography) {
    case Geography.NA_WEST:
      return "usr_miles_turner";
    case Geography.NA_EAST:
      return "usr_amelia_ross";
    case Geography.EMEA:
      return "usr_noor_haddad";
    case Geography.APAC:
      return "usr_hana_cho";
  }
}

function getContactName(index: number, offset: number) {
  return {
    firstName: contactFirstNames[(index + offset) % contactFirstNames.length],
    lastName: contactLastNames[(index * 3 + offset) % contactLastNames.length],
  };
}

function getOperationalPersona(industry: string): PersonaProfile {
  switch (industry) {
    case "Manufacturing":
      return {
        title: "Director of Commercial Operations",
        department: "Commercial Operations",
        seniority: "Director",
        personaType: "Commercial Ops",
      };
    case "Healthcare":
      return {
        title: "Director of Revenue Operations",
        department: "Revenue Operations",
        seniority: "Director",
        personaType: "RevOps",
      };
    case "Retail":
      return {
        title: "Head of Ecommerce Operations",
        department: "Digital Commerce",
        seniority: "Director",
        personaType: "Ecommerce Ops",
      };
    case "Fintech":
      return {
        title: "Director of GTM Systems",
        department: "GTM Systems",
        seniority: "Director",
        personaType: "GTM Systems",
      };
    case "Logistics":
      return {
        title: "Director of Sales Operations",
        department: "Sales Operations",
        seniority: "Director",
        personaType: "Sales Ops",
      };
    case "Cybersecurity":
      return {
        title: "Director of Growth Operations",
        department: "Growth Operations",
        seniority: "Director",
        personaType: "Growth Ops",
      };
    case "Energy":
      return {
        title: "Director of Commercial Systems",
        department: "Commercial Systems",
        seniority: "Director",
        personaType: "Commercial Systems",
      };
    case "Professional Services":
      return {
        title: "Director of Revenue Operations",
        department: "Revenue Operations",
        seniority: "Director",
        personaType: "RevOps",
      };
    default:
      return {
        title: "Director of Revenue Operations",
        department: "Revenue Operations",
        seniority: "Director",
        personaType: "RevOps",
      };
  }
}

function getExecutivePersona(segment: Segment, industry: string, index: number): PersonaProfile {
  if (segment === Segment.STRATEGIC) {
    return {
      title: index % 2 === 0 ? "Chief Revenue Officer" : "Chief Commercial Officer",
      department: "Executive",
      seniority: "Executive",
      personaType: industry === "Fintech" ? "Executive Buyer" : "Economic Buyer",
    };
  }

  if (segment === Segment.ENTERPRISE) {
    return {
      title: index % 2 === 0 ? "VP, Global Sales" : "VP, Demand Generation",
      department: index % 2 === 0 ? "Sales" : "Marketing",
      seniority: "Vice President",
      personaType: index % 2 === 0 ? "Sales Leadership" : "Demand Gen",
    };
  }

  if (segment === Segment.MID_MARKET) {
    return {
      title: index % 2 === 0 ? "Director of Growth" : "VP, Sales Development",
      department: index % 2 === 0 ? "Growth" : "Sales",
      seniority: "Director",
      personaType: index % 2 === 0 ? "Growth Leader" : "Sales Leadership",
    };
  }

  return {
    title: index % 2 === 0 ? "Head of Marketing" : "VP, Revenue",
    department: index % 2 === 0 ? "Marketing" : "Revenue",
    seniority: "Head",
    personaType: index % 2 === 0 ? "Marketing Leader" : "Revenue Leader",
  };
}

function getPhoneNumber(geography: Geography, index: number, slot: number) {
  const prefix =
    geography === Geography.EMEA ? "+44" : geography === Geography.APAC ? "+61" : "+1";
  return `${prefix}-555-${String(1000 + index * 10 + slot).padStart(4, "0")}`;
}

function toIngestSignalType(eventType: SeededSignalType): IngestSignalInput["event_type"] {
  switch (eventType) {
    case SignalType.WEBSITE_VISIT:
      return "website_visit";
    case SignalType.PRICING_PAGE_VISIT:
      return "pricing_page_visit";
    case SignalType.HIGH_INTENT_PAGE_CLUSTER_VISIT:
      return "high_intent_page_cluster_visit";
    case SignalType.FORM_FILL:
      return "form_fill";
    case SignalType.WEBINAR_REGISTRATION:
      return "webinar_registration";
    case SignalType.PRODUCT_SIGNUP:
      return "product_signup";
    case SignalType.PRODUCT_USAGE_MILESTONE:
      return "product_usage_milestone";
    case SignalType.EMAIL_REPLY:
      return "email_reply";
    case SignalType.MEETING_BOOKED:
      return "meeting_booked";
    case SignalType.MEETING_NO_SHOW:
      return "meeting_no_show";
    case SignalType.THIRD_PARTY_INTENT_EVENT:
      return "third_party_intent_event";
    case SignalType.MANUAL_SALES_NOTE:
      return "manual_sales_note";
    case SignalType.ACCOUNT_STATUS_UPDATE:
      return "account_status_update";
  }
}

function getSignalSourceSystem(eventType: SeededSignalType): string {
  switch (eventType) {
    case SignalType.WEBSITE_VISIT:
    case SignalType.PRICING_PAGE_VISIT:
    case SignalType.HIGH_INTENT_PAGE_CLUSTER_VISIT:
      return "website";
    case SignalType.FORM_FILL:
      return "marketing_automation";
    case SignalType.WEBINAR_REGISTRATION:
      return "events";
    case SignalType.PRODUCT_SIGNUP:
    case SignalType.PRODUCT_USAGE_MILESTONE:
      return "product";
    case SignalType.EMAIL_REPLY:
      return "sales_engagement";
    case SignalType.MEETING_BOOKED:
    case SignalType.MEETING_NO_SHOW:
      return "calendar";
    case SignalType.THIRD_PARTY_INTENT_EVENT:
      return "third_party_intent";
    case SignalType.MANUAL_SALES_NOTE:
      return "sales_note";
    case SignalType.ACCOUNT_STATUS_UPDATE:
      return "crm";
  }
}

function getSignalPayload(
  account: SeededAccount,
  eventType: SeededSignalType,
  index: number,
): JsonObject {
  switch (eventType) {
    case SignalType.WEBSITE_VISIT:
      return {
        page: index % 2 === 0 ? "/blog/revenue-ops" : "/integrations/salesforce",
        session_id: `${account.id}_session_${index}`,
        visit_count: 1 + (index % 3),
      };
    case SignalType.PRICING_PAGE_VISIT:
      return {
        page: "/pricing",
        session_id: `${account.id}_pricing_${index}`,
        visit_count: 2 + (index % 3),
      };
    case SignalType.HIGH_INTENT_PAGE_CLUSTER_VISIT:
      return {
        page_cluster: "pricing,security,integrations",
        session_id: `${account.id}_cluster_${index}`,
      };
    case SignalType.FORM_FILL:
      return {
        form_id: "request_demo",
        submission_id: `${account.id}_form_${index}`,
        campaign: account.industry.toLowerCase().replace(/\s+/g, "-"),
        persona: "operations",
      };
    case SignalType.WEBINAR_REGISTRATION:
      return {
        webinar_name: "Signal orchestration benchmark",
        webinar_id: `webinar_${(index % 4) + 1}`,
        registration_id: `${account.id}_registration_${index}`,
        campaign: "q1_recruiter_demo",
      };
    case SignalType.PRODUCT_SIGNUP:
      return {
        workspace_id: `${account.id}_workspace`,
        signup_id: `${account.id}_signup_${index}`,
        plan: account.segment === Segment.SMB ? "trial" : "pilot",
      };
    case SignalType.PRODUCT_USAGE_MILESTONE:
      return {
        workspace_id: `${account.id}_workspace`,
        milestone: index % 2 === 0 ? "connected_crm" : "invited_teammates",
        user_id: `${account.id}_user_${index}`,
      };
    case SignalType.EMAIL_REPLY:
      return {
        thread_id: `${account.id}_thread_${index}`,
        message_id: `${account.id}_message_${index}`,
        subject: "Routing visibility follow-up",
      };
    case SignalType.MEETING_BOOKED:
      return {
        meeting_id: `${account.id}_meeting_${index}`,
        calendar_event_id: `${account.id}_calendar_${index}`,
        meeting_type: account.segment === Segment.STRATEGIC ? "exec_review" : "discovery_call",
      };
    case SignalType.MEETING_NO_SHOW:
      return {
        meeting_id: `${account.id}_meeting_no_show_${index}`,
        calendar_event_id: `${account.id}_calendar_no_show_${index}`,
        meeting_type: "follow_up_demo",
      };
    case SignalType.THIRD_PARTY_INTENT_EVENT:
      return {
        provider: "bombora",
        topic: account.industry === "Manufacturing" ? "sales_forecasting" : "revenue_intelligence",
        intent_id: `${account.id}_intent_${index}`,
      };
    case SignalType.MANUAL_SALES_NOTE:
      return {
        note_id: `${account.id}_note_${index}`,
        author_id: account.namedOwnerId ?? getFallbackLeadOwner(account.geography),
        note_subject: "AE field note",
      };
    case SignalType.ACCOUNT_STATUS_UPDATE:
      return {
        status_change_id: `${account.id}_status_${index}`,
        previous_status: account.lifecycleStage.toLowerCase(),
        new_status: account.status === AccountStatus.HOT ? "exec_attention" : "monitoring",
      };
  }
}

function buildMatchedSignalInputs(accounts: SeededAccount[], contacts: SeededContact[]): IngestSignalInput[] {
  return accounts.flatMap((account, accountIndex) => {
    const accountContacts = contacts.filter((contact) => contact.accountId === account.id);
    const signalCount = account.status === AccountStatus.HOT ? 6 : 4;
    const dayOffsets = account.status === AccountStatus.HOT ? [12, 9, 6, 4, 2, 0] : [11, 8, 4, 1];

    return Array.from({ length: signalCount }, (_, signalIndex) => {
      const eventType = seededSignalTypes[(accountIndex + signalIndex) % seededSignalTypes.length]!;
      const contact = accountContacts[signalIndex % accountContacts.length]!;
      const occurredAt = addMinutes(
        subDays(baseDate, dayOffsets[signalIndex]!),
        accountIndex * 13 + signalIndex * 17,
      );
      const receivedAt = addMinutes(occurredAt, 5 + ((accountIndex + signalIndex) % 3) * 6);
      const includeDomain =
        eventType !== SignalType.PRODUCT_USAGE_MILESTONE && eventType !== SignalType.EMAIL_REPLY;
      const includeEmail =
        eventType !== SignalType.MANUAL_SALES_NOTE && eventType !== SignalType.ACCOUNT_STATUS_UPDATE;

      return {
        source_system: getSignalSourceSystem(eventType),
        event_type: toIngestSignalType(eventType),
        account_domain: includeDomain ? account.domain : undefined,
        contact_email: includeEmail ? contact.email : undefined,
        occurred_at: occurredAt.toISOString(),
        received_at: receivedAt.toISOString(),
        payload: getSignalPayload(account, eventType, signalIndex),
      };
    });
  });
}

function buildUnmatchedSignalInputs(
  accounts: SeededAccount[],
  contacts: SeededContact[],
): IngestSignalInput[] {
  const conflictingContactOne = contacts.find((contact) => contact.accountId === accounts[4]!.id)!;
  const conflictingContactTwo = contacts.find((contact) => contact.accountId === accounts[7]!.id)!;

  return [
    {
      source_system: "website",
      event_type: "pricing_page_visit",
      contact_email: `ghost-1@${accounts[0]!.domain}`,
      occurred_at: subMinutes(baseDate, 110).toISOString(),
      received_at: subMinutes(baseDate, 104).toISOString(),
      payload: { page: "/pricing", session_id: "ghost_session_1", visit_count: 3 },
    },
    {
      source_system: "marketing_automation",
      event_type: "form_fill",
      contact_email: `ghost-2@${accounts[1]!.domain}`,
      occurred_at: subMinutes(baseDate, 104).toISOString(),
      received_at: subMinutes(baseDate, 100).toISOString(),
      payload: { form_id: "request_demo", submission_id: "ghost_form_2" },
    },
    {
      source_system: "sales_engagement",
      event_type: "email_reply",
      contact_email: `ghost-3@${accounts[2]!.domain}`,
      occurred_at: subMinutes(baseDate, 98).toISOString(),
      received_at: subMinutes(baseDate, 94).toISOString(),
      payload: { thread_id: "ghost_thread_3", message_id: "ghost_message_3", subject: "Unknown contact" },
    },
    {
      source_system: "product",
      event_type: "product_usage_milestone",
      contact_email: `ghost-4@${accounts[3]!.domain}`,
      occurred_at: subMinutes(baseDate, 92).toISOString(),
      received_at: subMinutes(baseDate, 86).toISOString(),
      payload: { workspace_id: "ghost_workspace_4", milestone: "activated" },
    },
    {
      source_system: "website",
      event_type: "website_visit",
      account_domain: "unknown-stage-two-1.example.com",
      occurred_at: subMinutes(baseDate, 86).toISOString(),
      received_at: subMinutes(baseDate, 82).toISOString(),
      payload: { page: "/docs", session_id: "unknown_domain_1" },
    },
    {
      source_system: "third_party_intent",
      event_type: "third_party_intent_event",
      account_domain: "unknown-stage-two-2.example.com",
      occurred_at: subMinutes(baseDate, 80).toISOString(),
      received_at: subMinutes(baseDate, 75).toISOString(),
      payload: { provider: "bombora", topic: "revenue_intelligence", intent_id: "ghost_intent_2" },
    },
    {
      source_system: "sales_note",
      event_type: "manual_sales_note",
      account_domain: "unknown-stage-two-3.example.com",
      occurred_at: subMinutes(baseDate, 74).toISOString(),
      received_at: subMinutes(baseDate, 70).toISOString(),
      payload: { note_id: "ghost_note_3", author_id: "usr_priya_singh", note_subject: "Unknown account" },
    },
    {
      source_system: "crm",
      event_type: "account_status_update",
      account_domain: "unknown-stage-two-4.example.com",
      occurred_at: subMinutes(baseDate, 68).toISOString(),
      received_at: subMinutes(baseDate, 62).toISOString(),
      payload: { status_change_id: "ghost_status_4", previous_status: "engaged", new_status: "unknown" },
    },
    {
      source_system: "website",
      event_type: "website_visit",
      occurred_at: subMinutes(baseDate, 62).toISOString(),
      received_at: subMinutes(baseDate, 58).toISOString(),
      payload: { page: "/security", session_id: "anonymous_1" },
    },
    {
      source_system: "calendar",
      event_type: "meeting_no_show",
      occurred_at: subMinutes(baseDate, 56).toISOString(),
      received_at: subMinutes(baseDate, 52).toISOString(),
      payload: { meeting_id: "anonymous_meeting_2", calendar_event_id: "anonymous_calendar_2", meeting_type: "demo" },
    },
    {
      source_system: "calendar",
      event_type: "meeting_booked",
      account_domain: accounts[4]!.domain,
      contact_email: conflictingContactTwo.email,
      occurred_at: subMinutes(baseDate, 50).toISOString(),
      received_at: subMinutes(baseDate, 46).toISOString(),
      payload: { meeting_id: "conflict_meeting_1", calendar_event_id: "conflict_calendar_1", meeting_type: "exec_review" },
    },
    {
      source_system: "marketing_automation",
      event_type: "webinar_registration",
      account_domain: accounts[7]!.domain,
      contact_email: conflictingContactOne.email,
      occurred_at: subMinutes(baseDate, 44).toISOString(),
      received_at: subMinutes(baseDate, 40).toISOString(),
      payload: { webinar_name: "Signal orchestration benchmark", webinar_id: "conflict_webinar_2", registration_id: "conflict_registration_2" },
    },
  ];
}

function getLeadInboundType(source: string) {
  if (source.includes("Product")) return "Product-led";
  if (source.includes("Webinar") || source.includes("Pricing")) return "Inbound";
  return "Signal-driven";
}

function getFirstResponseAt(
  sequenceIndex: number,
  temperature: Temperature,
  routedAt: Date,
  slaDeadlineAt: Date,
  preferRecentOpen: boolean,
) {
  if (preferRecentOpen && sequenceIndex % 3 === 0) {
    return null;
  }

  if (sequenceIndex % 6 === 0) {
    return null;
  }

  if (sequenceIndex % 5 === 0) {
    return addMinutes(slaDeadlineAt, 75);
  }

  const responseMinutes =
    temperature === Temperature.URGENT
      ? 20
      : temperature === Temperature.HOT
        ? 55
        : temperature === Temperature.WARM
          ? 210
          : 600;

  return addMinutes(routedAt, responseMinutes);
}

function getLeadTaskPriority(temperature: Temperature) {
  if (temperature === Temperature.URGENT) return TaskPriority.URGENT;
  if (temperature === Temperature.HOT) return TaskPriority.HIGH;
  return TaskPriority.MEDIUM;
}

function getLeadTaskDueAt(lead: SeededLead, sequenceIndex: number) {
  if (lead.temperature === Temperature.URGENT) {
    return addHours(baseDate, 2 + (sequenceIndex % 3));
  }

  if (lead.temperature === Temperature.HOT) {
    return addHours(baseDate, 6 + (sequenceIndex % 6));
  }

  if (lead.temperature === Temperature.WARM) {
    return addHours(baseDate, 24 + (sequenceIndex % 3) * 12);
  }

  return addHours(baseDate, 48 + (sequenceIndex % 3) * 12);
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

  const accounts: SeededAccount[] = accountBlueprints.map((blueprint, index) => ({
    ...blueprint,
    accountTier: getAccountTier(blueprint.segment),
    createdAt: subDays(baseDate, 90 - index * 2),
    updatedAt: subDays(baseDate, index % 4),
  }));

  await prisma.account.createMany({ data: accounts });

  const contacts: SeededContact[] = accounts.flatMap((account, index) => {
    const operational = getOperationalPersona(account.industry);
    const executive = getExecutivePersona(account.segment, account.industry, index);
    const first = getContactName(index, 0);
    const second = getContactName(index, 7);

    return [
      {
        id: `${account.id}_contact_01`,
        accountId: account.id,
        firstName: first.firstName,
        lastName: first.lastName,
        email: `${first.firstName}.${first.lastName}@${account.domain}`.toLowerCase(),
        title: operational.title,
        department: operational.department,
        seniority: operational.seniority,
        phone: getPhoneNumber(account.geography, index, 1),
        personaType: operational.personaType,
        createdAt: subDays(baseDate, 55 - index),
        updatedAt: subDays(baseDate, index % 3),
      },
      {
        id: `${account.id}_contact_02`,
        accountId: account.id,
        firstName: second.firstName,
        lastName: second.lastName,
        email: `${second.firstName}.${second.lastName}@${account.domain}`.toLowerCase(),
        title: executive.title,
        department: executive.department,
        seniority: executive.seniority,
        phone: getPhoneNumber(account.geography, index, 2),
        personaType: executive.personaType,
        createdAt: subDays(baseDate, 53 - index),
        updatedAt: subDays(baseDate, (index + 1) % 4),
      },
    ];
  });

  await prisma.contact.createMany({ data: contacts });

  const leads: SeededLead[] = accounts.flatMap((account, index) => {
    const primaryScore = clampScore(
      account.overallScore + (account.status === AccountStatus.HOT ? 2 : -4 + (index % 6)),
    );
    const primaryCreatedAt =
      account.status === AccountStatus.HOT
        ? subHours(baseDate, 10 + index * 2)
        : subHours(baseDate, 56 + (index % 6) * 12);
    const primaryTemperature = getTemperature(primaryScore);
    const primaryRoutedAt = addMinutes(primaryCreatedAt, 18 + (index % 4) * 12);
    const primarySlaDeadlineAt = addHours(primaryCreatedAt, getSlaHours(primaryTemperature));
    const primaryFirstResponseAt = getFirstResponseAt(
      index,
      primaryTemperature,
      primaryRoutedAt,
      primarySlaDeadlineAt,
      false,
    );
    const ownerId = account.namedOwnerId ?? getFallbackLeadOwner(account.geography);

    const primaryLead: SeededLead = {
      id: `${account.id}_lead_01`,
      accountId: account.id,
      contactId: `${account.id}_contact_01`,
      source: primaryLeadSources[index % primaryLeadSources.length],
      inboundType: getLeadInboundType(primaryLeadSources[index % primaryLeadSources.length]),
      currentOwnerId: ownerId,
      status: getLeadStatus(primaryTemperature),
      score: primaryScore,
      temperature: primaryTemperature,
      slaDeadlineAt: primarySlaDeadlineAt,
      firstResponseAt: primaryFirstResponseAt,
      routedAt: primaryRoutedAt,
      createdAt: primaryCreatedAt,
      updatedAt: addHours(primaryCreatedAt, 3),
    };

    if (!secondaryLeadAccountIds.has(account.id)) {
      return [primaryLead];
    }

    const secondaryScore = clampScore(account.overallScore + 4 - (index % 2));
    const secondaryCreatedAt = subMinutes(baseDate, 35 + index * 18);
    const secondaryTemperature = getTemperature(secondaryScore);
    const secondaryRoutedAt = addMinutes(secondaryCreatedAt, 10 + (index % 3) * 8);
    const secondarySlaDeadlineAt = addHours(secondaryCreatedAt, getSlaHours(secondaryTemperature));
    const secondaryFirstResponseAt = getFirstResponseAt(
      index,
      secondaryTemperature,
      secondaryRoutedAt,
      secondarySlaDeadlineAt,
      true,
    );

    const secondaryLead: SeededLead = {
      id: `${account.id}_lead_02`,
      accountId: account.id,
      contactId: `${account.id}_contact_02`,
      source: secondaryLeadSources[index % secondaryLeadSources.length],
      inboundType: "Signal-driven",
      currentOwnerId: ownerId,
      status: getLeadStatus(secondaryTemperature),
      score: secondaryScore,
      temperature: secondaryTemperature,
      slaDeadlineAt: secondarySlaDeadlineAt,
      firstResponseAt: secondaryFirstResponseAt,
      routedAt: secondaryRoutedAt,
      createdAt: secondaryCreatedAt,
      updatedAt: addHours(secondaryCreatedAt, 2),
    };

    return [primaryLead, secondaryLead];
  });

  await prisma.lead.createMany({ data: leads });

  const matchedSignalInputs = buildMatchedSignalInputs(accounts, contacts);
  const unmatchedSignalInputs = buildUnmatchedSignalInputs(accounts, contacts);
  const seededSignalInputs = [...matchedSignalInputs, ...unmatchedSignalInputs];

  for (const signalInput of seededSignalInputs) {
    const result = await ingestSignal(signalInput);
    if (!result.created) {
      throw new Error(`Seed signal dedupe collision detected for ${signalInput.event_type}.`);
    }
  }

  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const routingDecisions = leads.map((lead) => {
    const account = accountById.get(lead.accountId)!;
    const decisionType =
      account.segment === Segment.STRATEGIC
        ? RoutingReason.STRATEGIC_ESCALATION
        : account.namedOwnerId
          ? RoutingReason.NAMED_ACCOUNT
          : lead.temperature === Temperature.COLD
            ? RoutingReason.ROUND_ROBIN
            : RoutingReason.TERRITORY_SEGMENT;

    return {
      id: `${lead.id}_route`,
      leadId: lead.id,
      accountId: lead.accountId,
      policyVersion: "routing-2026.03",
      decisionType,
      assignedOwnerId: lead.currentOwnerId,
      assignedTeam:
        account.geography === Geography.NA_WEST
          ? "NA West"
          : account.geography === Geography.NA_EAST
            ? "NA East"
            : account.geography === Geography.EMEA
              ? "EMEA"
              : "APAC",
      assignedQueue:
        lead.temperature === Temperature.URGENT
          ? "exec-priority"
          : lead.temperature === Temperature.HOT
            ? "hot-inbound"
            : lead.temperature === Temperature.WARM
              ? "signal-followup"
              : "nurture-review",
      explanation:
        decisionType === RoutingReason.STRATEGIC_ESCALATION
          ? "Strategic account routed to paired executive coverage after strong buying signals."
          : decisionType === RoutingReason.NAMED_ACCOUNT
            ? "Existing named owner retained to keep account context and multithread continuity."
            : decisionType === RoutingReason.TERRITORY_SEGMENT
              ? "Lead assigned by geography and segment coverage policy."
              : "Lead distributed through the fallback rotation because the account has no named owner.",
      createdAt: lead.routedAt,
    };
  });

  await prisma.routingDecision.createMany({ data: routingDecisions });

  const tasks = [
    ...leads.map((lead, index) => {
      const account = accountById.get(lead.accountId)!;
      const isSecondaryLead = lead.id.endsWith("_lead_02");
      const primaryTaskStatus = index % 4 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.OPEN;
      const secondaryTaskStatus =
        index % 3 === 0 ? TaskStatus.COMPLETED : index % 2 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.OPEN;
      const status = isSecondaryLead ? secondaryTaskStatus : primaryTaskStatus;
      const dueAt = getLeadTaskDueAt(lead, index);

      return {
        id: `${lead.id}_task_01`,
        leadId: lead.id,
        accountId: lead.accountId,
        ownerId: lead.currentOwnerId,
        taskType:
          lead.temperature === Temperature.URGENT
            ? TaskType.CALL
            : lead.temperature === Temperature.HOT
              ? TaskType.EMAIL
              : TaskType.RESEARCH,
        priority: getLeadTaskPriority(lead.temperature),
        dueAt,
        status,
        title:
          lead.temperature === Temperature.URGENT
            ? `Call ${account.name} within the active SLA`
            : isSecondaryLead
              ? `Expand buying committee coverage for ${account.name}`
              : `Send tailored follow-up to ${account.name}`,
        description:
          lead.temperature === Temperature.URGENT
            ? "Recent pricing, meeting, and intent activity signals a live opportunity. Confirm timing and next-step owner."
            : isSecondaryLead
              ? "Bring the executive stakeholder into the thread and validate decision criteria across the buying group."
              : "Use the latest signal bundle to personalize the next touch and qualify urgency.",
        createdAt: lead.createdAt,
        completedAt: status === TaskStatus.COMPLETED ? addHours(lead.createdAt, 8) : null,
      };
    }),
    ...accountTaskAccountIds.map((accountId, index) => {
      const account = accountById.get(accountId)!;
      const ownerId = account.namedOwnerId ?? getFallbackLeadOwner(account.geography);
      const isHotAccount = account.status === AccountStatus.HOT;

      return {
        id: `${account.id}_task_account_${String(index + 1).padStart(2, "0")}`,
        leadId: null,
        accountId: account.id,
        ownerId,
        taskType: index % 2 === 0 ? TaskType.REVIEW : TaskType.HANDOFF,
        priority: isHotAccount ? TaskPriority.HIGH : TaskPriority.MEDIUM,
        dueAt: isHotAccount ? addHours(baseDate, 10 + index) : addHours(baseDate, 36 + index * 4),
        status: index % 3 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.OPEN,
        title:
          isHotAccount
            ? `Prepare executive brief for ${account.name}`
            : `Refresh account plan for ${account.name}`,
        description:
          isHotAccount
            ? "Consolidate the latest signals, routing trace, and stakeholder map ahead of the next executive touch."
            : "Review open signal clusters, confirm owner coverage, and update the next-best action summary.",
        createdAt: subDays(baseDate, 1),
        completedAt: null,
      };
    }),
  ];

  await prisma.task.createMany({ data: tasks });

  const scoreHistory = accounts.flatMap((account, index) => {
    const intentDelta =
      account.status === AccountStatus.HOT
        ? 31 + (index % 2)
        : account.segment === Segment.STRATEGIC
          ? 24
          : 18 + (index % 4);
    const engagementDelta = account.overallScore - account.fitScore - intentDelta;

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
        reasonCode: "ICP fit, segment weighting, and account tier calibration.",
        createdAt: subDays(baseDate, 18),
      },
      {
        id: `${account.id}_score_intent`,
        entityType: ScoreEntityType.ACCOUNT,
        entityId: account.id,
        accountId: account.id,
        leadId: null,
        previousScore: account.fitScore,
        newScore: account.fitScore + intentDelta,
        delta: intentDelta,
        scoreComponent: ScoreComponent.INTENT,
        reasonCode: "Pricing visits, form conversion, and intent spikes increased buying confidence.",
        createdAt: subDays(baseDate, 8),
      },
      {
        id: `${account.id}_score_engagement`,
        entityType: ScoreEntityType.ACCOUNT,
        entityId: account.id,
        accountId: account.id,
        leadId: null,
        previousScore: account.fitScore + intentDelta,
        newScore: account.overallScore,
        delta: engagementDelta,
        scoreComponent: ScoreComponent.ENGAGEMENT,
        reasonCode: "Follow-up activity, stakeholder replies, and meeting activity lifted engagement confidence.",
        createdAt: subDays(baseDate, 2),
      },
    ];
  });

  await prisma.scoreHistory.createMany({ data: scoreHistory });

  const auditLogs = accounts.flatMap((account, index) => {
    const primaryLead = leads.find((lead) => lead.accountId === account.id && lead.id.endsWith("_lead_01"))!;
    const signalCount = account.status === AccountStatus.HOT ? 6 : 4;

    return [
      {
        id: `${account.id}_audit_signal`,
        eventType: AuditEventType.SIGNAL_INGESTED,
        actorType: "system",
        actorName: "Signal Ingestion",
        entityType: "Account",
        entityId: account.id,
        accountId: account.id,
        leadId: primaryLead.id,
        beforeState: Prisma.JsonNull,
        afterState: { signalCount, mostRecentSource: signalCount === 6 ? "Calendar" : "Website" },
        explanation: "Recent account activity was normalized and attached to the unified account timeline.",
        createdAt: subDays(baseDate, 3),
      },
      {
        id: `${account.id}_audit_score`,
        eventType: AuditEventType.SCORE_UPDATED,
        actorType: "system",
        actorName: "Scoring Engine",
        entityType: "Account",
        entityId: account.id,
        accountId: account.id,
        leadId: primaryLead.id,
        beforeState: { score: Math.max(0, account.overallScore - 11) },
        afterState: { score: account.overallScore },
        explanation: "Fit, intent, and engagement components were recalculated after the latest signal cluster.",
        createdAt: subDays(baseDate, 2),
      },
      {
        id: `${account.id}_audit_route`,
        eventType: AuditEventType.ROUTE_ASSIGNED,
        actorType: "system",
        actorName: "Routing Engine",
        entityType: "Lead",
        entityId: primaryLead.id,
        accountId: account.id,
        leadId: primaryLead.id,
        beforeState: { queue: "pending" },
        afterState: {
          queue:
            primaryLead.temperature === Temperature.URGENT
              ? "exec-priority"
              : primaryLead.temperature === Temperature.HOT
                ? "hot-inbound"
                : "signal-followup",
        },
        explanation:
          index % 2 === 0
            ? "Lead moved into the active follow-up queue based on owner coverage and current urgency."
            : "Routing policy preserved account context and assigned the working owner without manual intervention.",
        createdAt: subDays(baseDate, 1),
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
            urgent: "exec-priority",
            high: "hot-inbound",
            default: "signal-followup",
          },
        },
      },
    ],
  });

  console.log(
    `Seeded GTM Signal Orchestrator demo data: 8 users, 20 accounts, 40 contacts, 30 leads, ${seededSignalInputs.length} signal events, and 40 tasks.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await Promise.all([prisma.$disconnect(), db.$disconnect()]);
  });
