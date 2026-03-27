import type {
  IdentityResolutionCode,
  SignalReasonDetailContract,
} from "@/lib/contracts/signals";
import { formatEnumLabel } from "@/lib/formatters/display";

const reasonPriority: IdentityResolutionCode[] = [
  "conflicting_match_candidates",
  "no_domain_provided",
  "no_email_provided",
  "no_confident_match",
  "contact_implies_account",
  "account_domain_exact_match",
  "contact_email_exact_match",
];

const reasonPriorityMap = new Map(reasonPriority.map((code, index) => [code, index]));

const signalReasonDetails: Record<IdentityResolutionCode, Omit<SignalReasonDetailContract, "code">> = {
  account_domain_exact_match: {
    label: "Domain matched account",
    description: "The signal domain maps directly to a known account.",
    tone: "default",
    recommendedQueue: "Matched",
  },
  contact_email_exact_match: {
    label: "Contact email matched",
    description: "The signal email maps directly to a known contact.",
    tone: "default",
    recommendedQueue: "Matched",
  },
  contact_implies_account: {
    label: "Contact implied account",
    description: "The contact email resolved the account even without a direct domain match.",
    tone: "default",
    recommendedQueue: "Matched",
  },
  no_domain_provided: {
    label: "Missing account domain",
    description: "The signal did not include an account domain for identity resolution.",
    tone: "warning",
    recommendedQueue: "Identity triage",
  },
  no_email_provided: {
    label: "Missing contact email",
    description: "The signal did not include a contact email for identity resolution.",
    tone: "warning",
    recommendedQueue: "Identity triage",
  },
  no_confident_match: {
    label: "No confident match",
    description: "No exact account or contact match was found for this signal.",
    tone: "warning",
    recommendedQueue: "Ops review",
  },
  conflicting_match_candidates: {
    label: "Conflicting match candidates",
    description: "The provided domain and contact point to different accounts and need manual review.",
    tone: "danger",
    recommendedQueue: "Conflict review",
  },
};

const missingDomainDisplay = "No domain provided";
const missingContactEmailDisplay = "No contact email provided";

export function toIsoTimestamp(value: Date) {
  return value.toISOString();
}

export function formatSignalEventLabel(value: string) {
  return formatEnumLabel(value);
}

export function getSignalReasonDetail(code: IdentityResolutionCode): SignalReasonDetailContract {
  return {
    code,
    ...signalReasonDetails[code],
  };
}

export function getSignalReasonDetails(
  reasonCodes: IdentityResolutionCode[],
): SignalReasonDetailContract[] {
  return [...new Set(reasonCodes)]
    .sort((left, right) => {
      return (reasonPriorityMap.get(left) ?? Number.MAX_SAFE_INTEGER) - (reasonPriorityMap.get(right) ?? Number.MAX_SAFE_INTEGER);
    })
    .map((code) => getSignalReasonDetail(code));
}

export function getPrimarySignalReason(reasonCodes: IdentityResolutionCode[]): SignalReasonDetailContract {
  return getSignalReasonDetails(reasonCodes)[0] ?? getSignalReasonDetail("no_confident_match");
}

export function getRecommendedQueue(reasonCodes: IdentityResolutionCode[]) {
  return getPrimarySignalReason(reasonCodes).recommendedQueue;
}

export function getAccountDomainDisplay(accountDomain: string | null) {
  return accountDomain ?? missingDomainDisplay;
}

export function getContactEmailDisplay(contactEmail: string | null) {
  return contactEmail ?? missingContactEmailDisplay;
}

export function getContactDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined,
) {
  const name = [firstName, lastName]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(" ");

  if (name.length > 0) {
    return name;
  }

  if (email && email.trim().length > 0) {
    return email.trim();
  }

  return "Unknown contact";
}

export function buildTimelineDisplaySubtitle(payloadSummary: string, contactName: string | null) {
  return contactName ? `${contactName} · ${payloadSummary}` : payloadSummary;
}

export function buildUnmatchedDisplaySubtitle(
  payloadSummary: string,
  accountDomain: string | null,
  contactEmail: string | null,
) {
  return [
    payloadSummary,
    getAccountDomainDisplay(accountDomain),
    getContactEmailDisplay(contactEmail),
  ].join(" · ");
}
