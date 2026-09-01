import { execFileSync, spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.ACCEPTANCE_PORT ?? 3100);
const baseUrl = `http://127.0.0.1:${port}`;
let server;
let lastRequest = null;

class VerificationError extends Error {}

function assert(condition, message) {
  if (!condition) throw new VerificationError(message);
}

function bodyText(body) {
  return typeof body === "string" ? body : JSON.stringify(body);
}

function assertStatus(result, expected, message) {
  if (result.response.status !== expected) {
    throw new VerificationError(
      `${message}: expected HTTP ${expected}, got ${result.response.status}; body=${bodyText(result.body)}`,
    );
  }
  return result.body;
}

function assertError(result, expectedStatus, expectedCode, message) {
  const body = assertStatus(result, expectedStatus, message);
  assert(
    body?.error?.code === expectedCode,
    `${message}: expected error ${expectedCode}, got ${bodyText(body)}`,
  );
}

function assertNoPassword(value, message) {
  assert(
    !JSON.stringify(value).includes('"password"'),
    `${message}: response contains password`,
  );
}

function sessionCookie(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  const header = cookies[0] ?? response.headers.get("set-cookie") ?? "";
  const match = header.match(/(?:^|,\s*)session=([^;]+)/);
  assert(Boolean(match), "Login response did not set a session cookie");
  return `session=${match[1]}`;
}

function hasSessionCookie(response) {
  return Boolean(
    (
      response.headers.getSetCookie?.() ?? [
        response.headers.get("set-cookie") ?? "",
      ]
    ).some((cookie) => /(?:^|,\s*)session=/.test(cookie)),
  );
}

async function request(path, options = {}) {
  const { cookie, method = "GET", body, redirect = "manual" } = options;
  lastRequest = { method, path, body };
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
    redirect,
  });
  const text = await response.text();
  let parsed = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // HTML pages and redirects are intentionally returned as text.
  }
  return { response, body: parsed, text };
}

async function login(email) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: { email, password: "password123" },
  });
  const body = assertStatus(result, 200, `login ${email}`);
  assertNoPassword(body, `login ${email}`);
  return { cookie: sessionCookie(result.response), body };
}

async function startServer() {
  const nextBin = "node_modules/next/dist/bin/next";
  server = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  let output = "";
  server.stdout?.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    output += chunk.toString();
  });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new VerificationError(`Production server exited early: ${output}`);
    try {
      await fetch(`${baseUrl}/login`, { redirect: "manual" });
      return;
    } catch {
      await delay(250);
    }
  }
  throw new VerificationError(
    `Timed out waiting for production server: ${output}`,
  );
}

async function stopServer() {
  const currentServer = server;
  server = undefined;
  if (!currentServer || currentServer.exitCode !== null) return;

  const waitForExit = (timeoutMs) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (exited) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        currentServer.off("exit", onExit);
        resolve(exited);
      };
      const onExit = () => finish(true);
      const timeout = setTimeout(() => finish(false), timeoutMs);
      currentServer.once("exit", onExit);
      if (currentServer.exitCode !== null) finish(true);
    });

  try {
    currentServer.kill("SIGTERM");
  } catch {}
  if (await waitForExit(5_000)) return;

  if (process.platform === "win32") {
    try {
      execFileSync(
        "taskkill",
        ["/pid", String(currentServer.pid), "/t", "/f"],
        {
          stdio: "ignore",
        },
      );
    } catch {}
  } else {
    try {
      currentServer.kill("SIGKILL");
    } catch {}
  }
  assert(
    await waitForExit(5_000),
    "Timed out waiting for the production server to exit",
  );
}

async function restartServer() {
  await stopServer();
  await startServer();
}

async function runScenario(number, title, check) {
  try {
    await check();
    console.log(`${number} ${title.padEnd(33, ".")} PASS`);
  } catch (error) {
    console.error(`${number} ${title} FAIL`);
    console.error(`  request: ${JSON.stringify(lastRequest)}`);
    console.error(
      `  ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

async function runAdditional(title, check) {
  try {
    await check();
    console.log(`${title.padEnd(33, ".")} PASS`);
  } catch (error) {
    console.error(`${title} FAIL`);
    console.error(`  request: ${JSON.stringify(lastRequest)}`);
    console.error(
      `  ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

async function scenarioOne() {
  const anna = await login("anna.manager@example.com");
  const usersResult = await request("/api/users", { cookie: anna.cookie });
  const users = assertStatus(usersResult, 200, "Anna visible users");
  assertNoPassword(users, "Anna visible users");
  assert(
    users.users.map((user) => user.id).join(",") === "olena,taras,nina,bohdan",
    `Anna reports were ${users.users.map((user) => user.id).join(",")}`,
  );

  assertError(
    await request("/api/users/dmytro/profile", {
      method: "PATCH",
      cookie: anna.cookie,
      body: { fullName: "No access" },
    }),
    403,
    "FORBIDDEN",
    "Anna editing Dmytro",
  );
  const olenaProfile = await request("/api/users/olena/profile", {
    method: "PATCH",
    cookie: anna.cookie,
    body: { fullName: "Olena Updated" },
  });
  assertNoPassword(
    assertStatus(olenaProfile, 200, "Anna editing Olena"),
    "Anna editing Olena",
  );
  const ninaProfile = await request("/api/users/nina/profile", {
    method: "PATCH",
    cookie: anna.cookie,
    body: { email: "nina.updated@example.com" },
  });
  assertNoPassword(
    assertStatus(ninaProfile, 200, "Anna editing deactivated Nina"),
    "Anna editing deactivated Nina",
  );
}

async function scenarioTwo() {
  const anna = await login("anna.manager@example.com");
  const result = await request("/api/users/anna/role", {
    method: "PATCH",
    cookie: anna.cookie,
    body: { role: "IT" },
  });
  assertError(result, 403, "FORBIDDEN", "Anna self role change");
  const me = assertStatus(
    await request("/api/auth/me", { cookie: anna.cookie }),
    200,
    "Anna role unchanged",
  );
  assert(
    me.user.role === "manager",
    `Anna role changed unexpectedly to ${me.user.role}`,
  );
}

async function scenarioThree() {
  const anna = await login("anna.manager@example.com");
  const first = assertStatus(
    await request("/api/clients?page=1&limit=25", { cookie: anna.cookie }),
    200,
    "client page 1",
  );
  assert(
    first.items.length === 25 &&
      first.total === 1250 &&
      first.page === 1 &&
      first.limit === 25,
    "client page 1 metadata is incorrect",
  );
  const second = assertStatus(
    await request("/api/clients?page=2&limit=25", { cookie: anna.cookie }),
    200,
    "client page 2",
  );
  assert(
    second.items.length === 25 && second.items[0].id !== first.items[0].id,
    "client page 2 is not a distinct page",
  );
  const detail = assertStatus(
    await request(`/api/clients/${first.items[0].id}`, { cookie: anna.cookie }),
    200,
    "client detail",
  );
  assert(
    detail.client.id === first.items[0].id,
    "client detail returned the wrong id",
  );
  for (const query of [
    "page=0&limit=25",
    "page=1.5&limit=25",
    "page=1&limit=0",
    "page=1&limit=101",
    "page=abc&limit=25",
  ]) {
    assertError(
      await request(`/api/clients?${query}`, { cookie: anna.cookie }),
      400,
      "INVALID_INPUT",
      `invalid pagination ${query}`,
    );
  }
}

async function scenarioFour() {
  const ivan = await login("ivan.it@example.com");
  assert(
    ivan.body.redirectTo === "/manage-users",
    `Ivan login redirected to ${ivan.body.redirectTo}`,
  );
  const manage = await request("/manage-users", { cookie: ivan.cookie });
  assertStatus(manage, 200, "Ivan manage-users page");
  const content = await request("/content", { cookie: ivan.cookie });
  assert(
    content.response.status === 403,
    `Ivan content page returned ${content.response.status}`,
  );
  assertError(
    await request("/api/clients?page=1&limit=25", { cookie: ivan.cookie }),
    403,
    "FORBIDDEN",
    "Ivan client API access",
  );
}

async function additionalChecks() {
  await runAdditional("Deactivated login semantics", async () => {
    const deactivated = await request("/api/auth/login", {
      method: "POST",
      body: { email: "petro.manager@example.com", password: "password123" },
    });
    assertError(
      deactivated,
      403,
      "ACCOUNT_DEACTIVATED",
      "deactivated account login",
    );
    assert(
      deactivated.body.error.message === "This account is deactivated.",
      "deactivated account login returned the wrong message",
    );
    assert(
      !hasSessionCookie(deactivated.response),
      "deactivated account login created a session cookie",
    );

    const wrongPassword = await request("/api/auth/login", {
      method: "POST",
      body: { email: "petro.manager@example.com", password: "wrong" },
    });
    assertError(
      wrongPassword,
      401,
      "UNAUTHENTICATED",
      "deactivated account wrong password",
    );
  });

  await runAdditional("Page authorization matrix", async () => {
    const anna = await login("anna.manager@example.com");
    for (const path of [
      "/manage-users",
      "/content",
      "/content/me",
      "/content/client/client-1",
    ]) {
      const page = await request(path, { cookie: anna.cookie });
      assertStatus(page, 200, `Anna ${path}`);
      if (path === "/content") {
        assert(
          !page.text.includes("client-1250"),
          "initial content HTML embeds the complete client dataset",
        );
      }
    }

    const olena = await login("olena.user@example.com");
    for (const path of ["/content", "/content/me"]) {
      assertStatus(
        await request(path, { cookie: olena.cookie }),
        200,
        `Olena ${path}`,
      );
    }
    assertStatus(
      await request("/manage-users", { cookie: olena.cookie }),
      403,
      "Olena manage-users",
    );

    const ivan = await login("ivan.it@example.com");
    assertStatus(
      await request("/manage-users", { cookie: ivan.cookie }),
      200,
      "Ivan manage-users",
    );
    for (const path of [
      "/content",
      "/content/me",
      "/content/client/client-1",
    ]) {
      assertStatus(
        await request(path, { cookie: ivan.cookie }),
        403,
        `Ivan ${path}`,
      );
    }

    const unauthenticated = await request("/content");
    assert(
      unauthenticated.response.status >= 300 &&
        unauthenticated.response.status < 400,
      `unauthenticated content page returned ${unauthenticated.response.status}`,
    );
    assert(
      new URL(unauthenticated.response.headers.get("location") ?? "", baseUrl)
        .pathname === "/login",
      "unauthenticated content page did not redirect to /login",
    );
  });

  await runAdditional("Auth-before-validation", async () => {
    assertError(
      await request("/api/users/anna/profile", {
        method: "PATCH",
        body: "not-json",
      }),
      401,
      "UNAUTHENTICATED",
      "unauthenticated malformed profile request",
    );
  });

  const anna = await login("anna.manager@example.com");
  await runAdditional("Malformed authenticated request", async () => {
    assertError(
      await request("/api/users/olena/profile", {
        method: "PATCH",
        cookie: anna.cookie,
        body: { role: "IT" },
      }),
      400,
      "INVALID_INPUT",
      "authenticated malformed profile request",
    );
  });

  await runAdditional("Mass assignment", async () => {
    assertError(
      await request("/api/users/olena/profile", {
        method: "PATCH",
        cookie: anna.cookie,
        body: { fullName: "Changed", role: "IT" },
      }),
      400,
      "INVALID_INPUT",
      "mass assignment profile request",
    );
    const users = assertStatus(
      await request("/api/users", { cookie: anna.cookie }),
      200,
      "mass assignment role check",
    );
    assert(
      users.users.find((user) => user.id === "olena")?.role === "user",
      "mass assignment changed Olena's role",
    );
  });

  await runAdditional("Active unauthorized request", async () => {
    assertError(
      await request("/api/users/dmytro/profile", {
        method: "PATCH",
        cookie: anna.cookie,
        body: { fullName: "Nope" },
      }),
      403,
      "FORBIDDEN",
      "manager arbitrary-user profile request",
    );
    assertError(
      await request("/api/users/anna/profile", {
        method: "PATCH",
        cookie: anna.cookie,
        body: { fullName: "Nope" },
      }),
      403,
      "FORBIDDEN",
      "manager self profile request",
    );
  });

  const ivan = await login("ivan.it@example.com");
  await runAdditional("Password omission", async () => {
    assertNoPassword(
      assertStatus(
        await request("/api/auth/me", { cookie: ivan.cookie }),
        200,
        "auth me",
      ),
      "auth me",
    );
    assertNoPassword(
      assertStatus(
        await request("/api/users", { cookie: ivan.cookie }),
        200,
        "user list",
      ),
      "user list",
    );
    const created = await request("/api/users", {
      method: "POST",
      cookie: ivan.cookie,
      body: {
        fullName: "Verifier User",
        email: "verifier.user@example.com",
        password: "secret",
        role: "user",
        status: "active",
        managerId: null,
      },
    });
    const createdBody = assertStatus(created, 201, "user create");
    assertNoPassword(createdBody, "user create");
    const id = createdBody.user.id;
    for (const [operation, body] of [
      ["profile", { fullName: "Verifier Updated" }],
      ["role", { role: "manager" }],
      ["status", { status: "deactivated" }],
    ]) {
      const result = await request(`/api/users/${id}/${operation}`, {
        method: "PATCH",
        cookie: ivan.cookie,
        body,
      });
      assertNoPassword(
        assertStatus(result, 200, `user ${operation}`),
        `user ${operation}`,
      );
    }
  });

  await runAdditional("Promoted-manager regression", async () => {
    assertNoPassword(
      assertStatus(
        await request("/api/users/olena/role", {
          method: "PATCH",
          cookie: ivan.cookie,
          body: { role: "manager" },
        }),
        200,
        "promote Olena",
      ),
      "promote Olena",
    );
    assertError(
      await request("/api/users/olena/profile", {
        method: "PATCH",
        cookie: anna.cookie,
        body: { fullName: "Should fail" },
      }),
      403,
      "FORBIDDEN",
      "Anna editing promoted Olena",
    );
  });

  await runAdditional("Pagination validation", async () => {
    for (const query of [
      "page=0&limit=25",
      "page=1.5&limit=25",
      "page=1&limit=0",
      "page=1&limit=101",
      "page=abc&limit=25",
    ]) {
      assertError(
        await request(`/api/clients?${query}`, { cookie: anna.cookie }),
        400,
        "INVALID_INPUT",
        `pagination ${query}`,
      );
    }
  });

  await runAdditional("IT client denial", async () => {
    assertError(
      await request("/api/clients?page=1&limit=25", { cookie: ivan.cookie }),
      403,
      "FORBIDDEN",
      "IT clients API",
    );
  });
}

async function scenarioFive() {
  await restartServer();
  const ivan = await login("ivan.it@example.com");
  assertError(
    await request("/api/users/ivan/status", {
      method: "PATCH",
      cookie: ivan.cookie,
      body: { status: "deactivated" },
    }),
    403,
    "CANNOT_DEACTIVATE_SELF",
    "Ivan self deactivation with two active IT accounts",
  );
  assertNoPassword(
    assertStatus(
      await request("/api/users/kateryna/status", {
        method: "PATCH",
        cookie: ivan.cookie,
        body: { status: "deactivated" },
      }),
      200,
      "Ivan deactivates Kateryna",
    ),
    "Ivan deactivates Kateryna",
  );
  assertError(
    await request("/api/users/ivan/status", {
      method: "PATCH",
      cookie: ivan.cookie,
      body: { status: "deactivated" },
    }),
    409,
    "LAST_ACTIVE_IT",
    "Ivan self deactivation as last active IT",
  );

  await restartServer();
  const roleIvan = await login("ivan.it@example.com");
  assertError(
    await request("/api/users/ivan/role", {
      method: "PATCH",
      cookie: roleIvan.cookie,
      body: { role: "manager" },
    }),
    403,
    "CANNOT_CHANGE_OWN_ROLE",
    "Ivan self demotion with two active IT accounts",
  );
  assertNoPassword(
    assertStatus(
      await request("/api/users/kateryna/status", {
        method: "PATCH",
        cookie: roleIvan.cookie,
        body: { status: "deactivated" },
      }),
      200,
      "deactivate second IT for role invariant",
    ),
    "deactivate second IT for role invariant",
  );
  assertError(
    await request("/api/users/ivan/role", {
      method: "PATCH",
      cookie: roleIvan.cookie,
      body: { role: "manager" },
    }),
    409,
    "LAST_ACTIVE_IT",
    "Ivan self demotion as last active IT",
  );
}

async function scenarioSix() {
  await restartServer();
  const olena = await login("olena.user@example.com");
  const ivan = await login("ivan.it@example.com");
  assertStatus(
    await request("/api/clients?page=1&limit=25", { cookie: olena.cookie }),
    200,
    "Olena pre-deactivation clients",
  );
  assertStatus(
    await request("/api/users/olena/status", {
      method: "PATCH",
      cookie: ivan.cookie,
      body: { status: "deactivated" },
    }),
    200,
    "Ivan deactivates Olena",
  );
  assertError(
    await request("/api/clients?page=2&limit=25", { cookie: olena.cookie }),
    401,
    "UNAUTHENTICATED",
    "old Olena session API access",
  );
  const page = await request("/content", { cookie: olena.cookie });
  assert(
    page.response.status >= 300 && page.response.status < 400,
    `old Olena content page returned ${page.response.status}`,
  );
  assert(
    new URL(page.response.headers.get("location") ?? "", baseUrl).pathname ===
      "/login",
    `old Olena page redirected to ${page.response.headers.get("location")}`,
  );
}

async function main() {
  await startServer();
  console.log("Acceptance verification");
  await runScenario(1, "Manager direct reports", scenarioOne);
  await runScenario(2, "Manager self role change", scenarioTwo);
  await runScenario(3, "Client pagination", scenarioThree);
  await runScenario(4, "IT content isolation", scenarioFour);
  console.log("\nAdditional security checks");
  await additionalChecks();
  await runScenario(5, "IT account invariants", scenarioFive);
  await runScenario(6, "Immediate deactivation", scenarioSix);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await stopServer();
}
