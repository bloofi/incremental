import skillTreeData from "./skill-tree.json";
import {
    type GameCoin,
    GameCoinTypes,
    type GameEngineEvent,
    GameEngineEventTypes,
    type GameEngineListener,
    type GameEngineOptions,
    type GameEngineState,
    isBooleanKey,
    isValueKey,
    type Skill,
    type SkillKey,
    type SkillTree,
} from "./types";

const defaultOptions: GameEngineOptions = {
    stateUpdateRate: 1, // Fire update events every seconds
    spawnRadius: 100,
    coinSpawnRate: 0.2, // Coin spawn every 5sec
};

export default class GameEngine {
    private _listeners: Record<string, GameEngineListener>;
    private _options: GameEngineOptions;
    private _lastTime: number;
    private _currentTime: number;
    private _delays: {
        stateUpdate: [number, number]; // [timeToWait, lastChecked]
        coinSpawn: [number, number]; // [timeToWait, lastChecked]
    };
    private _state: GameEngineState;
    private _skillTree: SkillTree;

    constructor(listener: GameEngineListener, options?: GameEngineOptions) {
        this._listeners = {
            [crypto.randomUUID()]: listener,
        };
        this.updateOptions({ ...defaultOptions, ...(options ?? {}) });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public addListener(listener: GameEngineListener): string {
        const lid = crypto.randomUUID();
        this._listeners[lid] = listener;
        return lid;
    }

    public removeListener(lid: string): void {
        delete this._listeners[lid];
    }

    private fireEvent<T extends GameEngineEventTypes>(event: GameEngineEvent<T>): void {
        Object.values(this._listeners)
            .filter(Boolean)
            .forEach((listener) => {
                listener(event);
            });
    }

    private fireUpdateState(): void {
        this.fireEvent({
            type: GameEngineEventTypes.STATE_UPDATED,
            timestamp: this._currentTime,
            payload: this._state,
        });
    }

    private fireUpdateSkillTree(): void {
        this.fireEvent({
            type: GameEngineEventTypes.SKILL_TREE_UPDATED,
            timestamp: this._currentTime,
            payload: this._skillTree.skills,
        });
    }

    private fireActivateSkill(id: Skill["id"]): void {
        const sk = this.findSkillById(id);
        if (sk) {
            Object.keys(sk.changes ?? {}).forEach((key) => {
                this.checkUpdatedSkillValue(key as SkillKey);
            });
            this.fireEvent({
                type: GameEngineEventTypes.SKILL_ACTIVATED,
                timestamp: this._currentTime,
                payload: {
                    activatedId: sk.id,
                    changes: sk.changes ?? {},
                },
            });
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Public Actions / Getters / Setters
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public updateOptions(options: GameEngineOptions): void {
        this._options = {
            ...this._options,
            ...(options ?? {}),
        };

        // Recompute delays
        this._delays = {
            stateUpdate: [1000 / this._options.stateUpdateRate, 0],
            coinSpawn: [Infinity, 0],
        };
    }

    public reset(): void {
        if (this.isRunning()) {
            this.stop();
        }

        this._skillTree = JSON.parse(JSON.stringify(skillTreeData)) as SkillTree;
        this._state = {
            isRunning: false,
            coins: {},
            currentMoney: 5,
            skillValues: JSON.parse(JSON.stringify(this._skillTree.values)),
        };
        const deepDeactivate = (nodes: Skill[]) => {
            nodes.forEach((n) => {
                n.activated = false;
                deepDeactivate(n.upgrades ?? []);
                deepDeactivate(n.children ?? []);
            });
        };
        deepDeactivate(this._skillTree.skills);

        Object.values(this._delays).forEach((d) => {
            d[1] = performance.now();
        });
        this.fireEvent({
            type: GameEngineEventTypes.RESET,
            timestamp: this._currentTime,
            payload: this._state,
        });
        this.fireUpdateState();

        // Apply all zero-cost skills
        this._skillTree.skills
            .filter((sk) => !sk.cost)
            .forEach((sk) => {
                this.searchAndActivateSkill(sk.id, this._skillTree?.skills ?? []);
            });
        this.fireUpdateSkillTree();
    }

    public start(): void {
        if (this.isRunning()) {
            return;
        }
        this._state.isRunning = true;
        this._lastTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
        this.fireEvent({
            type: GameEngineEventTypes.START,
            timestamp: this._currentTime,
        });
    }

    public stop(): void {
        if (!this.isRunning()) {
            return;
        }
        this._state.isRunning = false;
        this.fireEvent({
            type: GameEngineEventTypes.STOP,
            timestamp: this._currentTime,
        });
        this.fireUpdateState();
    }

    public isRunning(): boolean {
        return !!this._state?.isRunning;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // State Actions
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public deleteAllCoins(): void {
        if (this._state.skillValues["skill.mouse.ulti.enabled"]) {
            Object.keys(this._state.coins).forEach((coinId) => {
                this.deleteCoin(coinId);
            });
        }
    }

    public deleteCoin(coinId: string): void {
        if (!this._state.isRunning) {
            return;
        }

        if (this._state.coins[coinId]) {
            switch (this._state.coins[coinId].type) {
                case GameCoinTypes.BRONZE:
                    this._state.currentMoney += this._state.skillValues["skill.coins.bronze.gain.value"];
                    break;
                case GameCoinTypes.SILVER:
                    this._state.currentMoney += this._state.skillValues["skill.coins.silver.gain.value"];
                    break;
                case GameCoinTypes.GOLD:
                    this._state.currentMoney += this._state.skillValues["skill.coins.gold.gain.value"];
                    break;
                case GameCoinTypes.DIAMOND:
                    this._state.currentMoney += this._state.skillValues["skill.coins.diamond.gain.value"];
                    break;
            }
            delete this._state.coins[coinId];
            this.fireEvent({
                type: GameEngineEventTypes.COIN_DELETED,
                timestamp: this._currentTime,
                payload: coinId,
            });
        }
    }

    public activateSkill(id: Skill["id"]): void {
        this.searchAndActivateSkill(id, this._skillTree?.skills ?? []);
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Private Actions
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private tick(timeStamp: number): void {
        if (!this._state.isRunning) {
            return;
        }
        this._currentTime = timeStamp;
        // const elapsedTime = timeStamp - this._lastTime;

        // Check spawn coins
        if (timeStamp - this._delays.coinSpawn[1] > this._delays.coinSpawn[0]) {
            this._delays.coinSpawn[1] = timeStamp;
            this.spawnCoin();
        }

        if (timeStamp - this._delays.stateUpdate[1] > this._delays.stateUpdate[0]) {
            this._delays.stateUpdate[1] = timeStamp;
            this.fireUpdateState();
        }

        if (this._state.isRunning) {
            this._lastTime = timeStamp;
            requestAnimationFrame(this.tick.bind(this));
        }
    }

    private spawnCoin(): void {
        const randomType = Math.random();
        const coinType =
            this._state.skillValues["skill.coins.diamond.enabled"] && randomType >= 1 - this._state.skillValues["skill.coins.diamond.rate.value"]
                ? GameCoinTypes.DIAMOND
                : this._state.skillValues["skill.coins.gold.enabled"] && randomType >= 1 - this._state.skillValues["skill.coins.gold.rate.value"]
                  ? GameCoinTypes.GOLD
                  : this._state.skillValues["skill.coins.silver.enabled"] &&
                      randomType >= 1 - this._state.skillValues["skill.coins.silver.rate.value"]
                    ? GameCoinTypes.SILVER
                    : GameCoinTypes.BRONZE;

        const point = this.randomRadiusPoint();
        const coin: GameCoin = {
            id: crypto.randomUUID(),
            x: point[0],
            z: point[1],
            type: coinType,
        };
        this._state.coins[coin.id] = coin;
        this.fireEvent({
            type: GameEngineEventTypes.COIN_SPAWNED,
            timestamp: this._currentTime,
            payload: coin,
        });
    }

    private searchAndActivateSkill(id: Skill["id"], skills: Array<Skill>): void {
        skills.forEach((sk) => {
            if (sk.id === id && this._state.currentMoney >= sk.cost) {
                sk.activated = true;
                this._state.currentMoney -= sk.cost;
                Object.entries(sk.changes ?? {}).forEach(([k, val]) => {
                    if (isBooleanKey(k)) {
                        this._state.skillValues[k] = !!val;
                    } else if (isValueKey(k)) {
                        this._state.skillValues[k] = +val;
                    } else {
                        console.warn("====== NO KEY FOUND", k, "val=", val);
                    }
                });
                this.fireActivateSkill(sk.id);
                // When activating a skill, we also activate all descendance having a zero-cost
                (sk.children ?? []).forEach(this.applyRecursiveZeroCost.bind(this));
                this.fireUpdateSkillTree();
                this.fireUpdateState();
            } else {
                if (sk.children?.length) {
                    this.searchAndActivateSkill(id, sk.children);
                }
                if (sk.upgrades?.length) {
                    this.searchAndActivateSkill(id, sk.upgrades);
                }
            }
        });
    }

    private applyRecursiveZeroCost(sk: Skill): void {
        if (!sk.cost) {
            sk.activated = true;
            Object.entries(sk.changes ?? {}).forEach(([k, val]) => {
                if (isBooleanKey(k)) {
                    this._state.skillValues[k] = !!val;
                } else if (isValueKey(k)) {
                    this._state.skillValues[k] = +val;
                } else {
                    console.warn("====== NO KEY FOUND", k, "val=", val);
                }
            });
            this.fireActivateSkill(sk.id);
            if (sk.upgrades?.length) {
                sk.upgrades.filter((u) => !u.cost).forEach(this.applyRecursiveZeroCost.bind(this));
            }
            if (sk.children?.length) {
                sk.children.filter((u) => !u.cost).forEach(this.applyRecursiveZeroCost.bind(this));
            }
        }
    }

    private checkUpdatedSkillValue(key: SkillKey): void {
        switch (key) {
            case "skill.coins.delay.value":
                this._delays.coinSpawn[0] = Math.max(1000, 1000 / this._state.skillValues[key]);
                console.log("MODIFY SPAWN DELAY", this._state.skillValues[key], " => ", this._delays.coinSpawn);
                break;
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Private Helpers
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private findSkillById(id: Skill["id"]): Skill {
        let res: Skill = null;
        const fnLookup = (skills: Skill[]) => {
            return skills.forEach((sk) => {
                if (sk.id === id) {
                    res = sk;
                } else {
                    if (!res) {
                        fnLookup(sk.upgrades ?? []);
                    }
                    if (!res) {
                        fnLookup(sk.children ?? []);
                    }
                }
            });
        };
        fnLookup(this._skillTree.skills);
        return res;
    }

    private randomRadiusPoint(): [number, number] {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * this._options.spawnRadius;

        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        return [Math.round(x), Math.round(y)];
    }
}
