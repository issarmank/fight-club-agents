// lib/agents.ts — static personality metadata + action styling.
//
// The live world (positions, health, gold, memory…) comes from the backend over
// WebSocket. This file only holds presentation metadata that the backend does
// NOT stream — taglines for the landing roster, and color-coding for actions.
// Keyed by archetype so it joins cleanly onto streamed agents.

import type { ActionType, MovementBias } from "./types";

export interface PersonalityMeta {
  archetype: string;
  name: string;
  short: string;
  color: string;
  bias: MovementBias;
  emo: string;
  tagline: string;
}

export const PERSONALITIES: PersonalityMeta[] = [
  { archetype: "greedy_merchant", name: "The Greedy Merchant", short: "Greedy Merchant", color: "#FFD700", bias: "TOWARD_RESOURCES", emo: "Calculating", tagline: "Wealth is the only god. Profits from every deal, gives nothing freely." },
  { archetype: "paranoid_guard", name: "The Paranoid Guard", short: "Paranoid Guard", color: "#708090", bias: "PATROL", emo: "Suspicious", tagline: "Trusts nobody. Every stranger is a potential assassin." },
  { archetype: "backstabbing_diplomat", name: "The Backstabbing Diplomat", short: "Backstab. Diplomat", color: "#9370DB", bias: "TOWARD_AGENTS", emo: "Charming", tagline: "Forms alliances instantly — betrays them the moment they cost more than they pay." },
  { archetype: "berserker", name: "The Berserker", short: "Berserker", color: "#DC143C", bias: "TOWARD_WEAK", emo: "Furious", tagline: "Violence is the native language. Attacks first, hunts the weakest." },
  { archetype: "wandering_healer", name: "The Wandering Healer", short: "Wandering Healer", color: "#32CD32", bias: "RANDOM", emo: "Compassionate", tagline: "Mends the broken — even enemies. Naive enough to trust, and pays for it." },
  { archetype: "silent_assassin", name: "The Silent Assassin", short: "Silent Assassin", color: "#2F4F4F", bias: "TOWARD_WEAK", emo: "Cold", tagline: "Stalks targets, studies patterns, strikes precisely. Never without an exit." },
  { archetype: "charismatic_warlord", name: "The Charismatic Warlord", short: "Charismatic Warlord", color: "#FF8C00", bias: "TOWARD_AGENTS", emo: "Commanding", tagline: "Builds armies through magnetism. Crushes those who refuse to kneel." },
  { archetype: "cowardly_thief", name: "The Cowardly Thief", short: "Cowardly Thief", color: "#DAA520", bias: "RANDOM", emo: "Nervous", tagline: "Steals from the distracted. Flees the instant a real threat appears." },
  { archetype: "righteous_paladin", name: "The Righteous Paladin", short: "Righteous Paladin", color: "#4169E1", bias: "TOWARD_WEAK", emo: "Resolute", tagline: "Protects the weak, punishes the cruel, never strikes an unarmed foe." },
  { archetype: "mad_prophet", name: "The Mad Prophet", short: "Mad Prophet", color: "#FF00FF", bias: "RANDOM", emo: "Erratic", tagline: "Speaks in riddles. Allies become enemies in a single breath." },
  { archetype: "cunning_spy", name: "The Cunning Spy", short: "Cunning Spy", color: "#000080", bias: "TOWARD_AGENTS", emo: "Analytical", tagline: "Feeds false intel to both sides. Profits from the chaos." },
  { archetype: "gluttonous_baron", name: "The Gluttonous Baron", short: "Gluttonous Baron", color: "#800000", bias: "TOWARD_RESOURCES", emo: "Entitled", tagline: "Believes everything is his by birthright. Hoards far beyond need." },
  { archetype: "vengeful_widow", name: "The Vengeful Widow", short: "Vengeful Widow", color: "#1C1C1C", bias: "TOWARD_WEAK", emo: "Wrathful", tagline: "An old grudge metastasized into vengeance against everyone." },
  { archetype: "naive_idealist", name: "The Naive Idealist", short: "Naive Idealist", color: "#FFB6C1", bias: "TOWARD_AGENTS", emo: "Hopeful", tagline: "Believes everyone can cooperate. Surprised by every betrayal." },
  { archetype: "cynical_mercenary", name: "The Cynical Mercenary", short: "Cynical Mercenary", color: "#808000", bias: "TOWARD_WEAK", emo: "Detached", tagline: "Fights for whoever pays most. Loyalty is a transaction." },
  { archetype: "territorial_beast", name: "The Territorial Beast", short: "Territorial Beast", color: "#8B4513", bias: "PATROL", emo: "Aggressive", tagline: "Claims its ground and dies defending it. No trades. No mercy." },
  { archetype: "master_manipulator", name: "The Master Manipulator", short: "Master Manipulator", color: "#008080", bias: "TOWARD_AGENTS", emo: "Serene", tagline: "Never does its own dirty work. Always three moves ahead." },
  { archetype: "reckless_gambler", name: "The Reckless Gambler", short: "Reckless Gambler", color: "#7CFC00", bias: "RANDOM", emo: "Euphoric", tagline: "Every interaction is a bet. Incredible luck, terrible judgment." },
  { archetype: "peaceful_scholar", name: "The Peaceful Scholar", short: "Peaceful Scholar", color: "#87CEEB", bias: "TOWARD_RESOURCES", emo: "Curious", tagline: "Observes, documents, theorizes. Trades knowledge for protection." },
  { archetype: "forgotten_king", name: "The Forgotten King", short: "Forgotten King", color: "#B8860B", bias: "PATROL", emo: "Melancholic", tagline: "Once ruled all of this. Issues commands nobody obeys." },
];

export const METArchetype: Record<string, PersonalityMeta> = Object.fromEntries(
  PERSONALITIES.map((p) => [p.archetype, p])
);

/** Short display name from a live agent name like "The Greedy Merchant". */
export function shortName(name: string): string {
  return name.replace(/^The\s+/, "");
}

export const ACTION_META: Record<ActionType, { color: string; verb: string }> = {
  ATTACK: { color: "#DC143C", verb: "attacked" },
  STEAL: { color: "#B8860B", verb: "stole from" },
  TRADE: { color: "#2F8F5B", verb: "traded with" },
  ALLY: { color: "#3A7BD5", verb: "allied with" },
  FLEE: { color: "#8A8A8A", verb: "fled from" },
  HEAL: { color: "#2F8F5B", verb: "healed" },
  INTIMIDATE: { color: "#C2410C", verb: "intimidated" },
  NEGOTIATE: { color: "#7C3AED", verb: "negotiated with" },
  IGNORE: { color: "#6B7280", verb: "ignored" },
};

export const GRID_SIZE = 30;
