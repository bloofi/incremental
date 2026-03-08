import {
    faArrowCircleDown,
    faArrowCircleLeft,
    faArrowCircleRight,
    faArrowCircleUp,
    faChartDiagram,
    faCoins,
    faSackDollar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";

import { GameCoinTypes } from "../game/types";
import { useAppSelector } from "../store";
import { selectCoins, selectCurrentMoney, selectIsRunning, selectSkillValues } from "../store/game-slice";
import { kmgt } from "../utils/helpers";

export default function GameOverlay() {
    const currentMoney = useAppSelector(selectCurrentMoney);
    const coins = useAppSelector(selectCoins);
    const isRunning = useAppSelector(selectIsRunning);
    const skillValues = useAppSelector(selectSkillValues);

    const displayedMoney = useMemo(() => {
        const kmgtMoney = kmgt(currentMoney);
        return `${kmgtMoney[0]} ${kmgtMoney[1]}`;
    }, [currentMoney]);

    const gctColors = useMemo(
        () => ({
            [GameCoinTypes.BRONZE]: "#581900",
            [GameCoinTypes.SILVER]: "#465768",
            [GameCoinTypes.GOLD]: "#6b5415",
            [GameCoinTypes.DIAMOND]: "#00ffff",
        }),
        [],
    );
    const displayedCoins = useMemo<Record<GameCoinTypes, [string, string]>>(() => {
        return Object.values(GameCoinTypes).reduce(
            (acc, ct) => {
                const kmgtCoins = kmgt(Object.values(coins ?? {}).filter((c) => c.type === ct).length);
                return {
                    ...acc,
                    [ct]: [`${kmgtCoins[0]} ${kmgtCoins[1]}`, gctColors[ct]],
                };
            },
            {} as Record<GameCoinTypes, [string, string]>,
        );
    }, [gctColors, coins]);

    return (
        <div id="game-overlay" style={{ width: "100%", height: "100%" }}>
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    color: "white",
                    fontSize: "3em",
                    display: "flex",
                    gap: "0.5rem",
                    flexDirection: "column",
                    pointerEvents: "none",
                }}
            >
                <span style={{ display: "flex", alignItems: "center", color: "#55ff55dd" }}>
                    <FontAwesomeIcon icon={faSackDollar} />
                    {displayedMoney}
                </span>
                {Object.entries(displayedCoins).map(([gct, [val, color]]) => (
                    <span key={gct} style={{ display: "flex", alignItems: "center", color }}>
                        <FontAwesomeIcon icon={faCoins} />
                        {val}
                    </span>
                ))}
            </div>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 10,
                    color: "white",
                    fontSize: "3em",
                    display: "flex",
                    flexDirection: "column",
                    pointerEvents: "none",
                }}
            >
                <span>{isRunning ? "▶" : "⏯"}</span>
            </div>
            <div
                style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    left: 10,
                    color: "#ffffffbb",
                    fontSize: "3em",
                    display: "flex",
                    fontFamily: "Black Side",
                    pointerEvents: "none",
                }}
            >
                <div>
                    <FontAwesomeIcon icon={faChartDiagram} />
                    [Space]
                </div>
            </div>

            {skillValues?.["skill.move.horizontal.enabled"] && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        right: 10,
                        left: 10,
                        color: "#ffffffaa",
                        fontSize: "3em",
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "Black Side",
                        pointerEvents: "none",
                    }}
                >
                    <div>
                        <FontAwesomeIcon icon={faArrowCircleLeft} />
                        [Q]
                    </div>
                    <div>
                        [D]
                        <FontAwesomeIcon icon={faArrowCircleRight} />
                    </div>
                </div>
            )}
            {skillValues?.["skill.move.vertical.enabled"] && (
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        bottom: 10,
                        left: "50%",
                        color: "#ffffffaa",
                        fontSize: "3em",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        fontFamily: "Black Side",
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <FontAwesomeIcon icon={faArrowCircleUp} />
                        [Z]
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <FontAwesomeIcon icon={faArrowCircleDown} />
                        [S]
                    </div>
                </div>
            )}
        </div>
    );
}
