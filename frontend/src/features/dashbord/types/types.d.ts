import type { LucideIcon } from "lucide-react";
import type { PaginationMeta, Property } from "../../property/types/type";

export type DashboardTabKey =
  | "dashboard"
  | "my-properties"
  | "messages"
  | "rental-requests"
  | "add-listing"
  | null;

export interface DashboardTabItem {
  key: DashboardTabKey | null;
  label: string;
  icon: LucideIcon;
}

export interface DashboardListingCounts {
  totalListings: number;
  activeListings: number;
}

export interface GetMyListingCountsResponse {
  counts: DashboardListingCounts;
}

export interface DashboardMyPropertiesResponse {
  properties: Property[];
  pagination: PaginationMeta;
}
