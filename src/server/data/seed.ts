import { ROLES } from "@/domain/roles";
import { CLIENT_STATUSES, type Client } from "@/domain/client";
import { USER_STATUSES, type UserRecord } from "@/domain/user";

export const SEED_PASSWORD = "password123";

const seedUser = (
  id: string,
  fullName: string,
  email: string,
  role: UserRecord["role"],
  status: UserRecord["status"],
  managerId: string | null,
): UserRecord => ({
  id,
  fullName,
  email,
  role,
  status,
  managerId,
  password: SEED_PASSWORD,
  createdAt: "2026-01-01T00:00:00.000Z",
});

export function createSeedUsers(): UserRecord[] {
  return [
    seedUser(
      "ivan",
      "Ivan",
      "ivan.it@example.com",
      ROLES.IT,
      USER_STATUSES.ACTIVE,
      null,
    ),
    seedUser(
      "kateryna",
      "Kateryna",
      "kateryna.it@example.com",
      ROLES.IT,
      USER_STATUSES.ACTIVE,
      null,
    ),
    seedUser(
      "anna",
      "Anna",
      "anna.manager@example.com",
      ROLES.MANAGER,
      USER_STATUSES.ACTIVE,
      null,
    ),
    seedUser(
      "petro",
      "Petro",
      "petro.manager@example.com",
      ROLES.MANAGER,
      USER_STATUSES.DEACTIVATED,
      null,
    ),
    seedUser(
      "marta",
      "Marta",
      "marta.manager@example.com",
      ROLES.MANAGER,
      USER_STATUSES.ACTIVE,
      null,
    ),
    seedUser(
      "olena",
      "Olena",
      "olena.user@example.com",
      ROLES.USER,
      USER_STATUSES.ACTIVE,
      "anna",
    ),
    seedUser(
      "taras",
      "Taras",
      "taras.user@example.com",
      ROLES.USER,
      USER_STATUSES.ACTIVE,
      "anna",
    ),
    seedUser(
      "nina",
      "Nina",
      "nina.user@example.com",
      ROLES.USER,
      USER_STATUSES.DEACTIVATED,
      "anna",
    ),
    seedUser(
      "bohdan",
      "Bohdan",
      "bohdan.user@example.com",
      ROLES.USER,
      USER_STATUSES.ACTIVE,
      "anna",
    ),
    seedUser(
      "dmytro",
      "Dmytro",
      "dmytro.user@example.com",
      ROLES.USER,
      USER_STATUSES.ACTIVE,
      "petro",
    ),
  ];
}

const COUNTRIES = ["Cyprus", "Ukraine", "Romania", "Poland", "Germany"];

export function createSeedClients(): Client[] {
  return Array.from({ length: 1250 }, (_, index) => {
    const number = index + 1;
    return {
      id: `client-${number}`,
      name: `Client ${number}`,
      company: `Company ${((index * 7) % 300) + 1}`,
      email: `client${number}@example.com`,
      country: COUNTRIES[index % COUNTRIES.length],
      status:
        index % 5 === 0 ? CLIENT_STATUSES.CHURNED : CLIENT_STATUSES.ACTIVE,
      createdAt: new Date(Date.UTC(2026, 0, 1 + (index % 28))).toISOString(),
    };
  });
}
