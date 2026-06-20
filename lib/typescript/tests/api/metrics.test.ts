import { WgPortalClient } from "../../src/index";
import { WgPortalError } from "../../src/client";
import { mockOk, mockError, lastCall } from "../helpers/fetch-mock";
import {
  INTERFACE_METRICS,
  PEER_METRICS,
  USER_METRICS,
  PEER,
  API_ERROR_401,
  API_ERROR_404,
  API_ERROR_500,
} from "../fixtures";

const BASE = "http://wg-portal.test:8888";
const client = new WgPortalClient({
  baseUrl: BASE,
  username: "admin@wgportal.local",
  apiToken: "test-token",
});

const PEER_ID = PEER.Identifier;
const PEER_ID_ENCODED = encodeURIComponent(PEER_ID);

describe("MetricsApi", () => {
  afterEach(() => jest.resetAllMocks());

  describe("byInterface()", () => {
    it("calls GET /api/v1/metrics/by-interface/{id}", async () => {
      mockOk(INTERFACE_METRICS);
      await client.metrics.byInterface("wg0");
      expect(lastCall().url).toBe(`${BASE}/api/v1/metrics/by-interface/wg0`);
    });

    it("URL-encodes the interface id", async () => {
      mockOk(INTERFACE_METRICS);
      await client.metrics.byInterface("wg/0 test");
      expect(lastCall().url).toContain("wg%2F0%20test");
    });

    it("returns interface metrics", async () => {
      mockOk(INTERFACE_METRICS);
      const result = await client.metrics.byInterface("wg0");
      expect(result.InterfaceIdentifier).toBe("wg0");
      expect(result.BytesReceived).toBe(123456789);
      expect(result.BytesTransmitted).toBe(987654321);
    });

    it("returns zero metrics for idle interface", async () => {
      const empty = { InterfaceIdentifier: "wg0", BytesReceived: 0, BytesTransmitted: 0 };
      mockOk(empty);
      const result = await client.metrics.byInterface("wg0");
      expect(result.BytesReceived).toBe(0);
      expect(result.BytesTransmitted).toBe(0);
    });

    it("throws WgPortalError on 400", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "invalid id" });
      await expect(client.metrics.byInterface("")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.metrics.byInterface("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404 when interface not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.metrics.byInterface("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.metrics.byInterface("wg0")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("byPeer()", () => {
    it("calls GET /api/v1/metrics/by-peer/{id}", async () => {
      mockOk(PEER_METRICS);
      await client.metrics.byPeer(PEER_ID);
      expect(lastCall().url).toBe(`${BASE}/api/v1/metrics/by-peer/${PEER_ID_ENCODED}`);
    });

    it("URL-encodes peer id trailing = sign", async () => {
      mockOk(PEER_METRICS);
      await client.metrics.byPeer(PEER_ID);
      const url = lastCall().url;
      expect(url).toContain("%3D");  // = encoded
      expect(url).not.toContain("Dg="); // raw = must not appear
    });

    it("returns peer metrics", async () => {
      mockOk(PEER_METRICS);
      const result = await client.metrics.byPeer(PEER_ID);
      expect(result.PeerIdentifier).toBe(PEER_ID);
      expect(result.BytesReceived).toBe(1000);
      expect(result.BytesTransmitted).toBe(2000);
    });

    it("returns metrics with handshake and ping timestamps", async () => {
      mockOk(PEER_METRICS);
      const result = await client.metrics.byPeer(PEER_ID);
      expect(result.LastHandshake).toBe("2026-06-20T14:00:00Z");
      expect(result.LastPing).toBe("2026-06-20T14:01:00Z");
      expect(result.IsPingable).toBe(true);
    });

    it("returns metrics for offline peer (no handshake)", async () => {
      const offline = {
        PeerIdentifier: PEER_ID,
        BytesReceived: 0,
        BytesTransmitted: 0,
        IsPingable: false,
      };
      mockOk(offline);
      const result = await client.metrics.byPeer(PEER_ID);
      expect(result.IsPingable).toBe(false);
      expect(result.LastHandshake).toBeUndefined();
    });

    it("throws WgPortalError on 400", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "invalid peer id" });
      await expect(client.metrics.byPeer("")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.metrics.byPeer(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404 when peer not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.metrics.byPeer("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.metrics.byPeer(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("byUser()", () => {
    it("calls GET /api/v1/metrics/by-user/{id}", async () => {
      mockOk(USER_METRICS);
      await client.metrics.byUser("uid-1234567");
      expect(lastCall().url).toBe(`${BASE}/api/v1/metrics/by-user/uid-1234567`);
    });

    it("URL-encodes the user id", async () => {
      mockOk(USER_METRICS);
      await client.metrics.byUser("uid/test user");
      expect(lastCall().url).toContain("uid%2Ftest%20user");
    });

    it("returns user metrics with aggregated bytes", async () => {
      mockOk(USER_METRICS);
      const result = await client.metrics.byUser("uid-1234567");
      expect(result.UserIdentifier).toBe("uid-1234567");
      expect(result.BytesReceived).toBe(11000);
      expect(result.BytesTransmitted).toBe(22000);
    });

    it("returns peer count", async () => {
      mockOk(USER_METRICS);
      const result = await client.metrics.byUser("uid-1234567");
      expect(result.PeerCount).toBe(2);
    });

    it("returns per-peer metrics array", async () => {
      mockOk(USER_METRICS);
      const result = await client.metrics.byUser("uid-1234567");
      expect(result.PeerMetrics).toHaveLength(1);
      expect(result.PeerMetrics[0].PeerIdentifier).toBe(PEER_ID);
    });

    it("returns empty PeerMetrics for user with no peers", async () => {
      const empty = {
        UserIdentifier: "uid-nopeer",
        BytesReceived: 0,
        BytesTransmitted: 0,
        PeerCount: 0,
        PeerMetrics: [],
      };
      mockOk(empty);
      const result = await client.metrics.byUser("uid-nopeer");
      expect(result.PeerMetrics).toHaveLength(0);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.metrics.byUser("uid-1234567")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404 when user not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.metrics.byUser("nonexistent")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.metrics.byUser("uid-1234567")).rejects.toBeInstanceOf(WgPortalError);
    });
  });
});
