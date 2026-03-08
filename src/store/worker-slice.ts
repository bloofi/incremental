import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type WorkerState = {
    states: Record<string, boolean>;
};

const initialState: WorkerState = {
    states: {},
};

export const workerSlice = createSlice({
    name: 'worker',
    initialState,
    reducers: {
        initWorker: (state, action: PayloadAction<string>) => {
            state.states[action.payload] = true;
        },
        deleteWorker: (state, action: PayloadAction<string>) => {
            state.states[action.payload] = false;
        },
    },
    selectors: {
        selectGetWorkerStates: (state) => state.states,
    },
});

// Action creators are generated for each case reducer function
export const { initWorker, deleteWorker } = workerSlice.actions;
export const { selectGetWorkerStates } = workerSlice.selectors;
export default workerSlice.reducer;
