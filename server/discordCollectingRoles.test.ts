import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Express, Request, Response as ExpressResponse } from "express";
import {
  createDiscordWelcomeHandler,
  DISCORD_APPLICATION_ID,
  DISCORD_BOT_TEST_CHANNEL_ID,
  DISCORD_GUILD_ID,
  DISCORD_SHOW_ALERTS_ROLE_ID,
  registerDiscordWelcomeRoutes,
  type DiscordFetch,
} from "./discordWelcome";
import { DISCORD_COLLECTING_ROLES, type DiscordCollectingRoleConfig } from "./discordCollectingRoles";

const NOW = 1_800_000_000_000;
const TIMESTAMP = String(Math.floor(NOW / 1000));
const MEMBER_ID = "1561554687440977929";
const TOKEN = "test-interaction-token";
const keyPair = generateKeyPairSync("ed25519");
const publicKeyDer = keyPair.publicKey.export({ format: "der", type: "spki" }) as Buffer;
const rawPublicKey = publicKeyDer.subarray(-32);

type CapturedResponse = { statusCode: number; body: unknown };
type FetchCall = { url: string; init?: RequestInit };

function payload(customId: string) {
  return {
    type: 3,
    application_id: DISCORD_APPLICATION_ID,
    guild_id: DISCORD_GUILD_ID,
    channel_id: DISCORD_BOT_TEST_CHANNEL_ID,
    token: TOKEN,
    data: { component_type: 2, custom_id: customId },
    member: { pending: false, user: { id: MEMBER_ID, bot: false } },
  };
}

function signedRaw(value: unknown) {
  const body = Buffer.from(JSON.stringify(value), "utf8");
  const signature = sign(null, Buffer.concat([Buffer.from(TIMESTAMP, "utf8"), body]), keyPair.privateKey).toString("hex");
  return { body, headers: { "x-signature-ed25519": signature, "x-signature-timestamp": TIMESTAMP } };
}

function invoke(handler: ReturnType<typeof createDiscordWelcomeHandler>, value: unknown): CapturedResponse {
  const signed = signedRaw(value);
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
    { headers: signed.headers, body: signed.body } as unknown as Request,
    response as unknown as ExpressResponse,
    (() => undefined) as never
  );
  return captured;
}

function privateData(response: CapturedResponse) {
  return (response.body as { type: number; data: { flags: number; allowed_mentions: { parse: string[] } } }).data;
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

function handlerWith(fetch: DiscordFetch) {
  return createDiscordWelcomeHandler({
    fetch,
    now: () => NOW,
    key: rawPublicKey,
    getBotToken: () => "test-bot-token",
  });
}

function safeRole(role: DiscordCollectingRoleConfig, overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      id: role.roleId,
      name: role.name,
      managed: false,
      permissions: "0",
      mentionable: false,
      ...overrides,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

function safeChannels(overwrites: unknown[] = []) {
  return new Response(JSON.stringify([{ id: "1561554687440977929", permission_overwrites: overwrites }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function successfulActionResponses(role: DiscordCollectingRoleConfig) {
  return [safeRole(role), safeChannels(), new Response(null, { status: 204 }), new Response(null, { status: 200 })];
}

function completion(calls: FetchCall[]): { content: string; allowed_mentions: { parse: string[] } } {
  return JSON.parse(String(calls.at(-1)?.init?.body)) as { content: string; allowed_mentions: { parse: string[] } };
}

describe("Discord collecting role interactions", () => {
  it.each(
    DISCORD_COLLECTING_ROLES.flatMap(role => [
      [role, role.addCustomId, "PUT", `${role.name} added to your collecting interests.`],
      [role, role.removeCustomId, "DELETE", `${role.name} removed from your collecting interests.`],
    ])
  )("privately acknowledges and completes fixed action %s", async (role, customId, method, expectedCompletion) => {
    const { fetch, calls } = sequenceFetch(...successfulActionResponses(role));
    const response = invoke(handlerWith(fetch), payload(customId));

    expect(response.statusCode).toBe(200);
    expect((response.body as { type: number }).type).toBe(5);
    expect(privateData(response)).toEqual({ flags: 64, allowed_mentions: { parse: [] } });

    await vi.waitFor(() => expect(calls).toHaveLength(4));
    expect(calls[0]).toMatchObject({
      url: `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles/${role.roleId}`,
      init: { method: "GET" },
    });
    expect(calls[1]).toMatchObject({
      url: `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`,
      init: { method: "GET" },
    });
    expect(calls[2]).toMatchObject({
      url: `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${MEMBER_ID}/roles/${role.roleId}`,
      init: { method },
    });
    expect(calls[2].init?.body).toBeUndefined();
    expect(calls.some(call => call.url.includes(DISCORD_SHOW_ALERTS_ROLE_ID))).toBe(false);
    expect(completion(calls)).toEqual({ content: expectedCompletion, allowed_mentions: { parse: [] } });
  });

  it("keeps multiple collecting categories independent and never replaces a member role array", async () => {
    const pokemon = DISCORD_COLLECTING_ROLES[0];
    const sports = DISCORD_COLLECTING_ROLES[1];
    const { fetch, calls } = sequenceFetch(...successfulActionResponses(pokemon), ...successfulActionResponses(sports));
    const handler = handlerWith(fetch);

    const first = invoke(handler, payload(pokemon.addCustomId));
    expect((first.body as { type: number }).type).toBe(5);
    await vi.waitFor(() => expect(calls).toHaveLength(4));

    const second = invoke(handler, payload(sports.addCustomId));
    expect((second.body as { type: number }).type).toBe(5);
    await vi.waitFor(() => expect(calls).toHaveLength(8));
    const writes = calls.filter(call => call.init?.method === "PUT" || call.init?.method === "DELETE");
    expect(writes).toHaveLength(2);
    expect(writes.map(call => call.url)).toEqual([
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${MEMBER_ID}/roles/${pokemon.roleId}`,
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${MEMBER_ID}/roles/${sports.roleId}`,
    ]);
    expect(writes.every(call => call.init?.body === undefined)).toBe(true);
    expect(calls.some(call => call.url.includes(DISCORD_SHOW_ALERTS_ROLE_ID))).toBe(false);
  });

  it.each([
    ["managed", { managed: true }],
    ["permissions", { permissions: "8" }],
    ["name", { name: "Not Pokémon" }],
    ["id", { id: "1561553788656033893" }],
    ["mentionable", { mentionable: true }],
  ])("fails closed for unsafe category role %s", async (_name, unsafeFields) => {
    const role = DISCORD_COLLECTING_ROLES[0];
    const { fetch, calls } = sequenceFetch(safeRole(role, unsafeFields), new Response(null, { status: 200 }));
    const response = invoke(handlerWith(fetch), payload(role.addCustomId));

    expect((response.body as { type: number }).type).toBe(5);
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(calls.some(call => call.init?.method === "PUT" || call.init?.method === "DELETE")).toBe(false);
    expect(completion(calls).content).toContain("role configuration is not safe");
    expect(completion(calls).allowed_mentions).toEqual({ parse: [] });
  });

  it.each([
    ["positive target-role allow", safeChannels([{ id: DISCORD_COLLECTING_ROLES[0].roleId, type: 0, allow: "1024", deny: "0" }])],
    ["non-array channels", new Response(JSON.stringify({ permission_overwrites: [] }), { status: 200, headers: { "content-type": "application/json" } })],
    ["malformed overwrite", safeChannels([{ id: DISCORD_COLLECTING_ROLES[0].roleId, type: 0, allow: 0, deny: "0" }])],
  ])("fails closed before writing for %s", async (_name, channelsResponse) => {
    const role = DISCORD_COLLECTING_ROLES[0];
    const { fetch, calls } = sequenceFetch(safeRole(role), channelsResponse, new Response(null, { status: 200 }));
    invoke(handlerWith(fetch), payload(role.addCustomId));

    await vi.waitFor(() => expect(calls).toHaveLength(3));
    expect(calls.some(call => call.init?.method === "PUT" || call.init?.method === "DELETE")).toBe(false);
    expect(completion(calls).content).toContain("channel permissions are not safe");
  });

  it.each([
    ["unknown button", (value: ReturnType<typeof payload>) => (value.data.custom_id = "ripz_collect_pokemon_add_v2")],
    ["unexpected role target", (value: ReturnType<typeof payload>) => Object.assign(value.data, { role_id: DISCORD_SHOW_ALERTS_ROLE_ID })],
    ["unexpected user target", (value: ReturnType<typeof payload>) => Object.assign(value.data, { user_id: "1561545878160937085" })],
    ["wrong application", (value: ReturnType<typeof payload>) => (value.application_id = "1")],
    ["wrong guild", (value: ReturnType<typeof payload>) => (value.guild_id = "1")],
    ["wrong channel", (value: ReturnType<typeof payload>) => (value.channel_id = "1")],
    ["pending member", (value: ReturnType<typeof payload>) => (value.member.pending = true)],
    ["bot member", (value: ReturnType<typeof payload>) => (value.member.user.bot = true)],
  ])("rejects %s before any Discord API request", (_name, mutate) => {
    const { fetch } = sequenceFetch();
    const value = payload(DISCORD_COLLECTING_ROLES[0].addCustomId);
    mutate(value);
    const response = invoke(handlerWith(fetch), value);

    expect(response.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["add", DISCORD_COLLECTING_ROLES[2].addCustomId, "PUT"],
    ["remove", DISCORD_COLLECTING_ROLES[2].removeCustomId, "DELETE"],
  ])("repeats the same %s request as an idempotent private single-role operation", async (_name, customId, method) => {
    const role = DISCORD_COLLECTING_ROLES[2];
    const { fetch, calls } = sequenceFetch(
      ...successfulActionResponses(role),
      ...successfulActionResponses(role)
    );
    const handler = handlerWith(fetch);
    const first = invoke(handler, payload(customId));

    expect(privateData(first).flags).toBe(64);
    await vi.waitFor(() => expect(calls).toHaveLength(4));

    const second = invoke(handler, payload(customId));
    expect(privateData(second).flags).toBe(64);
    await vi.waitFor(() => expect(calls).toHaveLength(8));
    const writes = calls.filter(call => call.init?.method === "PUT" || call.init?.method === "DELETE");
    expect(writes).toHaveLength(2);
    expect(writes.every(call => call.init?.method === method && call.init?.body === undefined)).toBe(true);
    expect(writes.every(call => call.url.endsWith(`/roles/${role.roleId}`))).toBe(true);
  });

  it("registers a no-store public configuration verification route without authorizing actions", () => {
    let verificationHandler: ((req: Request, res: ExpressResponse) => void) | undefined;
    const app = {
      get: vi.fn((_path: string, handler: (req: Request, res: ExpressResponse) => void) => {
        verificationHandler = handler;
      }),
      post: vi.fn(),
    } as unknown as Express;
    registerDiscordWelcomeRoutes(app);

    expect((app.get as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "/api/discord/collecting-roles",
      expect.any(Function)
    );
    const sent: { cacheControl?: string; body?: unknown } = {};
    const response = {
      set(name: string, value: string) {
        if (name === "Cache-Control") sent.cacheControl = value;
        return this;
      },
      json(body: unknown) {
        sent.body = body;
        return this;
      },
    };
    verificationHandler?.({} as Request, response as unknown as ExpressResponse);

    expect(sent).toEqual({
      cacheControl: "no-store",
      body: { version: "collecting-roles-v1", categories: DISCORD_COLLECTING_ROLES },
    });
  });
});
