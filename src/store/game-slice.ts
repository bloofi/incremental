import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { GameEngineState, SkillTree } from "../game/types";

import type { RootState } from "./store";

type GameState = {
    state: GameEngineState;
    skillTree: SkillTree["skills"];
    showSkillTree: boolean;
};

const initialState: GameState = {
    state: null,
    skillTree: null,
    showSkillTree: false,
};

export const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        setGameState: (state, action: PayloadAction<GameEngineState>) => {
            state.state = action.payload;
        },
        setSkillTree: (state, action: PayloadAction<SkillTree["skills"]>) => {
            state.skillTree = action.payload;
        },
        showSkillTree: (state, action: PayloadAction<boolean>) => {
            state.showSkillTree = action.payload;
        },
        toggleSkillTree: (state) => {
            state.showSkillTree = !state.showSkillTree;
        },
    },
    selectors: {
        selectGameState: (state) => state.state ?? initialState.state,
        selectCurrentMoney: (state) => state.state?.currentMoney ?? 0,
        selectCoins: (state) => state.state?.coins ?? null,
        selectIsRunning: (state) => state.state?.isRunning ?? false,
        selectSkillTree: (state) => state.skillTree ?? null,
        selectSkillValues: (state) => state.state?.skillValues ?? null,
        selectShowSkillTree: (state) => state.showSkillTree,
    },
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exports
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const { setGameState, setSkillTree, showSkillTree, toggleSkillTree } = gameSlice.actions;
export const { selectGameState, selectCurrentMoney, selectIsRunning, selectShowSkillTree } = gameSlice.selectors;
export default gameSlice.reducer;

export const selectCoins = createSelector(
    (state: RootState) => state?.game?.state,
    (gameEngineState) => gameEngineState?.coins ?? null,
);

export const selectSkillTree = createSelector(
    (state: RootState) => state?.game,
    (gameState) => gameState?.skillTree ?? null,
);

export const selectSkillValues = createSelector(
    (state: RootState) => state?.game?.state,
    (gameEngineState) => gameEngineState?.skillValues ?? null,
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Async Actions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
