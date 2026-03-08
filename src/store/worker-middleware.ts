// Actions
import type { Middleware } from "redux";

import type { GameEngineAction, GameEngineEvent} from "../game/types";
import { GameEngineEventTypes } from "../game/types";
import { GameEngineActionTypes } from "../game/types";

import { setGameWorkerReady } from "./app-slice";
import { setGameState, setSkillTree } from "./game-slice";

export enum WorkerEvent {
    Init = "worker/game/init",
    Send = "worker/game/send",
    Destroy = "worker/game/destroy",
}

type WorkerActionBase = {
    type: WorkerEvent;
    payload?: unknown;
};
export type WorkerInitAction = WorkerActionBase & {
    type: WorkerEvent.Init;
    payload?: never;
};
export type WorkerSendAction = WorkerActionBase & {
    type: WorkerEvent.Send;
    payload: GameEngineAction<GameEngineActionTypes>;
};
export type WorkerDestroyAction = {
    type: WorkerEvent.Destroy;
    payload?: never;
};

export type WorkerAction = WorkerActionBase & (WorkerInitAction | WorkerSendAction | WorkerDestroyAction);

export default function createGameWorkerMiddleware(): Middleware {
    let gameWorker: Worker;
    return (store) => (next) => (action) => {
        if (isWorkerAction(action)) {
            switch (action.type) {
                case WorkerEvent.Init: {
                    if (gameWorker) {
                        console.error("Game worker already exists");
                    } else {
                        gameWorker = new Worker(new URL("../game/worker.ts", import.meta.url), { type: "module" });
                        gameWorker.addEventListener("message", (e: MessageEvent<GameEngineEvent<GameEngineEventTypes>>) => {
                            switch (e.data.type) {
                                case GameEngineEventTypes.SKILL_TREE_UPDATED:
                                    store.dispatch(setSkillTree(e.data.payload));
                                    break;
                                case GameEngineEventTypes.STATE_UPDATED:
                                    store.dispatch(setGameState(e.data.payload));
                                    break;
                                default:
                                    break;
                            }
                            window.dispatchEvent(new CustomEvent<GameEngineEvent<GameEngineEventTypes>>("gameWorker", { detail: e.data }));
                        });
                        store.dispatch(setGameWorkerReady(true));
                        console.info("Game Worker ready", gameWorker);
                    }
                    break;
                }
                case WorkerEvent.Destroy: {
                    if (gameWorker) {
                        console.info("Game Worker cleanup");
                        gameWorker.postMessage({ type: GameEngineActionTypes.DESTROY });
                        gameWorker.terminate();
                        gameWorker = null;
                        store.dispatch(setGameWorkerReady(false));
                    } else {
                        console.error("No Game Worker to be destroyed");
                    }
                    break;
                }
                case WorkerEvent.Send: {
                    if (gameWorker) {
                        gameWorker.postMessage(action.payload);
                    } else {
                        console.error("No Game Worker to send message", action.payload);
                    }
                    break;
                }
            }
        }
        return next(action);
    };
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Actions helpers
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function isWorkerAction(a: unknown): a is WorkerAction {
    return Object.values(WorkerEvent).includes((a as WorkerAction)?.type);
}

export function createWorkerAction<T extends WorkerEvent>(type: T, payload?: object | string | number | boolean): WorkerAction & { type: T } {
    return {
        type,
        payload,
    } as WorkerAction & { type: T };
}

export function createWorkerSendAction(payload: GameEngineAction<GameEngineActionTypes>): WorkerSendAction {
    return createWorkerAction<WorkerEvent.Send>(WorkerEvent.Send, payload);
}
