import {
  ClipboardList,
  Files,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

import type { RoleFamily } from "@/lib/roles";

export type ReturnAreaId =
  "overview" | "documents" | "requests" | "messages" | "tasks";

export type ReturnArea = {
  id: ReturnAreaId;
  label: string;
  description: string;
  /** The icon shown in the contextual sidebar tier (and collapsed rail). */
  icon: LucideIcon;
};

export const FIRM_AREAS: ReturnArea[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Status and review queue",
    icon: LayoutDashboard,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Source Documents",
    icon: Files,
  },
  {
    id: "requests",
    label: "Requests & Activity",
    description: "Open Items and activity",
    icon: ClipboardList,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Return collaboration",
    icon: MessagesSquare,
  },
];

export const CLIENT_AREAS: ReturnArea[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Your Return status",
    icon: LayoutDashboard,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Your Source Documents",
    icon: Files,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Your collaboration",
    icon: MessagesSquare,
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Your next steps",
    icon: ListChecks,
  },
];

export function areasFor(family: RoleFamily): ReturnArea[] {
  return family === "firm" ? FIRM_AREAS : CLIENT_AREAS;
}
