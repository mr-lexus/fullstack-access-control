import type { Client } from "@/domain/client";
import type { UserRecord } from "@/domain/user";
import { createSeedClients, createSeedUsers } from "./seed";

export type Session = { userId: string };

export type AppStore = {
  users: Map<string, UserRecord>;
  clients: Client[];
  sessions: Map<string, Session>;
};

const STORE_KEY = Symbol.for("fullstack-access-control.store");
const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: AppStore };

function makeStore(): AppStore {
  return {
    users: new Map(createSeedUsers().map((user) => [user.id, user])),
    clients: createSeedClients(),
    sessions: new Map(),
  };
}

export function getStore(): AppStore {
  globalStore[STORE_KEY] ??= makeStore();
  return globalStore[STORE_KEY];
}

export function resetStore(): AppStore {
  const store = makeStore();
  globalStore[STORE_KEY] = store;
  return store;
}
