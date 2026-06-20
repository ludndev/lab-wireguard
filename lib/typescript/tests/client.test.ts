import { HttpClient, WgPortalError } from "../src/client";
import { mockOk, mockError, mockNoContent, mockOkRaw, lastCall } from "./helpers/fetch-mock";
import { API_ERROR_401, API_ERROR_403, API_ERROR_404, API_ERROR_500 } from "./fixtures";

const BASE_URL = "http://wg-portal.test:8888";
const USERNAME = "admin@wgportal.local";
const API_TOKEN = "test-api-token";

function makeClient(baseUrl = BASE_URL) {
  return new HttpClient({ baseUrl, username: USERNAME, apiToken: API_TOKEN });
}

const EXPECTED_AUTH = "Basic " + Buffer.from(`${USERNAME}:${API_TOKEN}`).toString("base64");

describe("HttpClient", () => {
  afterEach(() => jest.resetAllMocks());

  describe("authentication", () => {
    it("sets correct Basic Auth header on GET", async () => {
      mockOk({});
      await makeClient().get("/interface/all");
      expect(lastCall().init.headers).toMatchObject({ Authorization: EXPECTED_AUTH });
    });

    it("sets correct Basic Auth header on POST", async () => {
      mockOk({});
      await makeClient().post("/interface/new", {});
      expect(lastCall().init.headers).toMatchObject({ Authorization: EXPECTED_AUTH });
    });

    it("sets correct Basic Auth header on PUT", async () => {
      mockOk({});
      await makeClient().put("/interface/by-id/wg0", {});
      expect(lastCall().init.headers).toMatchObject({ Authorization: EXPECTED_AUTH });
    });

    it("sets correct Basic Auth header on DELETE", async () => {
      mockNoContent();
      await makeClient().delete("/interface/by-id/wg0");
      expect(lastCall().init.headers).toMatchObject({ Authorization: EXPECTED_AUTH });
    });

    it("encodes username and token as base64", () => {
      const client = new HttpClient({ baseUrl: BASE_URL, username: "user@test.com", apiToken: "tok3n!" });
      // trigger a request to inspect header
      mockOk({});
      void client.get("/test");
      const expected = "Basic " + Buffer.from("user@test.com:tok3n!").toString("base64");
      expect(lastCall().init.headers).toMatchObject({ Authorization: expected });
    });
  });

  describe("URL construction", () => {
    it("appends /api/v1 prefix to every path", async () => {
      mockOk({});
      await makeClient().get("/interface/all");
      expect(lastCall().url).toBe(`${BASE_URL}/api/v1/interface/all`);
    });

    it("strips trailing slash from base URL", async () => {
      mockOk({});
      await makeClient(`${BASE_URL}/`).get("/interface/all");
      expect(lastCall().url).toBe(`${BASE_URL}/api/v1/interface/all`);
    });

    it("appends query params to GET requests", async () => {
      mockOk({});
      await makeClient().get("/provisioning/data/peer-config", { PeerId: "abc123" });
      expect(lastCall().url).toContain("PeerId=abc123");
    });

    it("URL-encodes query param values with special characters", async () => {
      mockOk({});
      await makeClient().get("/provisioning/data/peer-config", { PeerId: "key+with/special=chars" });
      expect(lastCall().url).toContain("PeerId=key%2Bwith%2Fspecial%3Dchars");
    });

    it("supports multiple query params", async () => {
      mockOk({});
      await makeClient().get("/test", { foo: "bar", baz: "qux" });
      const url = new URL(lastCall().url);
      expect(url.searchParams.get("foo")).toBe("bar");
      expect(url.searchParams.get("baz")).toBe("qux");
    });
  });

  describe("HTTP methods", () => {
    it("GET does not send a body", async () => {
      mockOk({});
      await makeClient().get("/interface/all");
      expect(lastCall().init.body).toBeUndefined();
    });

    it("POST sends method POST", async () => {
      mockOk({});
      await makeClient().post("/interface/new", { foo: "bar" });
      expect(lastCall().init.method).toBe("POST");
    });

    it("POST sends JSON body", async () => {
      mockOk({});
      const payload = { Identifier: "wg0", Mode: "server" };
      await makeClient().post("/interface/new", payload);
      expect(lastCall().init.body).toBe(JSON.stringify(payload));
    });

    it("POST sets Content-Type: application/json", async () => {
      mockOk({});
      await makeClient().post("/interface/new", {});
      expect(lastCall().init.headers).toMatchObject({ "Content-Type": "application/json" });
    });

    it("PUT sends method PUT", async () => {
      mockOk({});
      await makeClient().put("/interface/by-id/wg0", {});
      expect(lastCall().init.method).toBe("PUT");
    });

    it("PUT sends JSON body", async () => {
      mockOk({});
      const payload = { Identifier: "wg0", Mode: "server" };
      await makeClient().put("/interface/by-id/wg0", payload);
      expect(lastCall().init.body).toBe(JSON.stringify(payload));
    });

    it("DELETE sends method DELETE", async () => {
      mockNoContent();
      await makeClient().delete("/interface/by-id/wg0");
      expect(lastCall().init.method).toBe("DELETE");
    });

    it("DELETE resolves on 204 No Content", async () => {
      mockNoContent();
      await expect(makeClient().delete("/interface/by-id/wg0")).resolves.toBeUndefined();
    });
  });

  describe("getRaw", () => {
    it("returns Buffer on success", async () => {
      const rawData = Buffer.from("raw binary data");
      mockOkRaw(rawData);
      const result = await makeClient().getRaw("/provisioning/data/peer-qr", { PeerId: "abc" });
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it("throws WgPortalError on failure", async () => {
      mockError(API_ERROR_404);
      await expect(makeClient().getRaw("/provisioning/data/peer-qr", { PeerId: "abc" }))
        .rejects.toBeInstanceOf(WgPortalError);
    });
  });

  describe("error handling", () => {
    it("throws WgPortalError on 401", async () => {
      mockError(API_ERROR_401);
      await expect(makeClient().get("/interface/all")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 403", async () => {
      mockError(API_ERROR_403);
      await expect(makeClient().get("/interface/all")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 404", async () => {
      mockError(API_ERROR_404);
      await expect(makeClient().get("/interface/all")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("throws WgPortalError on 500", async () => {
      mockError(API_ERROR_500);
      await expect(makeClient().get("/interface/all")).rejects.toBeInstanceOf(WgPortalError);
    });

    it("WgPortalError has correct code", async () => {
      mockError(API_ERROR_401);
      await expect(makeClient().get("/interface/all")).rejects.toMatchObject({ code: 401 });
    });

    it("WgPortalError has correct message", async () => {
      mockError(API_ERROR_404);
      await expect(makeClient().get("/interface/all")).rejects.toMatchObject({ message: "Not Found" });
    });

    it("WgPortalError has correct details", async () => {
      mockError(API_ERROR_500);
      await expect(makeClient().get("/interface/all")).rejects.toMatchObject({ details: "unexpected error occurred" });
    });

    it("WgPortalError name is WgPortalError", async () => {
      mockError(API_ERROR_401);
      await expect(makeClient().get("/interface/all")).rejects.toMatchObject({ name: "WgPortalError" });
    });

    it("WgPortalError is an instance of Error", async () => {
      mockError(API_ERROR_401);
      const err = await makeClient().get("/interface/all").catch((e) => e);
      expect(err).toBeInstanceOf(Error);
    });
  });
});
