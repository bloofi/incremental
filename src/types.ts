import type { GameEngineAction, GameEngineActionTypes } from "./game/types";

declare global {
    interface WindowEventMap {
        gameWorker: CustomEvent<GameEngineAction<GameEngineActionTypes>>;
    }
}

export type AppState = {
    currentScreenMode: ScreenModes;
};

export enum BasicLoadStates {
    NONE = "none",
    LOADING = "loading",
    LOADED = "loaded",
    ERROR = "error",
}

export enum ScreenModes {
    SPLASH,
    LOADING,
    MENU,
    GAME,
}

export type AuthResponse = {
    name: string;
    token: string;
};

export type ApiResponseMetadata = Record<string, string | string[] | number | number[] | boolean | boolean[] | object | object[] | null>;
export type ApiResponseError = {
    code: string;
    message?: string;
    reason?: string;
    stack?: string | string[];
};

export type ApiResponse<T extends object = object, M extends ApiResponseMetadata = ApiResponseMetadata> = {
    data?: T;
    metadata?: M;
    error?: ApiResponseError;
};
