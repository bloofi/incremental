/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Entities
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export enum GameCoinTypes {
    BRONZE = "bronze",
    SILVER = "silver",
    GOLD = "gold",
    DIAMOND = "diamond",
}

export type GameCoin = {
    id: string;
    type: GameCoinTypes;
    x: number;
    z: number;
};

export type GameEngineOptions = {
    stateUpdateRate?: number;
    spawnRadius?: number;
    coinSpawnRate?: number; // Coin spawn per seconds
    coinSpawnProbabilities?: Record<GameCoinTypes, number>;
    coinValues?: Record<GameCoinTypes, number>;
};

export type GameEngineState = {
    isRunning: boolean;
    coins: Record<string, GameCoin>;
    currentMoney: number;
    skillValues: SkillRecord;
};

export const SkillIds = [
    "skill.mouse",
    "skill.mouse.circle",
    "skill.mouse.circle.radius",
    "skill.mouse.circle.radius.1",
    "skill.mouse.circle.radius.2",
    "skill.mouse.circle.radius.3",
    "skill.mouse.circle.radius.4",
    "skill.mouse.ulti",
    "skill.move",
    "skill.move.horizontal",
    "skill.move.horizontal.speed",
    "skill.move.horizontal.speed.1",
    "skill.move.horizontal.speed.2",
    "skill.move.horizontal.speed.3",
    "skill.move.vertical",
    "skill.move.vertical.speed",
    "skill.move.vertical.speed.1",
    "skill.move.vertical.speed.2",
    "skill.move.vertical.speed.3",
    "skill.coins",
    "skill.coins.delay",
    "skill.coins.bronze",
    "skill.coins.bronze.rate",
    "skill.coins.bronze.gain",
    "skill.coins.bronze.gain.1",
    "skill.coins.bronze.gain.2",
    "skill.coins.bronze.gain.3",
    "skill.coins.bronze.gain.4",
    "skill.coins.silver",
    "skill.coins.silver.rate",
    "skill.coins.silver.rate.1",
    "skill.coins.silver.rate.2",
    "skill.coins.silver.rate.3",
    "skill.coins.silver.rate.4",
    "skill.coins.silver.gain",
    "skill.coins.silver.gain.1",
    "skill.coins.silver.gain.2",
    "skill.coins.silver.gain.3",
    "skill.coins.silver.gain.4",
    "skill.coins.gold",
    "skill.coins.gold.rate",
    "skill.coins.gold.rate.1",
    "skill.coins.gold.rate.2",
    "skill.coins.gold.rate.3",
    "skill.coins.gold.rate.4",
    "skill.coins.gold.gain",
    "skill.coins.gold.gain.1",
    "skill.coins.gold.gain.2",
    "skill.coins.gold.gain.3",
    "skill.coins.gold.gain.4",
    "skill.coins.diamond",
    "skill.coins.diamond.rate",
    "skill.coins.diamond.rate.1",
    "skill.coins.diamond.rate.2",
    "skill.coins.diamond.rate.3",
    "skill.coins.diamond.rate.4",
    "skill.coins.diamond.gain",
    "skill.coins.diamond.gain.1",
    "skill.coins.diamond.gain.2",
    "skill.coins.diamond.gain.3",
    "skill.coins.diamond.gain.4",
] as const;

export const SkillKeys = [
    "skill.mouse.enabled",
    "skill.mouse.circle.enabled",
    "skill.mouse.circle.radius.value",
    "skill.mouse.ulti.enabled",
    "skill.move.enabled",
    "skill.move.horizontal.enabled",
    "skill.move.horizontal.speed.value",
    "skill.move.vertical.enabled",
    "skill.move.vertical.speed.value",
    "skill.coins.enabled",
    "skill.coins.delay.value",
    "skill.coins.bronze.enabled",
    "skill.coins.bronze.rate.value",
    "skill.coins.bronze.gain.value",
    "skill.coins.silver.enabled",
    "skill.coins.silver.rate.value",
    "skill.coins.silver.gain.value",
    "skill.coins.gold.enabled",
    "skill.coins.gold.rate.value",
    "skill.coins.gold.gain.value",
    "skill.coins.diamond.enabled",
    "skill.coins.diamond.rate.value",
    "skill.coins.diamond.gain.value",
] as const;

export type BooleanKey = Extract<(typeof SkillKeys)[number], `${string}.enabled`>;
export type ValueKey = Extract<(typeof SkillKeys)[number], `${string}.value`>;
export type SkillKey = BooleanKey | ValueKey;

export type SkillRecord = {
    [K in SkillKey]: K extends BooleanKey ? boolean : K extends ValueKey ? number : never;
};

export function isBooleanKey(key: string): key is BooleanKey {
    return SkillKeys.includes(key as (typeof SkillKeys)[number]) && key.endsWith(".enabled");
}
export function isValueKey(key: string): key is ValueKey {
    return SkillKeys.includes(key as (typeof SkillKeys)[number]) && key.endsWith(".value");
}

export type SkillTree = {
    values: SkillRecord;
    skills: Array<Skill>;
};

export type Skill = {
    id: (typeof SkillIds)[number];
    name: string;
    desc?: string;
    cost: number;
    activated: boolean;
    changes?: Partial<SkillRecord>;
    children?: Array<Skill>;
    upgrades?: Array<Exclude<Skill, "children" | "upgrades">>;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Engine Actions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export enum GameEngineActionTypes {
    RESET,
    START,
    STOP,
    DESTROY,
    UPDATE_OPTIONS,
    DELETE_COIN,
    DELETE_ALL_COINS,
    ACTIVATE_SKILL,
}

export type GameEngineActionBase = {
    type: GameEngineActionTypes;
    payload?: unknown;
};

export type GameEngineActionReset = GameEngineActionBase & {
    type: GameEngineActionTypes.RESET;
    payload?: never;
};
export type GameEngineActionStart = GameEngineActionBase & {
    type: GameEngineActionTypes.START;
    payload?: never;
};
export type GameEngineActionStop = GameEngineActionBase & {
    type: GameEngineActionTypes.STOP;
    payload?: never;
};
export type GameEngineActionDestroy = GameEngineActionBase & {
    type: GameEngineActionTypes.DESTROY;
    payload?: never;
};
export type GameEngineActionUpdateOptions = GameEngineActionBase & {
    type: GameEngineActionTypes.UPDATE_OPTIONS;
    payload: GameEngineOptions;
};
export type GameEngineActionDeleteCoin = GameEngineActionBase & {
    type: GameEngineActionTypes.DELETE_COIN;
    payload?: GameCoin["id"];
};
export type GameEngineActionDeleteAllCoins = GameEngineActionBase & {
    type: GameEngineActionTypes.DELETE_ALL_COINS;
    payload?: never;
};
export type GameEngineActionActivateSkill = GameEngineActionBase & {
    type: GameEngineActionTypes.ACTIVATE_SKILL;
    payload?: Skill["id"];
};

export type GameEngineAction<T extends GameEngineActionTypes = null> = GameEngineActionBase &
    (T extends GameEngineActionTypes.RESET
        ? GameEngineActionReset
        : T extends GameEngineActionTypes.START
          ? GameEngineActionStart
          : T extends GameEngineActionTypes.STOP
            ? GameEngineActionStop
            : T extends GameEngineActionTypes.DESTROY
              ? GameEngineActionDestroy
              : T extends GameEngineActionTypes.UPDATE_OPTIONS
                ? GameEngineActionUpdateOptions
                : T extends GameEngineActionTypes.DELETE_COIN
                  ? GameEngineActionDeleteCoin
                  : T extends GameEngineActionTypes.DELETE_ALL_COINS
                    ? GameEngineActionDeleteAllCoins
                    : T extends GameEngineActionTypes.ACTIVATE_SKILL
                      ? GameEngineActionActivateSkill
                      : never);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Engine Events
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export enum GameEngineEventTypes {
    RESET,
    START,
    STOP,
    DESTROY,
    OPTIONS_UPDATED,
    STATE_UPDATED,
    COIN_SPAWNED,
    COIN_DELETED,
    SKILL_ACTIVATED,
    SKILL_TREE_UPDATED,
}

export type GameEngineEventBase = {
    type: GameEngineEventTypes;
    timestamp: number;
    payload?: unknown;
};

export type GameEngineEventReset = GameEngineEventBase & {
    type: GameEngineEventTypes.RESET;
    payload: GameEngineState;
};
export type GameEngineEventStart = GameEngineEventBase & {
    type: GameEngineEventTypes.START;
    payload?: never;
};
export type GameEngineEventStop = GameEngineEventBase & {
    type: GameEngineEventTypes.STOP;
    payload?: never;
};
export type GameEngineEventDestroy = GameEngineEventBase & {
    type: GameEngineEventTypes.DESTROY;
    payload?: never;
};
export type GameEngineEventOptionsUpdated = GameEngineEventBase & {
    type: GameEngineEventTypes.OPTIONS_UPDATED;
    payload: GameEngineOptions;
};
export type GameEngineEventStateUpdated = GameEngineEventBase & {
    type: GameEngineEventTypes.STATE_UPDATED;
    payload: GameEngineState;
};
export type GameEngineEventCoinSpawned = GameEngineEventBase & {
    type: GameEngineEventTypes.COIN_SPAWNED;
    payload: GameCoin;
};
export type GameEngineEventCoinDeleted = GameEngineEventBase & {
    type: GameEngineEventTypes.COIN_DELETED;
    payload: GameCoin["id"];
};
export type GameEngineEventSkillActivated = GameEngineEventBase & {
    type: GameEngineEventTypes.SKILL_ACTIVATED;
    payload: {
        activatedId: Skill["id"];
        changes: Skill["changes"];
    };
};
export type GameEngineEventSkillTreeUpdated = GameEngineEventBase & {
    type: GameEngineEventTypes.SKILL_TREE_UPDATED;
    payload: SkillTree["skills"];
};

export type GameEngineEvent<T extends GameEngineEventTypes = null> = GameEngineEventBase &
    (T extends GameEngineEventTypes.RESET
        ? GameEngineEventReset
        : T extends GameEngineEventTypes.START
          ? GameEngineEventStart
          : T extends GameEngineEventTypes.STOP
            ? GameEngineEventStop
            : T extends GameEngineEventTypes.DESTROY
              ? GameEngineEventDestroy
              : T extends GameEngineEventTypes.OPTIONS_UPDATED
                ? GameEngineEventOptionsUpdated
                : T extends GameEngineEventTypes.STATE_UPDATED
                  ? GameEngineEventStateUpdated
                  : T extends GameEngineEventTypes.COIN_SPAWNED
                    ? GameEngineEventCoinSpawned
                    : T extends GameEngineEventTypes.COIN_DELETED
                      ? GameEngineEventCoinDeleted
                      : T extends GameEngineEventTypes.SKILL_ACTIVATED
                        ? GameEngineEventSkillActivated
                        : T extends GameEngineEventTypes.SKILL_TREE_UPDATED
                          ? GameEngineEventSkillTreeUpdated
                          : never);

export type GameEngineListener = <T extends GameEngineEventTypes = null>(event: GameEngineEvent<T>) => void;
