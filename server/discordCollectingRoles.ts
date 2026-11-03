export interface DiscordCollectingRole {
  readonly key: "pokemon" | "sports" | "other-tcgs" | "other-collectibles";
  readonly name: "Pokémon" | "Sports Cards" | "Other TCGs" | "Other Collectibles";
  readonly roleId: string;
  readonly addCustomId: string;
  readonly removeCustomId: string;
}

/**
 * The only collecting roles that may be changed through Discord component interactions.
 * These IDs are deliberately fixed in source, never accepted from an interaction payload.
 */
export const DISCORD_COLLECTING_ROLES = [
  {
    key: "pokemon",
    name: "Pokémon",
    roleId: "1561623862679044187",
    addCustomId: "ripz_collect_pokemon_add_v1",
    removeCustomId: "ripz_collect_pokemon_remove_v1",
  },
  {
    key: "sports",
    name: "Sports Cards",
    roleId: "1561623867535921202",
    addCustomId: "ripz_collect_sports_add_v1",
    removeCustomId: "ripz_collect_sports_remove_v1",
  },
  {
    key: "other-tcgs",
    name: "Other TCGs",
    roleId: "1561623871709253646",
    addCustomId: "ripz_collect_other_tcgs_add_v1",
    removeCustomId: "ripz_collect_other_tcgs_remove_v1",
  },
  {
    key: "other-collectibles",
    name: "Other Collectibles",
    roleId: "1561623876612530276",
    addCustomId: "ripz_collect_other_collectibles_add_v1",
    removeCustomId: "ripz_collect_other_collectibles_remove_v1",
  },
] as const satisfies readonly DiscordCollectingRole[];

export type DiscordCollectingRoleConfig = (typeof DISCORD_COLLECTING_ROLES)[number];

export interface DiscordCollectingRoleAction {
  readonly role: DiscordCollectingRoleConfig;
  readonly operation: "add" | "remove";
}

/**
 * Resolves only the eight fixed component IDs. The component value never supplies a
 * role or member target.
 */
export function getDiscordCollectingRoleAction(customId: unknown): DiscordCollectingRoleAction | undefined {
  switch (customId) {
    case "ripz_collect_pokemon_add_v1":
      return { role: DISCORD_COLLECTING_ROLES[0], operation: "add" };
    case "ripz_collect_pokemon_remove_v1":
      return { role: DISCORD_COLLECTING_ROLES[0], operation: "remove" };
    case "ripz_collect_sports_add_v1":
      return { role: DISCORD_COLLECTING_ROLES[1], operation: "add" };
    case "ripz_collect_sports_remove_v1":
      return { role: DISCORD_COLLECTING_ROLES[1], operation: "remove" };
    case "ripz_collect_other_tcgs_add_v1":
      return { role: DISCORD_COLLECTING_ROLES[2], operation: "add" };
    case "ripz_collect_other_tcgs_remove_v1":
      return { role: DISCORD_COLLECTING_ROLES[2], operation: "remove" };
    case "ripz_collect_other_collectibles_add_v1":
      return { role: DISCORD_COLLECTING_ROLES[3], operation: "add" };
    case "ripz_collect_other_collectibles_remove_v1":
      return { role: DISCORD_COLLECTING_ROLES[3], operation: "remove" };
    default:
      return undefined;
  }
}
