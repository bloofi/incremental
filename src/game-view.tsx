import { useEffect, useMemo } from "react";

import GameCanvas from "./components/game-canvas";
import GameOverlay from "./components/game-overlay";
import SkillTree from "./components/skill-tree";
import { GameCoinTypes, GameEngineActionTypes } from "./game/types";
import { useAppDispatch, useAppSelector } from "./store";
import { selectAppGameWorkerReady } from "./store/app-slice";
import {
    clearAllResources,
    loadModelsAsync,
    loadSkyboxesAsync,
    loadTexturesAsync,
    selectGetModels,
    selectGetSkyboxes,
    selectGetTextures,
} from "./store/resources-slice";
import { createWorkerAction, createWorkerSendAction, WorkerEvent } from "./store/worker-middleware";
import { BasicLoadStates } from "./types";

export default function Game() {
    const dispatch = useAppDispatch();
    const isGameWorkerReady = useAppSelector(selectAppGameWorkerReady);
    const allTextures = useAppSelector(selectGetTextures);
    const allSkyboxes = useAppSelector(selectGetSkyboxes);
    const allModels = useAppSelector(selectGetModels);

    const isResourcesReady = useMemo(() => {
        const texturesReady = Object.keys(allTextures).length && Object.values(allTextures).every((m) => m.state === BasicLoadStates.LOADED);
        const skyboxesReady = Object.keys(allSkyboxes).length && Object.values(allSkyboxes).every((m) => m.state === BasicLoadStates.LOADED);
        const modelsReady = Object.keys(allModels).length && Object.values(allModels).every((m) => m.state === BasicLoadStates.LOADED);
        return texturesReady && skyboxesReady && modelsReady;
    }, [allTextures, allSkyboxes, allModels]);

    useEffect(() => {
        // Init worker
        console.log("=> Init Worker");
        dispatch(createWorkerAction(WorkerEvent.Init));

        // Load resources
        console.log("=> Load Resources");
        dispatch(
            loadTexturesAsync([
                { name: "grass", url: "/textures/grass01.jpg" },
                { name: "soil", url: "/textures/soil01.jpg" },
            ]),
        );

        // Load skyboxes
        console.log("=> Load Skyboxes");
        dispatch(loadSkyboxesAsync([{ name: "sky01", url: "/skyboxes/golden_gate_hills" }]));

        // Load models
        console.log("=> Load Models");
        dispatch(
            loadModelsAsync([
                { name: `coin_${GameCoinTypes.BRONZE}`, url: "/models/coin_copper.glb" },
                { name: `coin_${GameCoinTypes.SILVER}`, url: "/models/coin_silver.glb" },
                { name: `coin_${GameCoinTypes.GOLD}`, url: "/models/coin_gold.glb" },
                { name: `coin_${GameCoinTypes.DIAMOND}`, url: "/models/coin_heart.glb" },
            ]),
        );

        return () => {
            console.log("=> Cleanup Worker");
            dispatch(createWorkerAction(WorkerEvent.Destroy));
            console.log("=> Cleanup Resources");
            dispatch(clearAllResources());
        };
    }, [dispatch]);

    useEffect(() => {
        if (isGameWorkerReady) {
            console.log("reset game engine");
            dispatch(createWorkerSendAction({ type: GameEngineActionTypes.RESET }));
        }
    }, [dispatch, isGameWorkerReady]);

    return isGameWorkerReady && isResourcesReady ? (
        <>
            <GameCanvas />
            <GameOverlay />
            <SkillTree />
        </>
    ) : (
        <div style={{ width: "100%", height: "100%", backgroundColor: "#000000" }}>Loading Game Worker...</div>
    );
}
