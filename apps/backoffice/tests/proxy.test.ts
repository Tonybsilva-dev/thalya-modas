import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { authSessionCookieName } from "../src/shared/auth/session-cookie";

const originalFetch = globalThis.fetch;
test("ADMIN resumes the persisted onboarding step and cannot skip to operations", async () => {
  globalThis.fetch = async () => Response.json({ role: "ROLE_ADMIN", accountStatus: "ACTIVE", entryDestination: "/onboarding/address" });
  for (const path of ["/auth/login", "/onboarding", "/admin/dashboard"]) {
    assert.equal((await proxy(request(path))).headers.get("location"), "http://localhost:3001/onboarding/address");
  }
  assert.equal((await proxy(request("/onboarding/address"))).headers.get("x-middleware-next"), "1");
});
test("ADMIN chooses a plan before entering the store", async () => {
  globalThis.fetch = async () => Response.json({ role: "ROLE_ADMIN", accountStatus: "ACTIVE", entryDestination: "/onboarding/plan" });
  assert.equal((await proxy(request("/admin/dashboard"))).headers.get("location"), "http://localhost:3001/onboarding/plan");
  assert.equal((await proxy(request("/onboarding/plan"))).headers.get("x-middleware-next"), "1");
});
afterEach(() => { globalThis.fetch = originalFetch; });
function request(path: string, session = true) {
  return new NextRequest(`http://localhost:3001${path}`, {
    headers: session ? {cookie: `${authSessionCookieName}=test-session`} : {},
  });
}
function mockUser(role: string, accountStatus = "ACTIVE") {
  globalThis.fetch = async () => Response.json({role, accountStatus});
}
for (const path of ["/backoffice", "/backoffice/tenants", "/backoffice/tenants/test-company", "/manager/dashboard/suppliers"]) {
  test(`unauthenticated request to ${path} goes to login`, async () => {
    globalThis.fetch = async () => {throw new Error("No session must not call API");};
    assert.equal((await proxy(request(path, false))).headers.get("location"), "http://localhost:3001/auth/login");
  });
}
for (const path of ["/", "/auth/login", "/manager/dashboard", "/employee/dashboard/inventory", "/onboarding"]) {
  test(`SUPER_ADMIN enters backoffice from ${path}`, async () => {
    mockUser("ROLE_SUPER_ADMIN");
    assert.equal((await proxy(request(path))).headers.get("location"), "http://localhost:3001/backoffice");
  });
}
test("SUPER_ADMIN can access tenant detail without an operational store", async () => {
  globalThis.fetch = async (url, init) => {
    assert.ok(String(url).endsWith("/auth/me"));
    assert.equal(new Headers(init?.headers).get("cookie"), `${authSessionCookieName}=test-session`);
    assert.equal(init?.cache, "no-store");
    return Response.json({role: "ROLE_SUPER_ADMIN", accountStatus: "ACTIVE"});
  };
  const response = await proxy(request("/backoffice/tenants/test-company"));
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("x-middleware-next"), "1");
});
for (const role of ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_EMPLOYEE", "ROLE_CUSTOMER"]) {
  test(`${role} cannot access platform or legacy pages`, async () => {
    mockUser(role);
    for (const path of ["/backoffice", "/backoffice/users", "/auth/login", "/onboarding"]) {
      assert.equal((await proxy(request(path))).headers.get("location"), `http://localhost:3001/${role.replace("ROLE_", "").toLowerCase()}/dashboard`);
    }
  });
}
test("expired session redirects to login and clears cookie", async () => {
  globalThis.fetch = async () => new Response(null, {status: 401});
  const response = await proxy(request("/backoffice"));
  assert.equal(response.headers.get("location"), "http://localhost:3001/auth/login");
  assert.equal(response.cookies.get(authSessionCookieName)?.value, "");
});
test("suspended SUPER_ADMIN is denied", async () => {
  mockUser("ROLE_SUPER_ADMIN", "SUSPENDED");
  assert.equal((await proxy(request("/backoffice"))).headers.get("location"), "http://localhost:3001/auth/login");
});
test("API outage fails closed", async () => {
  globalThis.fetch = async () => {throw new Error("Unavailable");};
  assert.equal((await proxy(request("/backoffice"))).headers.get("location"), "http://localhost:3001/auth/login");
});

for(const [role,segment] of [["ROLE_ADMIN","admin"],["ROLE_MANAGER","manager"],["ROLE_EMPLOYEE","employee"],["ROLE_CUSTOMER","customer"]]) {
 test(`${role} enters its own segment and cannot enter another`,async()=>{
  mockUser(role);
  assert.equal((await proxy(request(`/${segment}/dashboard`))).headers.get("x-middleware-next"),"1");
  assert.equal((await proxy(request("/auth/login"))).headers.get("location"),`http://localhost:3001/${segment}/dashboard`);
  assert.equal((await proxy(request("/backoffice"))).headers.get("location"),`http://localhost:3001/${segment}/dashboard`);
 });
}
