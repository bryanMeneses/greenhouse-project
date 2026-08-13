import type { RoleFamily } from "@/lib/roles";

export type ReturnAreaId =
  "overview" | "documents" | "requests" | "messages" | "tasks";

export type ReturnArea = {
  id: ReturnAreaId;
  label: string;
  description: string;
};

export const FIRM_AREAS: ReturnArea[] = [
  { id: "overview", label: "Overview", description: "Status and review queue" },
  { id: "documents", label: "Documents", description: "Source Documents" },
  {
    id: "requests",
    label: "Requests & Activity",
    description: "Open Items and activity",
  },
  { id: "messages", label: "Messages", description: "Return collaboration" },
];

export const CLIENT_AREAS: ReturnArea[] = [
  { id: "overview", label: "Overview", description: "Your Return status" },
  { id: "documents", label: "Documents", description: "Your Source Documents" },
  { id: "messages", label: "Messages", description: "Your collaboration" },
  { id: "tasks", label: "Tasks", description: "Your next steps" },
];

export function areasFor(family: RoleFamily): ReturnArea[] {
  return family === "firm" ? FIRM_AREAS : CLIENT_AREAS;
}
