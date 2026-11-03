import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Request, Response as ExpressResponse } from "express";
import {
  createDiscordWelcomeHandler,
  DISCORD_APPLICATION_ID,
  DISCORD_BOT_TEST_CHANNEL_ID,
  DISCORD_WELCOME_CHANNEL_ID,
  DISCORD_GUILD_ID,
  DISCORD_SHOW_ALERTS_ROLE_ID,
  type DiscordFetch,
} from "./discordWelcome";
import { APPROVED_RULES_CONTENT } from "./discordWelcomeCopy";

const NOW = 1_800_000_000_000;
const TIMESTAMP = String(Math.floor(NOW / 1000));
const keyPair = generateKeyPairSync("ed25519");
const publicKeyDer = keyPair.publicKey.export({ format: "der", type: "spki" }) as Buffer;
const rawPublicKey = publicKeyDer.subarray(-32);

type TestPayload = {
  type: number;
  application_id: string;
  guild_id: string;
  channel_id: string;
  token: string;
  data: { component_type: number; custom_id: string };
  member: { pending: boolean; user: { id: string; bot: boolean } };
};

type CapturedResponse = { statusCode: number; body: unknown };
type FetchCall = { url: string; init?: RequestInit };

function memberPayload(customId: string): TestPayload {
  return {
    type: 3,
    application_id: DISCORD_APPLICATION_ID,
    guild_id: DISCORD_GUILD_ID,
    channel_id: DISCORD_BOT_TEST_CHANNEL_ID,
    token: "test-interaction-token",
    data: { component_type: 2, custom_id: customId },
    member: { pending: false, user: { id: "1561554687440977929", bot: false } },
  };
}

function signedRaw(raw: string, timestamp = TIMESTAMP) {
  const body = Buffer.from(raw, "utf8");
  const signature = sign(null, Buffer.concat([Buffer.from(timestamp, "utf8"), body]), keyPair.privateKey).toString("hex");
  return {
    body,
    headers: {
      "x-signature-ed25519": signature,
      "x-signature-timestamp": timestamp,
    },
  };
}

function invoke(handler: ReturnType<typeof createDiscordWelcomeHandler>, raw: string, timestamp = TIMESTAMP): CapturedResponse {
  const request = signedRaw(raw, timestamp);
  const captured: CapturedResponse = { statusCode: 0, body: undefined };
  const response = {
    status(statusCode: number) {
      captured.statusCode = statusCode;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
  };

  handler(
    { headers: request.headers, body: request.body } as unknown as Request,
    response as unknown as ExpressResponse,
    (() => undefined) as never
  );
  return captured;
}

function invokePayload(
  handler: ReturnType<typeof createDiscordWelcomeHandler>,
  payload: unknown,
  timestamp = TIMESTAMP
): CapturedResponse {
  return invoke(handler, JSON.stringify(payload), timestamp);
}

function safeRoleResponse() {
  return new Response(
    JSON.stringify({ id: DISCORD_SHOW_ALERTS_ROLE_ID, managed: false, permissions: "0" }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

function sequenceFetch(...responses: Response[]): { fetch: DiscordFetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fetch = vi.fn(async (input: Parameters<DiscordFetch>[0], init?: Parameters<DiscordFetch>[1]) => {
    calls.push({ url: String(input), init });
    const response = responses.shift();
    if (!response) throw new Error("Unexpected mocked Discord request");
    return response;
  }) as unknown as DiscordFetch;
  return { fetch, calls };
}

function handlerWith(fetch: DiscordFetch, extra = {}) {
  return createDiscordWelcomeHandler({
    fetch,
    now: () => NOW,
    key: rawPublicKey,
    getBotToken: () => "test-bot-token",
    ...extra,
  });
}

function privateData(response: CapturedResponse) {
  return (response.body as { data: { flags: number; allowed_mentions: { parse: string[] }; content?: string } }).data;
}

describe("Discord welcome interaction handler", () => {
  it("accepts a valid signed PING", () => {
    const { fetch } = sequenceFetch();
    const response = invokePayload(handlerWith(fetch), { type: 1 });

    expect(response).toEqual({ statusCode: 200, body: { type: 1 } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a signature whose body was tampered with", () => {
    const { fetch } = sequenceFetch();
    const handler = handlerWith(fetch);
    const signed = signedRaw(JSON.stringify({ type: 1 }));
    const captured: CapturedResponse = { statusCode: 0, body: undefined };
    const response = {
      status(statusCode: number) {
        captured.statusCode = statusCode;
        return this;
      },
      json(body: unknown) {
        captured.body = body;
        return this;
      },
    };

    handler(
      { headers: signed.headers, body: Buffer.from(JSON.stringify({ type: 1, altered: true })) } as unknown as Request,
      response as unknown as ExpressResponse,
      (() => undefined) as never
    );

    expect(captured.statusCode).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects stale and unreasonably future signed timestamps", () => {
    const { fetch } = sequenceFetch();
    const handler = handlerWith(fetch);

    expect(invokePayload(handler, { type: 1 }, String(Math.floor((NOW - 300_001) / 1000))).statusCode).toBe(401);
    expect(invokePayload(handler, { type: 1 }, String(Math.floor((NOW + 31_000) / 1000))).statusCode).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects signed malformed JSON", () => {
    const { fetch } = sequenceFetch();
    const response = invoke(handlerWith(fetch), "{not-json");

    expect(response.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["wrong application", (payload: TestPayload) => (payload.application_id = "1")],
    ["wrong guild", (payload: TestPayload) => (payload.guild_id = "1")],
    ["wrong channel", (payload: TestPayload) => (payload.channel_id = "1")],
    ["bot user", (payload: TestPayload) => (payload.member.user.bot = true)],
    ["pending member", (payload: TestPayload) => (payload.member.pending = true)],
  ])("rejects a signed %s interaction without writing roles", (_name, mutate) => {
    const { fetch } = sequenceFetch();
    const payload = memberPayload("ripz_alerts_on_v1");
    mutate(payload);

    const response = invokePayload(handlerWith(fetch), payload);
    expect(response.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts optional human flags omitted and a generated component ID", () => {
    const { fetch } = sequenceFetch();
    const original = memberPayload("ripz_welcome_rules_v1");
    const payload = {
      ...original,
      data: { ...original.data, id: 2 },
      member: { user: { id: original.member.user.id } },
    };
    const response = invokePayload(handlerWith(fetch), payload);
    expect(response.statusCode).toBe(200);
    expect((response.body as { type: number }).type).toBe(4);
    expect(privateData(response).flags).toBe(64);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed optional membership flags", () => {
    const { fetch } = sequenceFetch();
    const original = memberPayload("ripz_alerts_on_v1");
    for (const member of [
      { user: { id: original.member.user.id, bot: "false" } },
      { user: { id: original.member.user.id }, pending: "false" },
    ]) {
      const response = invokePayload(handlerWith(fetch), { ...original, member });
      expect(response.statusCode).toBe(400);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects role target data instead of accepting a requested target", () => {
    const { fetch } = sequenceFetch();
    const payload = memberPayload("ripz_alerts_on_v1");
    const response = invokePayload(handlerWith(fetch), {
      ...payload,
      data: { ...payload.data, role_id: "1561545878160937085" },
    });

    expect(response.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["ripz_welcome_rules_v1", "Keep private details private."],
    ["ripz_welcome_help_v1", "help and feedback"],
  ])("returns private, mention-suppressed %s text immediately", (customId, expectedText) => {
    const { fetch } = sequenceFetch();
    const response = invokePayload(handlerWith(fetch), memberPayload(customId));
    const data = privateData(response);

    expect(response.statusCode).toBe(200);
    expect((response.body as { type: number }).type).toBe(4);
    expect(data.flags).toBe(64);
    expect(data.allowed_mentions).toEqual({ parse: [] });
    expect(data.content).toContain(expectedText);
    expect(data.content?.toLowerCase()).not.toMatch(/raffle|lottery|gamble|gambling|spin to win|odds|chance|prize|draw|jackpot|bet/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["ripz_alerts_on_v1", "PUT", "Show Alerts are now on."],
    ["ripz_alerts_off_v1", "DELETE", "Show Alerts are now off."],
  ])("defers %s then changes only the signed member's fixed role", async (customId, method, completion) => {
    const { fetch, calls } = sequenceFetch(safeRoleResponse(), new Response(null, { status: 204 }), new Response(null, { status: 200 }));
    const response = invokePayload(handlerWith(fetch), memberPayload(customId));

    expect(response.statusCode).toBe(200);
    expect((response.body as { type: number }).type).toBe(5);
    expect(privateData(response).flags).toBe(64);
    expect(privateData(response).allowed_mentions).toEqual({ parse: [] });

    await vi.waitFor(() => expect(calls).toHaveLength(3));
    expect(calls[0]).toMatchObject({
      url: `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles/${DISCORD_SHOW_ALERTS_ROLE_ID}`,
      init: { method: "GET" },
    });
    expect(calls[1]).toMatchObject({
      url: `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/1561554687440977929/roles/${DISCORD_SHOW_ALERTS_ROLE_ID}`,
      init: { method },
    });
    expect(calls[2]).toMatchObject({
      url: `https://discord.com/api/v10/webhooks/${DISCORD_APPLICATION_ID}/test-interaction-token/messages/@original`,
      init: { method: "PATCH" },
    });
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({ content: completion, allowed_mentions: { parse: [] } });
  });

  it("allows a slow Discord lookup after acknowledging privately immediately", async () => {
    vi.useFakeTimers();
    try {
      const calls: FetchCall[] = [];
      const fetch = vi.fn(async (input: Parameters<DiscordFetch>[0], init?: RequestInit) => {
        calls.push({ url: String(input), init });
        if (calls.length === 1) {
          return await new Promise<Response>((resolve, reject) => {
            const timer = setTimeout(() => resolve(safeRoleResponse()), 3500);
            init?.signal?.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(new DOMException("Request aborted", "AbortError"));
            }, { once: true });
          });
        }
        return new Response(null, { status: init?.method === "PUT" ? 204 : 200 });
      }) as unknown as DiscordFetch;
      const response = invokePayload(handlerWith(fetch), memberPayload("ripz_alerts_on_v1"));
      expect((response.body as { type: number }).type).toBe(5);
      expect(privateData(response).flags).toBe(64);
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(2500);
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(calls).toHaveLength(3);
      expect(calls[1].init?.method).toBe("PUT");
      expect(JSON.parse(String(calls[2].init?.body))).toEqual({
        content: "Show Alerts are now on.", allowed_mentions: { parse: [] },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    [{ id: DISCORD_SHOW_ALERTS_ROLE_ID, managed: true, permissions: "0" }],
    [{ id: DISCORD_SHOW_ALERTS_ROLE_ID, managed: false, permissions: "8" }],
  ])("rejects unsafe role configuration before any role write", async unsafeRole => {
    const { fetch, calls } = sequenceFetch(
      new Response(JSON.stringify(unsafeRole), { status: 200, headers: { "content-type": "application/json" } }),
      new Response(null, { status: 200 })
    );
    const response = invokePayload(handlerWith(fetch), memberPayload("ripz_alerts_on_v1"));

    expect((response.body as { type: number }).type).toBe(5);
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(calls.some(call => call.init?.method === "PUT" || call.init?.method === "DELETE")).toBe(false);
    const completion = JSON.parse(String(calls[1].init?.body)) as { content: string; allowed_mentions: { parse: string[] } };
    expect(completion.content).toContain("could not be updated");
    expect(completion.content).not.toContain("now on");
    expect(completion.allowed_mentions).toEqual({ parse: [] });
  });

  it("reports a Discord permission failure privately and honestly", async () => {
    const { fetch, calls } = sequenceFetch(
      safeRoleResponse(),
      new Response(null, { status: 403 }),
      new Response(null, { status: 200 })
    );
    invokePayload(handlerWith(fetch), memberPayload("ripz_alerts_on_v1"));

    await vi.waitFor(() => expect(calls).toHaveLength(3));
    const completion = JSON.parse(String(calls[2].init?.body)) as { content: string; allowed_mentions: { parse: string[] } };
    expect(completion.content).toContain("does not have permission");
    expect(completion.content).not.toContain("now on");
    expect(completion.allowed_mentions).toEqual({ parse: [] });
  });

  it.each([
    "ripz_welcome_rules_v1",
    "ripz_welcome_help_v1",
    "ripz_alerts_on_v1",
    "ripz_alerts_off_v1",
  ])("accepts %s in the approved public welcome channel with a private reply", async customId => {
    const changesRole = customId === "ripz_alerts_on_v1" || customId === "ripz_alerts_off_v1";
    const { fetch, calls } = changesRole
      ? sequenceFetch(safeRoleResponse(), new Response(null, { status: 204 }), new Response(null, { status: 200 }))
      : sequenceFetch();
    const payload = memberPayload(customId);
    payload.channel_id = DISCORD_WELCOME_CHANNEL_ID;
    const response = invokePayload(handlerWith(fetch), payload);
    expect(response.statusCode).toBe(200);
    expect(privateData(response).flags).toBe(64);
    expect(privateData(response).allowed_mentions).toEqual({ parse: [] });
    if (changesRole) {
      expect((response.body as { type: number }).type).toBe(5);
      await vi.waitFor(() => expect(calls).toHaveLength(3));
      expect(calls[1].init?.method).toBe(customId === "ripz_alerts_on_v1" ? "PUT" : "DELETE");
      expect(calls[1].url).toContain(`/members/${payload.member.user.id}/roles/${DISCORD_SHOW_ALERTS_ROLE_ID}`);
    } else {
      expect((response.body as { type: number }).type).toBe(4);
      expect(fetch).not.toHaveBeenCalled();
      if (customId === "ripz_welcome_rules_v1") expect(privateData(response).content).toBe(APPROVED_RULES_CONTENT);
    }
  });

  it("still rejects role controls in the show-times channel", () => {
    const { fetch } = sequenceFetch();
    const payload = memberPayload("ripz_alerts_on_v1");
    payload.channel_id = "1561540237380034641";
    expect(invokePayload(handlerWith(fetch), payload).statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries a Discord 429 once with its bounded retry delay", async () => {
    const sleep = vi.fn(async () => undefined);
    const { fetch, calls } = sequenceFetch(
      new Response(JSON.stringify({ retry_after: 0.25 }), { status: 429, headers: { "content-type": "application/json" } }),
      safeRoleResponse(),
      new Response(null, { status: 204 }),
      new Response(null, { status: 200 })
    );
    invokePayload(
      handlerWith(fetch, {
        config: { sleep },
      }),
      memberPayload("ripz_alerts_on_v1")
    );

    await vi.waitFor(() => expect(calls).toHaveLength(4));
    expect(sleep).toHaveBeenCalledWith(250);
    expect(calls[2].init?.method).toBe("PUT");
    const completion = JSON.parse(String(calls[3].init?.body)) as { allowed_mentions: { parse: string[] } };
    expect(completion.allowed_mentions).toEqual({ parse: [] });
  });

  it("does not retry before a longer Discord rate-limit delay expires", async () => {
    const sleep = vi.fn(async () => undefined);
    const { fetch, calls } = sequenceFetch(
      new Response(JSON.stringify({ retry_after: 5 }), { status: 429, headers: { "content-type": "application/json" } }),
      new Response(null, { status: 200 })
    );
    invokePayload(handlerWith(fetch, { config: { sleep } }), memberPayload("ripz_alerts_on_v1"));
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(sleep).not.toHaveBeenCalled();
    expect(calls[1].init?.method).toBe("PATCH");
    expect(JSON.parse(String(calls[1].init?.body)).content).toContain("could not be updated");
    expect(calls.some(call => call.init?.method === "PUT" || call.init?.method === "DELETE")).toBe(false);
  });
});
