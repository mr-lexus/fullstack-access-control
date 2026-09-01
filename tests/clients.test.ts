import { beforeEach, describe, expect, it } from "vitest";
import { resetStore, getStore } from "@/server/data/store";
import { listClients } from "@/server/clients/client-service";
import { AppError } from "@/domain/errors";

beforeEach(() => {
  resetStore();
});

describe("server-paginated clients", () => {
  it("returns only the requested page and a total over 1000", () => {
    const manager = getStore().users.get("anna")!;
    const first = listClients(manager, 1, 25);
    const second = listClients(manager, 2, 25);
    expect(first.items).toHaveLength(25);
    expect(first.total).toBeGreaterThanOrEqual(1000);
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(first.items).not.toEqual(getStore().clients);
  });

  it("allows manager/user and forbids IT", () => {
    expect(listClients(getStore().users.get("anna")!, 1, 1).items).toHaveLength(
      1,
    );
    expect(
      listClients(getStore().users.get("olena")!, 1, 1).items,
    ).toHaveLength(1);
    expect(() => listClients(getStore().users.get("ivan")!, 1, 1)).toThrowError(
      AppError,
    );
  });
});
