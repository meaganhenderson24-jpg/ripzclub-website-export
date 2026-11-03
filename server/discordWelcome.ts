import { createPublicKey, verify, type KeyObject } from "node:crypto";
import express, { type Express, type Request, type RequestHandler } from "express";
import {
  DISCORD_COLLECTING_ROLES,
  getDiscordCollectingRoleAction,
  type DiscordCollectingRoleAction,
  type DiscordCollectingRoleConfig,
} from "./discordCollectingRoles";
import { APPROVED_RULES_CONTENT } from "./discordWelcomeCopy";

export const DISCORD_APPLICATION_ID = "1561541874014224424";
export const DISCORD_GUILD_ID = "1559813248943923200";
export const DISCORD_BOT_TEST_CHANNEL_ID = "1561554687440977929";
export const DISCORD_WELCOME_CHANNEL_ID = "1561562395674021989";
export const DISCORD_SHOW_ALERTS_ROLE_ID = "1561553788656033893";
export const DISCORD_BOT_ROLE_ID = "1561545878160937085";
export const DISCORD_MODERATOR_ROLE_ID = "1561562211439214675";
export const DISCORD_HELP_AND_FEEDBACK_CHANNEL_ID = "1561563440496246827";
export const DISCORD_INTERACTIONS_PATH = "/api/discord/interactions";

const DISCORD_PUBLIC_KEY_HEX = "643271cfac3ba8a48a81f1f9a154146edc5b3f814ba2e9dcebb342d98be57fe1";
const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const PRIVATE_EPHEMERAL_FLAG = 64;
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;
const DEFAULT_FUTURE_TIMESTAMP_TOLERANCE_MS = 30 * 1000;
// Role requests run only after the private acknowledgement; they are not subject
// to Discord's three-second initial-response deadline.
const DEFAULT_DISCORD_REQUEST_TIMEOUT_MS = 10 * 1000;
const MAX_DISCORD_REQUEST_TIMEOUT_MS = 15 * 1000;
const MAX_RETRY_AFTER_MS = 1000;
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

const RULES_RESPONSE = APPROVED_RULES_CONTENT;

const HELP_RESPONSE = `For help and feedback, please use <#${DISCORD_HELP_AND_FEEDBACK_CHANNEL_ID}>.`;

export type DiscordFetch = typeof globalThis.fetch;

export interface DiscordWelcomeHandlerConfig {
  /** Values are capped so a caller cannot weaken the production freshness or timeout bounds. */
  maxTimestampAgeMs?: number;
  futureTimestampToleranceMs?: number;
  requestTimeoutMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface DiscordWelcomeHandlerOptions {
  fetch?: DiscordFetch;
  now?: () => number;
  /** A raw 32-byte Ed25519 key, hexadecimal key, or Node public key for isolated tests. */
  key?: Uint8Array | string | KeyObject;
  config?: DiscordWelcomeHandlerConfig;
  /** Test-only injection. The application route reads the token from DISCORD_BOT_TOKEN. */
  getBotToken?: () => string | undefined;
}

interface HandlerDependencies {
  fetch: DiscordFetch;
  now: () => number;
  verificationKey: KeyObject;
  maxTimestampAgeMs: number;
  futureTimestampToleranceMs: number;
  requestTimeoutMs: number;
  sleep: (milliseconds: number) => Promise<void>;
  getBotToken: () => string | undefined;
}

interface ValidMemberInteractionDetails {
  memberId: string;
  token: string;
}

type WelcomeAction = "rules" | "alerts-on" | "alerts-off" | "help";

type ValidMemberInteraction =
  | (ValidMemberInteractionDetails & { action: WelcomeAction })
  | (ValidMemberInteractionDetails & { action: DiscordCollectingRoleAction });

type DiscordRole = {
  id?: unknown;
  name?: unknown;
  managed?: unknown;
  permissions?: unknown;
  mentionable?: unknown;
};

const PROTECTED_ROLE_IDS = new Set<string>([
  DISCORD_SHOW_ALERTS_ROLE_ID,
  DISCORD_BOT_ROLE_ID,
  DISCORD_MODERATOR_ROLE_ID,
]);

function clamp(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function createDependencies(options: DiscordWelcomeHandlerOptions): HandlerDependencies {
  const config = options.config ?? {};
  return {
    fetch: options.fetch ?? globalThis.fetch,
    now: options.now ?? Date.now,
    verificationKey: createVerificationKey(options.key ?? DISCORD_PUBLIC_KEY_HEX),
    maxTimestampAgeMs: clamp(config.maxTimestampAgeMs, MAX_TIMESTAMP_AGE_MS, 1, MAX_TIMESTAMP_AGE_MS),
    futureTimestampToleranceMs: clamp(
      config.futureTimestampToleranceMs,
      DEFAULT_FUTURE_TIMESTAMP_TOLERANCE_MS,
      0,
      60 * 1000
    ),
    requestTimeoutMs: clamp(
      config.requestTimeoutMs,
      DEFAULT_DISCORD_REQUEST_TIMEOUT_MS,
      100,
      MAX_DISCORD_REQUEST_TIMEOUT_MS
    ),
    sleep: config.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))),
    getBotToken: options.getBotToken ?? (() => process.env.DISCORD_BOT_TOKEN),
  };
}

function createVerificationKey(key: Uint8Array | string | KeyObject): KeyObject {
  if (isKeyObject(key)) return key;

  const bytes =
    typeof key === "string"
      ? /^[0-9a-fA-F]{64}$/.test(key)
        ? Buffer.from(key, "hex")
        : undefined
      : Buffer.from(key);

  if (!bytes || bytes.length !== 32) {
    throw new Error("Discord verification key must be exactly 32 bytes");
  }

  return createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, bytes]),
    format: "der",
    type: "spki",
  });
}

function isKeyObject(value: Uint8Array | string | KeyObject): value is KeyObject {
  return typeof value === "object" && value !== null && "type" in value && "export" in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDiscordSnowflake(value: unknown): value is string {
  return typeof value === "string" && /^[1-9][0-9]{0,19}$/.test(value);
}

function privateMessage(content: string) {
  return {
    type: 4,
    data: {
      content,
      flags: PRIVATE_EPHEMERAL_FLAG,
      allowed_mentions: { parse: [] as string[] },
    },
  };
}

function privateDeferredMessage() {
  return {
    type: 5,
    data: {
      flags: PRIVATE_EPHEMERAL_FLAG,
      allowed_mentions: { parse: [] as string[] },
    },
  };
}

function getSingleHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === "string" ? value : undefined;
}

function hasValidTimestamp(timestamp: string, dependencies: HandlerDependencies): boolean {
  if (!/^[0-9]{1,16}$/.test(timestamp)) return false;

  try {
    const timestampMs = BigInt(timestamp) * 1000n;
    const nowMs = BigInt(Math.floor(dependencies.now()));
    const elapsedMs = nowMs - timestampMs;
    return elapsedMs <= BigInt(dependencies.maxTimestampAgeMs) && elapsedMs >= -BigInt(dependencies.futureTimestampToleranceMs);
  } catch {
    return false;
  }
}

function hasValidSignature(req: Request, dependencies: HandlerDependencies): boolean {
  const signatureHex = getSingleHeader(req, "x-signature-ed25519");
  const timestamp = getSingleHeader(req, "x-signature-timestamp");
  const rawBody = req.body;

  if (
    !signatureHex ||
    !timestamp ||
    !Buffer.isBuffer(rawBody) ||
    !/^[0-9a-fA-F]{128}$/.test(signatureHex) ||
    !hasValidTimestamp(timestamp, dependencies)
  ) {
    return false;
  }

  const signature = Buffer.from(signatureHex, "hex");
  if (signature.length !== 64) return false;

  try {
    return verify(
      null,
      Buffer.concat([Buffer.from(timestamp, "utf8"), rawBody]),
      dependencies.verificationKey,
      signature
    );
  } catch {
    return false;
  }
}

function getAction(customId: unknown): WelcomeAction | undefined {
  switch (customId) {
    case "ripz_welcome_rules_v1":
      return "rules";
    case "ripz_alerts_on_v1":
      return "alerts-on";
    case "ripz_alerts_off_v1":
      return "alerts-off";
    case "ripz_welcome_help_v1":
      return "help";
    default:
      return undefined;
  }
}

function parseMemberInteraction(payload: unknown): ValidMemberInteraction | undefined {
  if (!isRecord(payload) || payload.type !== 3) return undefined;
  if (
    payload.application_id !== DISCORD_APPLICATION_ID ||
    payload.guild_id !== DISCORD_GUILD_ID ||
    (payload.channel_id !== DISCORD_BOT_TEST_CHANNEL_ID && payload.channel_id !== DISCORD_WELCOME_CHANNEL_ID) ||
    typeof payload.token !== "string" ||
    payload.token.trim().length === 0
  ) {
    return undefined;
  }

  if (!isRecord(payload.data)) return undefined;
  const dataKeys = Object.keys(payload.data);
  if (!dataKeys.every(key => key === "custom_id" || key === "component_type" || key === "id")) return undefined;
  if (payload.data.component_type !== undefined && payload.data.component_type !== 2) return undefined;
  if (payload.data.id !== undefined && (typeof payload.data.id !== "number" || !Number.isInteger(payload.data.id) || payload.data.id < 0)) return undefined;

  const action = getAction(payload.data.custom_id) ?? getDiscordCollectingRoleAction(payload.data.custom_id);
  if (!action || !isRecord(payload.member) || !isRecord(payload.member.user)) return undefined;
  // Discord omits these optional flags for ordinary human/non-pending interactions.
  // Explicit true or malformed supplied values remain invalid.
  if (
    !isDiscordSnowflake(payload.member.user.id) ||
    (payload.member.user.bot !== undefined && payload.member.user.bot !== false) ||
    (payload.member.pending !== undefined && payload.member.pending !== false)
  ) {
    return undefined;
  }

  return { action, memberId: payload.member.user.id, token: payload.token };
}

function isSafeShowAlertsRole(role: unknown): role is DiscordRole {
  if (!isRecord(role)) return false;
  if (role.id !== DISCORD_SHOW_ALERTS_ROLE_ID) return false;
  const showAlertsForbiddenRoleIds: ReadonlySet<string> = new Set([
    DISCORD_BOT_ROLE_ID,
    DISCORD_MODERATOR_ROLE_ID,
  ]);
  if (showAlertsForbiddenRoleIds.has(String(role.id))) return false;
  return role.managed === false && (role.permissions === "0" || role.permissions === 0);
}

function isSafeCollectingRole(role: unknown, selectedRole: DiscordCollectingRoleConfig): role is DiscordRole {
  if (!isRecord(role)) return false;
  if (role.id !== selectedRole.roleId || PROTECTED_ROLE_IDS.has(String(role.id))) return false;
  return (
    role.name === selectedRole.name &&
    role.managed === false &&
    (role.permissions === "0" || role.permissions === 0) &&
    role.mentionable === false
  );
}

function isPermissionBitString(value: unknown): value is string {
  return typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value);
}

/**
 * Server-level zero permissions do not prove a role cannot grant a channel permission.
 * Require a well-formed overwrite list for every channel and reject any positive allow
 * mask for the fixed selected role.
 */
function hasSafeCollectingChannelOverwrites(channels: unknown, selectedRoleId: string): boolean {
  if (!Array.isArray(channels)) return false;

  return channels.every(channel => {
    if (!isRecord(channel) || !Array.isArray(channel.permission_overwrites)) return false;

    return channel.permission_overwrites.every(overwrite => {
      if (!isRecord(overwrite)) return false;
      if (!isDiscordSnowflake(overwrite.id) || (overwrite.type !== 0 && overwrite.type !== 1)) return false;
      if (!isPermissionBitString(overwrite.allow) || !isPermissionBitString(overwrite.deny)) return false;
      return overwrite.id !== selectedRoleId || overwrite.allow === "0";
    });
  });
}

async function retryAfterMilliseconds(response: Response): Promise<number | undefined> {
  const retryAfterHeader = response.headers.get("retry-after");
  const headerSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;
  if (Number.isFinite(headerSeconds) && headerSeconds >= 0) {
    const milliseconds = Math.ceil(headerSeconds * 1000);
    return milliseconds <= MAX_RETRY_AFTER_MS ? milliseconds : undefined;
  }

  try {
    const body = (await response.clone().json()) as { retry_after?: unknown };
    if (typeof body.retry_after === "number" && Number.isFinite(body.retry_after) && body.retry_after >= 0) {
      const milliseconds = Math.ceil(body.retry_after * 1000);
      return milliseconds <= MAX_RETRY_AFTER_MS ? milliseconds : undefined;
    }
  } catch {
    // Without a reliable retry delay, fail safely rather than retrying prematurely.
  }

  return undefined;
}

async function discordRequest(
  dependencies: HandlerDependencies,
  url: string,
  init: RequestInit
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), dependencies.requestTimeoutMs);

    let response: Response;
    try {
      response = await dependencies.fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status !== 429 || attempt === 1) return response;
    const waitMilliseconds = await retryAfterMilliseconds(response);
    if (waitMilliseconds === undefined) return response;
    await dependencies.sleep(waitMilliseconds);
  }

  throw new Error("Discord request retry limit reached");
}

function interactionResponseUrl(token: string): string {
  return `${DISCORD_API_BASE_URL}/webhooks/${DISCORD_APPLICATION_ID}/${encodeURIComponent(token)}/messages/@original`;
}

async function updateOriginalResponse(
  dependencies: HandlerDependencies,
  interactionToken: string,
  content: string
): Promise<void> {
  try {
    await discordRequest(dependencies, interactionResponseUrl(interactionToken), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    });
  } catch {
    // The initial acknowledgement is already private. Do not log interaction tokens or API errors.
  }
}

async function mutateSingleMemberRole(
  dependencies: HandlerDependencies,
  authorization: string,
  memberId: string,
  roleId: string,
  operation: "add" | "remove"
): Promise<Response> {
  const membershipUrl = `${DISCORD_API_BASE_URL}/guilds/${DISCORD_GUILD_ID}/members/${encodeURIComponent(memberId)}/roles/${roleId}`;
  return discordRequest(dependencies, membershipUrl, {
    method: operation === "add" ? "PUT" : "DELETE",
    headers: { authorization },
  });
}

async function completeRoleInteraction(
  dependencies: HandlerDependencies,
  interaction: ValidMemberInteraction
): Promise<void> {
  if (interaction.action !== "alerts-on" && interaction.action !== "alerts-off") return;

  try {
    const botToken = dependencies.getBotToken();
    if (!botToken) {
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        "Show Alerts could not be updated because the service is not configured. Please contact a moderator."
      );
      return;
    }

    const authorization = `Bot ${botToken}`;
    const roleUrl = `${DISCORD_API_BASE_URL}/guilds/${DISCORD_GUILD_ID}/roles/${DISCORD_SHOW_ALERTS_ROLE_ID}`;

    const roleResponse = await discordRequest(dependencies, roleUrl, {
      method: "GET",
      headers: { authorization },
    });

    if (!roleResponse.ok) {
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        "Show Alerts could not be updated. Please try again later or contact a moderator."
      );
      return;
    }

    let role: unknown;
    try {
      role = await roleResponse.json();
    } catch {
      role = undefined;
    }

    if (!isSafeShowAlertsRole(role)) {
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        "Show Alerts could not be updated because the role configuration is not safe. Please contact a moderator."
      );
      return;
    }

    const membershipResponse = await mutateSingleMemberRole(
      dependencies,
      authorization,
      interaction.memberId,
      DISCORD_SHOW_ALERTS_ROLE_ID,
      interaction.action === "alerts-on" ? "add" : "remove"
    );

    if (!membershipResponse.ok) {
      const permissionProblem = membershipResponse.status === 401 || membershipResponse.status === 403;
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        permissionProblem
          ? "Show Alerts could not be updated because the bot does not have permission. Please contact a moderator."
          : "Show Alerts could not be updated. Please try again later or contact a moderator."
      );
      return;
    }

    await updateOriginalResponse(
      dependencies,
      interaction.token,
      interaction.action === "alerts-on" ? "Show Alerts are now on." : "Show Alerts are now off."
    );
  } catch {
    await updateOriginalResponse(
      dependencies,
      interaction.token,
      "Show Alerts could not be updated. Please try again later or contact a moderator."
    );
  }
}

async function completeCollectingRoleInteraction(
  dependencies: HandlerDependencies,
  interaction: ValidMemberInteraction
): Promise<void> {
  const genericFailure = "Collecting interests could not be updated. Please try again later or contact a moderator.";

  if (typeof interaction.action === "string") return;

  try {
    const botToken = dependencies.getBotToken();
    if (!botToken) {
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        "Collecting interests could not be updated because the service is not configured. Please contact a moderator."
      );
      return;
    }

    const authorization = `Bot ${botToken}`;
    const selectedRole = interaction.action.role;
    const roleResponse = await discordRequest(
      dependencies,
      `${DISCORD_API_BASE_URL}/guilds/${DISCORD_GUILD_ID}/roles/${selectedRole.roleId}`,
      { method: "GET", headers: { authorization } }
    );

    if (!roleResponse.ok) {
      await updateOriginalResponse(dependencies, interaction.token, genericFailure);
      return;
    }

    let role: unknown;
    try {
      role = await roleResponse.json();
    } catch {
      role = undefined;
    }

    if (!isSafeCollectingRole(role, selectedRole)) {
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        "Collecting interests could not be updated because the role configuration is not safe. Please contact a moderator."
      );
      return;
    }

    const channelsResponse = await discordRequest(
      dependencies,
      `${DISCORD_API_BASE_URL}/guilds/${DISCORD_GUILD_ID}/channels`,
      { method: "GET", headers: { authorization } }
    );

    if (!channelsResponse.ok) {
      await updateOriginalResponse(dependencies, interaction.token, genericFailure);
      return;
    }

    let channels: unknown;
    try {
      channels = await channelsResponse.json();
    } catch {
      channels = undefined;
    }

    if (!hasSafeCollectingChannelOverwrites(channels, selectedRole.roleId)) {
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        "Collecting interests could not be updated because the channel permissions are not safe. Please contact a moderator."
      );
      return;
    }

    const membershipResponse = await mutateSingleMemberRole(
      dependencies,
      authorization,
      interaction.memberId,
      selectedRole.roleId,
      interaction.action.operation
    );

    if (!membershipResponse.ok) {
      const permissionProblem = membershipResponse.status === 401 || membershipResponse.status === 403;
      await updateOriginalResponse(
        dependencies,
        interaction.token,
        permissionProblem
          ? "Collecting interests could not be updated because the bot does not have permission. Please contact a moderator."
          : genericFailure
      );
      return;
    }

    await updateOriginalResponse(
      dependencies,
      interaction.token,
      `${selectedRole.name} ${interaction.action.operation === "add" ? "added to" : "removed from"} your collecting interests.`
    );
  } catch {
    await updateOriginalResponse(dependencies, interaction.token, genericFailure);
  }
}

/**
 * Creates the raw-body Discord interaction handler. It verifies every request before JSON parsing.
 */
export function createDiscordWelcomeHandler(options: DiscordWelcomeHandlerOptions = {}): RequestHandler {
  const dependencies = createDependencies(options);

  return (req, res) => {
    if (!hasValidSignature(req, dependencies)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse((req.body as Buffer).toString("utf8"));
    } catch {
      res.status(400).json({ error: "Invalid interaction" });
      return;
    }

    if (isRecord(payload) && payload.type === 1) {
      res.status(200).json({ type: 1 });
      return;
    }

    const interaction = parseMemberInteraction(payload);
    if (!interaction) {
      res.status(400).json({ error: "Invalid interaction" });
      return;
    }

    if (interaction.action === "rules") {
      res.status(200).json(privateMessage(RULES_RESPONSE));
      return;
    }

    if (interaction.action === "help") {
      res.status(200).json(privateMessage(HELP_RESPONSE));
      return;
    }

    // This acknowledgement is sent before any Discord API request; completion is then patched privately.
    res.status(200).json(privateDeferredMessage());
    if (interaction.action === "alerts-on" || interaction.action === "alerts-off") {
      void completeRoleInteraction(dependencies, interaction).catch(() => undefined);
      return;
    }
    void completeCollectingRoleInteraction(dependencies, interaction).catch(() => undefined);
  };
}

/** Register before express.json() so signature verification sees Discord's exact raw bytes. */
export function registerDiscordWelcomeRoutes(app: Express, options: DiscordWelcomeHandlerOptions = {}): void {
  app.get("/api/discord/collecting-roles", (_req, res) => {
    res.set("Cache-Control", "no-store").json({
      version: "collecting-roles-v1",
      categories: DISCORD_COLLECTING_ROLES,
    });
  });
  app.post(
    DISCORD_INTERACTIONS_PATH,
    express.raw({ type: "application/json", limit: "1mb" }),
    createDiscordWelcomeHandler(options)
  );
}
