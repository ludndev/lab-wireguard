import { WgPortalClient } from "../../src/index";
import { WgPortalError } from "../../src/client";
import { mockOk, mockError, mockNoContent, lastCall } from "../helpers/fetch-mock";
import {
  PEER,
  PEER_LIST,
  PEER_PREPARED,
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

// Public key contains +, /, = — must be URL-encoded in path segments
const PEER_ID = PEER.Identifier; // "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="
const PEER_ID_ENCODED = encodeURIComponent(PEER_ID);

describe("PeersApi", () => {
  afterEach(() => jest.resetAllMocks());

  describe("getById()", () => {
    it("calls GET /api/v1/peer/by-id/{id}", async () => {
      mockOk(PEER);
      await client.peers.getById(PEER_ID);
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/by-id/${PEER_ID_ENCODED}`);
    });

    it("URL-encodes public key trailing = sign", async () => {
      mockOk(PEER);
      await client.peers.getById(PEER_ID);
      const url = lastCall().url;
      expect(url).toContain("%3D");  // = encoded
      expect(url).not.toContain("Dg="); // raw = must not appear
    });

    it("returns the peer", async () => {
      mockOk(PEER);
      const result = await client.peers.getById(PEER_ID);
      expect(result.Identifier).toBe(PEER_ID);
      expect(result.InterfaceIdentifier).toBe("wg0");
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.peers.getById("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.peers.getById(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.peers.getById(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getByInterface()", () => {
    it("calls GET /api/v1/peer/by-interface/{id}", async () => {
      mockOk(PEER_LIST);
      await client.peers.getByInterface("wg0");
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/by-interface/wg0`);
    });

    it("URL-encodes the interface id", async () => {
      mockOk(PEER_LIST);
      await client.peers.getByInterface("wg/0 test");
      expect(lastCall().url).toContain("wg%2F0%20test");
    });

    it("returns list of peers", async () => {
      mockOk(PEER_LIST);
      const result = await client.peers.getByInterface("wg0");
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no peers on interface", async () => {
      mockOk([]);
      const result = await client.peers.getByInterface("wg0");
      expect(result).toEqual([]);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.peers.getByInterface("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.peers.getByInterface("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getByUser()", () => {
    it("calls GET /api/v1/peer/by-user/{id}", async () => {
      mockOk(PEER_LIST);
      await client.peers.getByUser("uid-1234567");
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/by-user/uid-1234567`);
    });

    it("URL-encodes the user id", async () => {
      mockOk(PEER_LIST);
      await client.peers.getByUser("uid/test user");
      expect(lastCall().url).toContain("uid%2Ftest%20user");
    });

    it("returns list of peers for user", async () => {
      mockOk(PEER_LIST);
      const result = await client.peers.getByUser("uid-1234567");
      expect(result).toHaveLength(2);
      expect(result[0].UserIdentifier).toBe("uid-1234567");
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.peers.getByUser("uid-1234567")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("prepare()", () => {
    it("calls GET /api/v1/peer/prepare/{interfaceId}", async () => {
      mockOk(PEER_PREPARED);
      await client.peers.prepare("wg0");
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/prepare/wg0`);
    });

    it("URL-encodes the interface id", async () => {
      mockOk(PEER_PREPARED);
      await client.peers.prepare("wg/0");
      expect(lastCall().url).toContain("wg%2F0");
    });

    it("returns prepared peer with generated keys and IP", async () => {
      mockOk(PEER_PREPARED);
      const result = await client.peers.prepare("wg0");
      expect(result.PrivateKey).toBeDefined();
      expect(result.InterfaceIdentifier).toBe("wg0");
    });

    it("throws WgPortalError on 404 when interface not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.peers.prepare("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.peers.prepare("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("create()", () => {
    it("calls POST /api/v1/peer/new", async () => {
      mockOk(PEER);
      await client.peers.create(PEER);
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/new`);
      expect(lastCall().init.method).toBe("POST");
    });

    it("sends peer data as JSON body", async () => {
      mockOk(PEER);
      await client.peers.create(PEER);
      expect(lastCall().init.body).toBe(JSON.stringify(PEER));
    });

    it("sets Content-Type application/json", async () => {
      mockOk(PEER);
      await client.peers.create(PEER);
      expect(lastCall().init.headers).toMatchObject({ "Content-Type": "application/json" });
    });

    it("returns created peer", async () => {
      mockOk(PEER);
      const result = await client.peers.create(PEER);
      expect(result.Identifier).toBe(PEER_ID);
    });

    it("throws WgPortalError on 409 when peer already exists", async () => {
      mockError(API_ERROR_409);
      await expect(client.peers.create(PEER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403 for non-admins", async () => {
      mockError(API_ERROR_403);
      await expect(client.peers.create(PEER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 400 for bad data", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "missing required field" });
      await expect(client.peers.create(PEER)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("update()", () => {
    it("calls PUT /api/v1/peer/by-id/{id}", async () => {
      mockOk(PEER);
      await client.peers.update(PEER_ID, PEER);
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/by-id/${PEER_ID_ENCODED}`);
      expect(lastCall().init.method).toBe("PUT");
    });

    it("URL-encodes peer id trailing = sign", async () => {
      mockOk(PEER);
      await client.peers.update(PEER_ID, PEER);
      const url = lastCall().url;
      expect(url).toContain("%3D");  // = encoded
      expect(url).not.toContain("Dg="); // raw = must not appear
    });

    it("sends updated peer data as JSON", async () => {
      const updated = { ...PEER, DisplayName: "Renamed Peer" };
      mockOk(updated);
      await client.peers.update(PEER_ID, updated);
      expect(lastCall().init.body).toBe(JSON.stringify(updated));
    });

    it("returns updated peer", async () => {
      const updated = { ...PEER, DisplayName: "Renamed Peer" };
      mockOk(updated);
      const result = await client.peers.update(PEER_ID, updated);
      expect(result.DisplayName).toBe("Renamed Peer");
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.peers.update("nonexistent", PEER)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403 for non-admins", async () => {
      mockError(API_ERROR_403);
      await expect(client.peers.update(PEER_ID, PEER)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("delete()", () => {
    it("calls DELETE /api/v1/peer/by-id/{id}", async () => {
      mockNoContent();
      await client.peers.delete(PEER_ID);
      expect(lastCall().url).toBe(`${BASE}/api/v1/peer/by-id/${PEER_ID_ENCODED}`);
      expect(lastCall().init.method).toBe("DELETE");
    });

    it("URL-encodes peer id with special chars", async () => {
      mockNoContent();
      await client.peers.delete(PEER_ID);
      const url = lastCall().url;
      // raw =, + should be encoded
      expect(url).toContain("%3D");
    });

    it("resolves without value on success", async () => {
      mockNoContent();
      await expect(client.peers.delete(PEER_ID)).resolves.toBeUndefined();
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.peers.delete("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.peers.delete(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.peers.delete(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });
  });
});
