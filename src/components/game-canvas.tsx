import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clone as SkeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useDebounceCallback } from "usehooks-ts";

import {
    type GameEngineAction,
    GameEngineActionTypes,
    type GameEngineEvent,
    GameEngineEventTypes,
    isValueKey,
    type SkillRecord,
} from "../game/types";
import { useAppDispatch, useAppSelector } from "../store";
import { selectIsRunning, selectShowSkillTree, selectSkillValues, toggleSkillTree } from "../store/game-slice";
import { ResourcesMapping, selectGetModels, selectGetSkyboxes } from "../store/resources-slice";
import { createWorkerSendAction } from "../store/worker-middleware";
import FreeLookControls from "../utils/free-look-controls";

export default function GameCanvas() {
    const ref = useRef<HTMLDivElement | null>(null);
    const isRunningRef = useRef(false);
    const coinsRef = useRef<Record<string, THREE.Object3D<THREE.Object3DEventMap>>>({});
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const mousePlaneRef = useRef<THREE.Mesh<THREE.CircleGeometry>>(null);
    const controlRef = useRef<FreeLookControls>(null);
    const mouseRef = useRef(new THREE.Vector2());
    const skyboxes = useAppSelector(selectGetSkyboxes);
    const models = useAppSelector(selectGetModels);
    const isRunning = useAppSelector(selectIsRunning);
    const skillValues = useAppSelector(selectSkillValues);
    const showSkillTree = useAppSelector(selectShowSkillTree);
    const showSkillTreeRef = useRef(false);
    const skillValuesRef = useRef<SkillRecord>(null);
    const dispatch = useAppDispatch();

    const tileSize = 1;
    const tileSpacing = 0.5;

    const postToWorker = useDebounceCallback(
        (event: GameEngineAction<GameEngineActionTypes>) => {
            dispatch(createWorkerSendAction(event));
        },
        10,
        { maxWait: 10 },
    );

    const workerCallback = (evt: CustomEvent<GameEngineEvent<GameEngineEventTypes>>) => {
        const { type, payload } = evt.detail;
        switch (type) {
            case GameEngineEventTypes.SKILL_ACTIVATED: {
                console.log("====== SKill Activated", payload.activatedId);
                Object.entries(payload.changes).forEach(([key, val]) => {
                    skillValuesRef.current = {
                        ...skillValuesRef.current,
                        [key]: isValueKey(key) ? +val : !!val,
                    };
                    switch (key) {
                        case "skill.move.enabled":
                            if (val) {
                                controlRef.current.enable();
                            } else {
                                controlRef.current.disable();
                            }
                            break;
                        case "skill.mouse.circle.enabled": {
                            if (val) {
                                const radius = skillValuesRef.current["skill.mouse.circle.radius.value"] ?? 4;
                                const mousePlaneGeo = new THREE.CircleGeometry(1, 64);
                                const mousePlaneMesh = new THREE.Mesh(
                                    mousePlaneGeo,
                                    new THREE.MeshBasicMaterial({ color: 0x00dd00, transparent: true, opacity: 0.7 }),
                                );
                                mousePlaneMesh.rotation.x = -Math.PI / 2;
                                mousePlaneMesh.scale.set(radius, radius, radius);
                                mousePlaneRef.current = mousePlaneMesh;
                                sceneRef.current.add(mousePlaneRef.current);
                            }
                            break;
                        }
                        case "skill.mouse.circle.radius.value": {
                            mousePlaneRef.current.scale.set(+val, +val, +val);
                            break;
                        }
                        case "skill.move.horizontal.enabled":
                            controlRef.current.setOptions({ horizontalPanEnabled: !!val });
                            break;
                        case "skill.move.vertical.enabled":
                            controlRef.current.setOptions({ verticalPanEnabled: !!val });
                            break;
                        case "skill.move.horizontal.speed.value":
                            controlRef.current.setOptions({ horizontalSpeed: +val });
                            break;
                        case "skill.move.vertical.speed.value":
                            controlRef.current.setOptions({ verticalSpeed: +val });
                            break;
                    }
                });

                break;
            }
            case GameEngineEventTypes.COIN_SPAWNED: {
                const coinObj = ResourcesMapping.models[models[`coin_${payload.type}`]?.resourceRef];
                if (coinObj) {
                    const coin = SkeletonClone(coinObj.scene.clone());
                    coin.position.x = payload.x * tileSize + payload.x * tileSpacing;
                    coin.position.z = payload.z * tileSize + payload.z * tileSpacing;
                    coin.position.y = 1;
                    coin.scale.set(5, 5, 5);
                    coin.userData = {
                        intersectable: false,
                        coinId: payload.id,
                    };
                    coin.children[0].userData = {
                        intersectable: true,
                        coinId: payload.id,
                    };

                    coinsRef.current[payload.id] = coin;
                    sceneRef.current.add(coin);
                }
                break;
            }
            case GameEngineEventTypes.COIN_DELETED: {
                coinsRef.current[payload]?.removeFromParent();
                delete coinsRef.current[payload];
                break;
            }
        }
    };

    useEffect(() => {
        console.log("=> Add listener to worker (GameCanvas)");
        window.addEventListener("gameWorker", workerCallback as unknown as EventListener);

        return () => {
            console.log("=> Cleanup worker listener (GameCanvas)");
            window.removeEventListener("gameWorker", workerCallback as unknown as EventListener);
        };
    }, []);

    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    useEffect(() => {
        skillValuesRef.current = skillValues;
    }, [skillValues]);

    useEffect(() => {
        showSkillTreeRef.current = showSkillTree;
    }, [showSkillTree]);

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // User Inputs
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const onKeyDownCallback = useDebounceCallback(
        (event: KeyboardEvent) => {
            switch (event.code) {
                case "Space": {
                    if (isRunningRef.current) {
                        dispatch(toggleSkillTree());
                    }
                    event.preventDefault();
                    break;
                }
                case "Enter":
                case "Escape": {
                    if (showSkillTreeRef.current) {
                        dispatch(toggleSkillTree());
                    }
                    postToWorker({
                        type: isRunningRef.current ? GameEngineActionTypes.STOP : GameEngineActionTypes.START,
                    });
                    event.preventDefault();
                    break;
                }
                case "KeyE": {
                    if (skillValuesRef.current["skill.mouse.ulti.enabled"]) {
                        postToWorker({
                            type: GameEngineActionTypes.DELETE_ALL_COINS,
                        });
                    }
                    event.preventDefault();
                    break;
                }
                default:
                    console.log(`Ignore key [${event.code}]`);
                    break;
            }
        },
        20,
        { maxWait: 20 },
    );

    const intersectionPoint = new THREE.Vector3();
    const onMouseMoveCallback = useDebounceCallback(
        (event: MouseEvent) => {
            if (!isRunningRef.current || !skillValuesRef.current?.["skill.mouse.circle.enabled"]) {
                return;
            }

            mouseRef.current.x = (event.offsetX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.offsetY / window.innerHeight) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
            raycasterRef.current.ray.intersectPlane(groundPlane.current, intersectionPoint);
            if (intersectionPoint) {
                mousePlaneRef.current.position.set(intersectionPoint.x, 0, intersectionPoint.z);
            }

            // circle area detection
            const intersecting: THREE.Object3D[] = [];
            const circleCenter = mousePlaneRef.current.position.clone();
            const radius = mousePlaneRef.current.scale.x;

            sceneRef.current.traverse((obj) => {
                if (!(obj.type === "Mesh") || !obj.userData.intersectable) return;

                const box = new THREE.Box3().setFromObject(obj);
                if (box.isEmpty()) {
                    return;
                }

                // Clamp circle center to the box (2D)
                const closestX = Math.max(box.min.x, Math.min(circleCenter.x, box.max.x));
                const closestZ = Math.max(box.min.z, Math.min(circleCenter.z, box.max.z));
                // Distance from circle center to closest point on box
                const dx = circleCenter.x - closestX;
                const dz = circleCenter.z - closestZ;

                if (dx * dx + dz * dz <= radius * radius) {
                    intersecting.push(obj);
                }
                return;
            });

            intersecting.forEach((c) => {
                postToWorker({
                    type: GameEngineActionTypes.DELETE_COIN,
                    payload: c.userData.coinId,
                });
            });
        },
        20,
        { maxWait: 20 },
    );

    const onMouseClickCallback = useDebounceCallback(
        (event: MouseEvent) => {
            if (!isRunningRef.current || !skillValuesRef.current?.["skill.mouse.enabled"]) {
                return;
            }

            // Direct click detection with raycaster
            // Convert mouse position to normalized device coordinates (-1 to +1)
            mouseRef.current.x = (event.offsetX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.offsetY / window.innerHeight) * 2 + 1;
            // Update the raycaster
            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
            // Check intersections with your model (or scene.children)
            const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true).map((i) => i.object);
            const filteredIntersects = intersects.filter((i) => i.userData.intersectable);
            if (filteredIntersects.length) {
                filteredIntersects.forEach((i) => {
                    postToWorker({
                        type: GameEngineActionTypes.DELETE_COIN,
                        payload: i.userData.coinId,
                    });
                });
            }
        },
        20,
        { maxWait: 20 },
    );

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Setup Scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    useEffect(() => {
        console.log("=> Setup Skybox");
        sceneRef.current.background = ResourcesMapping.skyboxes[skyboxes["sky01"].resourceRef];

        console.log("=> Setup Textures");

        console.log("=> Setup Models");
        // Nothing

        console.log("=> Setup Scene");
        const container = ref.current!;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const axisHelper = new THREE.AxesHelper(10);
        sceneRef.current.add(axisHelper);

        sceneRef.current.add(new THREE.AmbientLight(0xffffff, 1));
        [
            [-100, 2, -100],
            [100, 2, -100],
            [100, 2, 100],
            [-100, 2, 100],
            [0, 2, 0],
        ].forEach(([x, y, z]) => {
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(x, y, z);
            sceneRef.current.add(light);
        });
        // sceneRef.current.add(new THREE.DirectionalLight(0xffffff, 1));

        cameraRef.current = new THREE.PerspectiveCamera(90, container.clientWidth / container.clientHeight, 0.1, 10000);
        cameraRef.current.position.set(0, 20, 0);

        controlRef.current = new FreeLookControls(cameraRef.current);
        controlRef.current.toggle();

        function onResize() {
            renderer.setSize(container.clientWidth, container.clientHeight);
            cameraRef.current.updateProjectionMatrix();
        }
        window.addEventListener("resize", onResize);
        window.addEventListener("click", onMouseClickCallback);
        window.addEventListener("mousemove", onMouseMoveCallback);
        window.addEventListener("keydown", onKeyDownCallback);

        let mounted = true;
        const timer = new THREE.Timer();
        function animate() {
            if (!mounted) return;
            requestAnimationFrame(animate);
            timer.update();
            Object.values(coinsRef.current).forEach((coin) => {
                coin.rotation.y += 0.03;
            });
            controlRef.current?.update(timer.getDelta());
            renderer.render(sceneRef.current, cameraRef.current);
        }
        animate();

        return () => {
            console.log("=> Cleanup scene");
            mounted = false;
            coinsRef.current = {};
            window.removeEventListener("resize", onResize);
            window.removeEventListener("click", onMouseClickCallback);
            window.removeEventListener("keydown", onKeyDownCallback);
            window.removeEventListener("mousemove", onMouseMoveCallback);
            container.removeChild(renderer.domElement);
            renderer.dispose();
            sceneRef.current.clear();
        };
    }, []);

    return <div id="game-canvas" ref={ref} style={{ width: "100%", height: "100%" }} />;
}
