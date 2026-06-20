import { WgPortalClient } from "../../src/index";
import { WgPortalError } from "../../src/client";
import { mockOk, mockError, mockNoContent, lastCall } from "../helpers/fetch-mock";
import {
  USER,
  USER_ADMIN,
  USER_LIST,
  API_ERROR_401,
  API_ERROR_403,
  API_ERROR_404,
  API_ERROR_409,
  API_ERROR_500,
} from "../fixtures";

const BASE = "http://wg-portal.test:8888";
const client = new WgPortalClient({
  baseUrl: BASE,
  username: "admin@wgportal.local",
  apiToken: "test-token",
});

describe("UsersApi", () => {
  afterEach(() => jest.resetAllMocks());

  describe("getAll()", () => {
    it("calls GET /api/v1/user/all", async () => {
      mockOk(USER_LIST);
      await client.users.getAll();
      expect(lastCall().url).toBe(`${BASE}/api/v1/user/all`);
    });

    it("returns array of users", async () => {
      mockOk(USER_LIST);
      const result = await client.users.getAll();
      expect(result).toHaveLength(2);
    });

    it("returns user fields correctly", async () => {
      mockOk(USER_LIST);
      const result = await client.users.getAll();
      expect(result[0].Identifier).toBe("uid-1234567");
      expect(result[0].Email).toBe("test@test.com");
      expect(result[1].IsAdmin).toBe(true);
    });

    it("returns empty array when no users", async () => {
      mockOk([]);
      const result = await client.users.getAll();
      expect(result).toEqual([]);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.users.getAll()).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.users.getAll()).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getById()", () => {
    it("calls GET /api/v1/user/by-id/{id}", async () => {
      mockOk(USER);
      await client.users.getById("uid-1234567");
      expect(lastCall().url).toBe(`${BASE}/api/v1/user/by-id/uid-1234567`);
    });

    it("URL-encodes the user id", async () => {
      mockOk(USER);
      await client.users.getById("uid/test user");
      expect(lastCall().url).toContain("uid%2Ftest%20user");
    });

    it("returns the user", async () => {
      mockOk(USER);
      const result = await client.users.getById("uid-1234567");
      expect(result.Identifier).toBe("uid-1234567");
      expect(result.Email).toBe("test@test.com");
      expect(result.Firstname).toBe("Max");
    });

    it("returns admin user with admin flag", async () => {
      mockOk(USER_ADMIN);
      const result = await client.users.getById("uid-admin");
      expect(result.IsAdmin).toBe(true);
      expect(result.ApiEnabled).toBe(true);
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.users.getById("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.users.getById("uid-1234567")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403 for non-admin accessing other user", async () => {
      mockError(API_ERROR_403);
      await expect(client.users.getById("uid-other")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("create()", () => {
    it("calls POST /api/v1/user/new", async () => {
      mockOk(USER);
      await client.users.create(USER);
      expect(lastCall().url).toBe(`${BASE}/api/v1/user/new`);
      expect(lastCall().init.method).toBe("POST");
    });

    it("sends user data as JSON body", async () => {
      mockOk(USER);
      await client.users.create(USER);
      expect(lastCall().init.body).toBe(JSON.stringify(USER));
    });

    it("sets Content-Type application/json", async () => {
      mockOk(USER);
      await client.users.create(USER);
      expect(lastCall().init.headers).toMatchObject({ "Content-Type": "application/json" });
    });

    it("returns created user", async () => {
      mockOk(USER);
      const result = await client.users.create(USER);
      expect(result.Identifier).toBe("uid-1234567");
    });

    it("allows creating admin user", async () => {
      mockOk(USER_ADMIN);
      const result = await client.users.create(USER_ADMIN);
      expect(result.IsAdmin).toBe(true);
    });

    it("throws WgPortalError on 409 when user already exists", async () => {
      mockError(API_ERROR_409);
      await expect(client.users.create(USER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("409 error has code 409", async () => {
      mockError(API_ERROR_409);
      const err = await client.users.create(USER).catch((e) => e);
      expect((err as WgPortalError).code).toBe(409);
    });

    it("throws WgPortalError on 403 for non-admins", async () => {
      mockError(API_ERROR_403);
      await expect(client.users.create(USER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 400 for bad data", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "password too short" });
      await expect(client.users.create(USER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.users.create(USER)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("update()", () => {
    it("calls PUT /api/v1/user/by-id/{id}", async () => {
      mockOk(USER);
      await client.users.update("uid-1234567", USER);
      expect(lastCall().url).toBe(`${BASE}/api/v1/user/by-id/uid-1234567`);
      expect(lastCall().init.method).toBe("PUT");
    });

    it("URL-encodes the user id", async () => {
      mockOk(USER);
      await client.users.update("uid/test", USER);
      expect(lastCall().url).toContain("uid%2Ftest");
    });

    it("sends updated user as JSON body", async () => {
      const updated = { ...USER, Firstname: "Updated" };
      mockOk(updated);
      await client.users.update("uid-1234567", updated);
      expect(lastCall().init.body).toBe(JSON.stringify(updated));
    });

    it("returns updated user", async () => {
      const updated = { ...USER, Department: "New Department" };
      mockOk(updated);
      const result = await client.users.update("uid-1234567", updated);
      expect(result.Department).toBe("New Department");
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.users.update("nonexistent", USER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403 for non-admins", async () => {
      mockError(API_ERROR_403);
      await expect(client.users.update("uid-1234567", USER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 400 for invalid data", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "invalid email" });
      await expect(client.users.update("uid-1234567", USER)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("delete()", () => {
    it("calls DELETE /api/v1/user/by-id/{id}", async () => {
      mockNoContent();
      await client.users.delete("uid-1234567");
      expect(lastCall().url).toBe(`${BASE}/api/v1/user/by-id/uid-1234567`);
      expect(lastCall().init.method).toBe("DELETE");
    });

    it("URL-encodes the user id", async () => {
      mockNoContent();
      await client.users.delete("uid/test user");
      expect(lastCall().url).toContain("uid%2Ftest%20user");
    });

    it("resolves without value on success", async () => {
      mockNoContent();
      await expect(client.users.delete("uid-1234567")).resolves.toBeUndefined();
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.users.delete("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.users.delete("uid-1234567")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.users.delete("uid-1234567")).rejects.toBeInstanceOf(WgPortalError);
    });
  });
});
