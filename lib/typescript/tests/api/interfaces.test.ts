import { WgPortalClient } from "../../src/index";
import { WgPortalError } from "../../src/client";
import { mockOk, mockError, mockNoContent, lastCall } from "../helpers/fetch-mock";
import {
  INTERFACE,
  INTERFACE_LIST,
  INTERFACE_PREPARED,
  API_ERROR_401,
  API_ERROR_403,
  API_ERROR_404,
  API_ERROR_409,
  API_ERROR_500,
} from "../fixtures";

const client = new WgPortalClient({
  baseUrl: "http://wg-portal.test:8888",
  username: "admin@wgportal.local",
  apiToken: "test-token",
});

describe("InterfacesApi", () => {
  afterEach(() => jest.resetAllMocks());

  describe("getAll()", () => {
    it("calls GET /api/v1/interface/all", async () => {
      mockOk(INTERFACE_LIST);
      await client.interfaces.getAll();
      expect(lastCall().url).toBe("http://wg-portal.test:8888/api/v1/interface/all");
      expect(lastCall().init.method).toBeUndefined(); // default GET
    });

    it("returns array of interfaces", async () => {
      mockOk(INTERFACE_LIST);
      const result = await client.interfaces.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].Identifier).toBe("wg0");
    });

    it("returns empty array when no interfaces", async () => {
      mockOk([]);
      const result = await client.interfaces.getAll();
      expect(result).toEqual([]);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.interfaces.getAll()).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.interfaces.getAll()).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getById()", () => {
    it("calls GET /api/v1/interface/by-id/{id}", async () => {
      mockOk(INTERFACE);
      await client.interfaces.getById("wg0");
      expect(lastCall().url).toBe("http://wg-portal.test:8888/api/v1/interface/by-id/wg0");
    });

    it("URL-encodes the interface id", async () => {
      mockOk(INTERFACE);
      await client.interfaces.getById("wg/0 test");
      expect(lastCall().url).toContain("wg%2F0%20test");
    });

    it("returns the interface", async () => {
      mockOk(INTERFACE);
      const result = await client.interfaces.getById("wg0");
      expect(result.Identifier).toBe("wg0");
      expect(result.Mode).toBe("server");
      expect(result.PublicKey).toBe(INTERFACE.PublicKey);
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.interfaces.getById("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.interfaces.getById("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.interfaces.getById("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("prepare()", () => {
    it("calls GET /api/v1/interface/prepare", async () => {
      mockOk(INTERFACE_PREPARED);
      await client.interfaces.prepare();
      expect(lastCall().url).toBe("http://wg-portal.test:8888/api/v1/interface/prepare");
    });

    it("returns prepared interface with generated keys", async () => {
      mockOk(INTERFACE_PREPARED);
      const result = await client.interfaces.prepare();
      expect(result.PrivateKey).toBeDefined();
      expect(result.PublicKey).toBeDefined();
      expect(result.Identifier).toBe("wg1");
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.interfaces.prepare()).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.interfaces.prepare()).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("create()", () => {
    it("calls POST /api/v1/interface/new", async () => {
      mockOk(INTERFACE);
      await client.interfaces.create(INTERFACE);
      expect(lastCall().url).toBe("http://wg-portal.test:8888/api/v1/interface/new");
      expect(lastCall().init.method).toBe("POST");
    });

    it("sends interface data as JSON body", async () => {
      mockOk(INTERFACE);
      await client.interfaces.create(INTERFACE);
      expect(lastCall().init.body).toBe(JSON.stringify(INTERFACE));
    });

    it("returns created interface", async () => {
      mockOk(INTERFACE);
      const result = await client.interfaces.create(INTERFACE);
      expect(result.Identifier).toBe(INTERFACE.Identifier);
    });

    it("throws WgPortalError on 409 conflict", async () => {
      mockError(API_ERROR_409);
      await expect(client.interfaces.create(INTERFACE)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError with code 409", async () => {
      mockError(API_ERROR_409);
      const err = await client.interfaces.create(INTERFACE).catch((e) => e);
      expect((err as WgPortalError).code).toBe(409);
    });

    it("throws WgPortalError on 400", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "invalid data" });
      await expect(client.interfaces.create(INTERFACE)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.interfaces.create(INTERFACE)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("update()", () => {
    it("calls PUT /api/v1/interface/by-id/{id}", async () => {
      mockOk(INTERFACE);
      await client.interfaces.update("wg0", INTERFACE);
      expect(lastCall().url).toBe("http://wg-portal.test:8888/api/v1/interface/by-id/wg0");
      expect(lastCall().init.method).toBe("PUT");
    });

    it("URL-encodes the interface id", async () => {
      mockOk(INTERFACE);
      await client.interfaces.update("wg/0", INTERFACE);
      expect(lastCall().url).toContain("wg%2F0");
    });

    it("sends updated interface as JSON body", async () => {
      const updated = { ...INTERFACE, DisplayName: "Updated Name" };
      mockOk(updated);
      await client.interfaces.update("wg0", updated);
      expect(lastCall().init.body).toBe(JSON.stringify(updated));
    });

    it("returns updated interface", async () => {
      const updated = { ...INTERFACE, DisplayName: "Updated Name" };
      mockOk(updated);
      const result = await client.interfaces.update("wg0", updated);
      expect(result.DisplayName).toBe("Updated Name");
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.interfaces.update("nonexistent", INTERFACE)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.interfaces.update("wg0", INTERFACE)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("delete()", () => {
    it("calls DELETE /api/v1/interface/by-id/{id}", async () => {
      mockNoContent();
      await client.interfaces.delete("wg0");
      expect(lastCall().url).toBe("http://wg-portal.test:8888/api/v1/interface/by-id/wg0");
      expect(lastCall().init.method).toBe("DELETE");
    });

    it("URL-encodes the interface id", async () => {
      mockNoContent();
      await client.interfaces.delete("wg/0 test");
      expect(lastCall().url).toContain("wg%2F0%20test");
    });

    it("resolves without value on success", async () => {
      mockNoContent();
      await expect(client.interfaces.delete("wg0")).resolves.toBeUndefined();
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.interfaces.delete("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.interfaces.delete("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.interfaces.delete("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });
  });
});
