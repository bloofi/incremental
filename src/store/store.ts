import { configureStore } from "@reduxjs/toolkit";

import appSlice from "./app-slice";
import gameReducer from "./game-slice";
import resourceSlice from "./resources-slice";
import createGameWorkerMiddleware from "./worker-middleware";

const store = configureStore({
    reducer: {
        app: appSlice,
        game: gameReducer,
        resources: resourceSlice,
    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat([createGameWorkerMiddleware()]);
    },
});

export default store;

export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
