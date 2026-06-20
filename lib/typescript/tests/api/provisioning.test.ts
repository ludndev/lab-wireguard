import { WgPortalClient } from "../../src/index";
import { WgPortalError } from "../../src/client";
import { mockOk, mockOkRaw, mockError, lastCall } from "../helpers/fetch-mock";
import {
  PEER,
  PROVISIONING_REQUEST,
  PROVISIONING_REQUEST_MINIMAL,
  PROVISIONING_REQUEST_WITH_KEY,
  WG_QUICK_CONFIG,
  QR_PNG_BUFFER,
  USER_INFORMATION,
  API_ERROR_401,
  API_ERROR_403,
  API_ERROR_404,
  API_ERROR_500,
} from "../fixtures";

const BASE = "http://wg-portal.test:8888";
const client = new WgPortalClient({
  baseUrl: BASE,
  username: "admin@wgportal.local",
  apiToken: "test-token",
});

const PEER_ID = PEER.Identifier; // contains +, /, =
const PEER_ID_ENCODED = encodeURIComponent(PEER_ID);

describe("ProvisioningApi", () => {
  afterEach(() => jest.resetAllMocks());

  describe("newPeer()", () => {
    it("calls POST /api/v1/provisioning/new-peer", async () => {
      mockOk(PEER);
      await client.provisioning.newPeer(PROVISIONING_REQUEST);
      expect(lastCall().url).toBe(`${BASE}/api/v1/provisioning/new-peer`);
      expect(lastCall().init.method).toBe("POST");
    });

    it("sends provisioning request as JSON", async () => {
      mockOk(PEER);
      await client.provisioning.newPeer(PROVISIONING_REQUEST);
      expect(lastCall().init.body).toBe(JSON.stringify(PROVISIONING_REQUEST));
    });

    it("works with minimal request (InterfaceIdentifier only)", async () => {
      mockOk(PEER);
      await client.provisioning.newPeer(PROVISIONING_REQUEST_MINIMAL);
      expect(lastCall().init.body).toBe(JSON.stringify(PROVISIONING_REQUEST_MINIMAL));
    });

    it("accepts optional PublicKey and PresharedKey", async () => {
      mockOk(PEER);
      await client.provisioning.newPeer(PROVISIONING_REQUEST_WITH_KEY);
      const body = JSON.parse(lastCall().init.body as string);
      expect(body.PublicKey).toBe(PROVISIONING_REQUEST_WITH_KEY.PublicKey);
      expect(body.PresharedKey).toBe(PROVISIONING_REQUEST_WITH_KEY.PresharedKey);
    });

    it("returns created peer", async () => {
      mockOk(PEER);
      const result = await client.provisioning.newPeer(PROVISIONING_REQUEST);
      expect(result.Identifier).toBe(PEER_ID);
      expect(result.InterfaceIdentifier).toBe("wg0");
    });

    it("throws WgPortalError on 400 bad request", async () => {
      mockError({ Code: 400, Message: "Bad Request", Details: "invalid interface" });
      await expect(client.provisioning.newPeer(PROVISIONING_REQUEST)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.provisioning.newPeer(PROVISIONING_REQUEST)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403 when self-provisioning disabled", async () => {
      mockError(API_ERROR_403);
      await expect(client.provisioning.newPeer(PROVISIONING_REQUEST)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404 when interface not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.provisioning.newPeer(PROVISIONING_REQUEST)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(client.provisioning.newPeer(PROVISIONING_REQUEST)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getPeerConfig()", () => {
    it("calls GET /api/v1/provisioning/data/peer-config with PeerId query param", async () => {
      mockOkRaw(Buffer.from(WG_QUICK_CONFIG));
      await client.provisioning.getPeerConfig(PEER_ID);
      const { url } = lastCall();
      expect(url).toContain("/api/v1/provisioning/data/peer-config");
      expect(url).toContain(`PeerId=${PEER_ID_ENCODED}`);
    });

    it("URL-encodes PeerId containing +, /, =", async () => {
      mockOkRaw(Buffer.from(WG_QUICK_CONFIG));
      await client.provisioning.getPeerConfig(PEER_ID);
      const url = new URL(lastCall().url);
      expect(url.searchParams.get("PeerId")).toBe(PEER_ID);
    });

    it("returns config as string", async () => {
      mockOkRaw(Buffer.from(WG_QUICK_CONFIG));
      const result = await client.provisioning.getPeerConfig(PEER_ID);
      expect(typeof result).toBe("string");
    });

    it("returns correct wg-quick config content", async () => {
      mockOkRaw(Buffer.from(WG_QUICK_CONFIG));
      const result = await client.provisioning.getPeerConfig(PEER_ID);
      expect(result).toContain("[Interface]");
      expect(result).toContain("[Peer]");
      expect(result).toContain("PrivateKey");
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.provisioning.getPeerConfig(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.provisioning.getPeerConfig(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404 when peer not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.provisioning.getPeerConfig("unknownpeer")).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getPeerQrCode()", () => {
    it("calls GET /api/v1/provisioning/data/peer-qr with PeerId query param", async () => {
      mockOkRaw(QR_PNG_BUFFER);
      await client.provisioning.getPeerQrCode(PEER_ID);
      const { url } = lastCall();
      expect(url).toContain("/api/v1/provisioning/data/peer-qr");
      expect(url).toContain(`PeerId=${PEER_ID_ENCODED}`);
    });

    it("URL-encodes PeerId", async () => {
      mockOkRaw(QR_PNG_BUFFER);
      await client.provisioning.getPeerQrCode(PEER_ID);
      const url = new URL(lastCall().url);
      expect(url.searchParams.get("PeerId")).toBe(PEER_ID);
    });

    it("returns Buffer", async () => {
      mockOkRaw(QR_PNG_BUFFER);
      const result = await client.provisioning.getPeerQrCode(PEER_ID);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it("PNG magic bytes are preserved in buffer", async () => {
      mockOkRaw(QR_PNG_BUFFER);
      const result = await client.provisioning.getPeerQrCode(PEER_ID);
      expect(result[0]).toBe(137); // PNG magic byte
      expect(result[1]).toBe(80);  // P
      expect(result[2]).toBe(78);  // N
      expect(result[3]).toBe(71);  // G
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(client.provisioning.getPeerQrCode("unknownpeer")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.provisioning.getPeerQrCode(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.provisioning.getPeerQrCode(PEER_ID)).rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("getUserInfo()", () => {
    it("calls GET /api/v1/provisioning/data/user-info with no params for current user", async () => {
      mockOk(USER_INFORMATION);
      await client.provisioning.getUserInfo();
      const url = new URL(lastCall().url);
      expect(url.pathname).toBe("/api/v1/provisioning/data/user-info");
      expect(url.searchParams.has("UserId")).toBe(false);
      expect(url.searchParams.has("Email")).toBe(false);
    });

    it("sends UserId param when userId option is provided", async () => {
      mockOk(USER_INFORMATION);
      await client.provisioning.getUserInfo({ userId: "uid-1234567" });
      const url = new URL(lastCall().url);
      expect(url.searchParams.get("UserId")).toBe("uid-1234567");
    });

    it("sends Email param when email option is provided", async () => {
      mockOk(USER_INFORMATION);
      await client.provisioning.getUserInfo({ email: "test@test.com" });
      const url = new URL(lastCall().url);
      expect(url.searchParams.get("Email")).toBe("test@test.com");
    });

    it("prefers userId over email when both are provided", async () => {
      mockOk(USER_INFORMATION);
      await client.provisioning.getUserInfo({ userId: "uid-1234567", email: "test@test.com" });
      const url = new URL(lastCall().url);
      expect(url.searchParams.get("UserId")).toBe("uid-1234567");
      expect(url.searchParams.has("Email")).toBe(false);
    });

    it("returns UserInformation", async () => {
      mockOk(USER_INFORMATION);
      const result = await client.provisioning.getUserInfo({ userId: "uid-1234567" });
      expect(result.UserIdentifier).toBe("uid-1234567");
      expect(result.PeerCount).toBe(2);
      expect(result.Peers).toHaveLength(2);
    });

    it("returns peer list with correct fields", async () => {
      mockOk(USER_INFORMATION);
      const result = await client.provisioning.getUserInfo({ userId: "uid-1234567" });
      expect(result.Peers[0].InterfaceIdentifier).toBe("wg0");
      expect(result.Peers[0].IpAddresses).toBeDefined();
    });

    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(client.provisioning.getUserInfo()).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404 when user not found", async () => {
      mockError(API_ERROR_404);
      await expect(client.provisioning.getUserInfo({ userId: "nonexistent" })).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(client.provisioning.getUserInfo({ userId: "other-user" })).rejects.toBeInstanceOf(WgPortalError);
    });
  });
});
