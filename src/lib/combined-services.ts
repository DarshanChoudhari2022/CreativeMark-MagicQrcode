import {
  BadgeCheck,
  BarChart3,
  Gift,
  MapPinned,
  Store,
  Utensils,
} from "lucide-react";

export const COMBINED_SERVICE_IDS = [
  "digital_stamp_cards",
  "ai_digital_menu",
  "scratch_cards",
  "multi_branch_gps",
  "branch_analytics",
  "qr_stand_request",
] as const;

export type CombinedServiceId = (typeof COMBINED_SERVICE_IDS)[number];

export const COMBINED_SERVICES = [
  {
    id: "digital_stamp_cards",
    name: "Digital Stamp Cards",
    description: "Reward repeat visits with scan-based stamps and claimable offers.",
    icon: Gift,
  },
  {
    id: "ai_digital_menu",
    name: "AI Digital Menu",
    description: "Attach a mobile menu experience to the same customer QR journey.",
    icon: Utensils,
  },
  {
    id: "scratch_cards",
    name: "Scratch Cards",
    description: "Add instant surprise rewards after scans to keep customers engaged.",
    icon: BadgeCheck,
  },
  {
    id: "multi_branch_gps",
    name: "Multi-Branch GPS",
    description: "Prepare one QR flow for multiple branches with location detection.",
    icon: MapPinned,
  },
  {
    id: "branch_analytics",
    name: "Branch Analytics",
    description: "Track scan and engagement performance branch by branch.",
    icon: BarChart3,
  },
  {
    id: "qr_stand_request",
    name: "QR Stand Request",
    description: "Mark the campaign for physical counter standee deployment.",
    icon: Store,
  },
] as const;

const validServiceIds = new Set<string>(COMBINED_SERVICE_IDS);

export const normalizeCombinedServices = (value: unknown): CombinedServiceId[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((id): id is CombinedServiceId => (
    typeof id === "string" && validServiceIds.has(id)
  ));
};

export const getCombinedServiceLabels = (ids: string[]) =>
  ids
    .map((id) => COMBINED_SERVICES.find((service) => service.id === id)?.name)
    .filter(Boolean) as string[];
