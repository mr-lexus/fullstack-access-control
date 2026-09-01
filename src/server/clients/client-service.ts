import { AppError } from "@/domain/errors";
import type { Client } from "@/domain/client";
import type { UserRecord } from "@/domain/user";
import { getStore } from "@/server/data/store";
import { canReadClients } from "@/server/auth/permissions";

export type ClientPage = {
  items: Client[];
  page: number;
  limit: number;
  total: number;
};

function assertCanRead(actor: UserRecord): void {
  if (!canReadClients(actor))
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to view client content.",
    );
}

export function listClients(
  actor: UserRecord,
  page: number,
  limit: number,
): ClientPage {
  assertCanRead(actor);
  const total = getStore().clients.length;
  const start = (page - 1) * limit;
  return {
    items: getStore().clients.slice(start, start + limit),
    page,
    limit,
    total,
  };
}

export function getClient(actor: UserRecord, clientId: string): Client {
  assertCanRead(actor);
  const client = getStore().clients.find(
    (candidate) => candidate.id === clientId,
  );
  if (!client) throw new AppError("CLIENT_NOT_FOUND", "Client was not found.");
  return client;
}
