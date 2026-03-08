import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { ScreenModes } from "../types";

type AppState = {
    screenMode: ScreenModes;
    isGameWorkerReady: boolean;
};

const initialState: AppState = {
    screenMode: ScreenModes.LOADING,
    isGameWorkerReady: false,
};

export const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setScreenMode: (state, action: PayloadAction<ScreenModes>) => {
            state.screenMode = action.payload;
        },
        setGameWorkerReady: (state, action: PayloadAction<boolean>) => {
            state.isGameWorkerReady = action.payload;
        },
    },
    selectors: {
        selectAppScreenMode: (state) => state.screenMode,
        selectAppGameWorkerReady: (state) => state.isGameWorkerReady,
    },
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exports
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const { setScreenMode, setGameWorkerReady } = appSlice.actions;
export const { selectAppScreenMode, selectAppGameWorkerReady } = appSlice.selectors;
export default appSlice.reducer;
