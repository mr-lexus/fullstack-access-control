export const CLIENT_STATUSES = {
  ACTIVE: "active",
  CHURNED: "churned",
} as const;

export type ClientStatus =
  (typeof CLIENT_STATUSES)[keyof typeof CLIENT_STATUSES];

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  country: string;
  status: ClientStatus;
  createdAt: string;
};
