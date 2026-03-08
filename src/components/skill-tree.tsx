import React, { useContext, useMemo } from "react";

import { GameEngineActionTypes, type Skill } from "../game/types";
import { useAppDispatch, useAppSelector } from "../store";
import { selectCurrentMoney, selectShowSkillTree, selectSkillTree } from "../store/game-slice";

import "./skill-tree.css";
import { createWorkerSendAction } from "../store/worker-middleware";

type TreeNode = {
    skill: Skill;
    children?: Array<TreeNode>;
};

export type TreeViewState = {
    curMoney: number;
    onActivateSkill: (sk: Skill["id"]) => void;
};

export const TreeViewContext = React.createContext<TreeViewState>({
    curMoney: 0,
    onActivateSkill: (sk) => {
        console.warn("No implementation for onActivateSkill :", sk);
    },
});

export default function SkillTree() {
    const dispatch = useAppDispatch();
    const skillTree = useAppSelector(selectSkillTree);
    const curMoney = useAppSelector(selectCurrentMoney);
    const show = useAppSelector(selectShowSkillTree);

    const onActivateSkill = (id: Skill["id"]) => {
        dispatch(createWorkerSendAction({ type: GameEngineActionTypes.ACTIVATE_SKILL, payload: id }));
    };

    const treeData = useMemo(() => {
        const addNodes = (sks: Array<Skill>): Array<TreeNode> => {
            return sks.map((sk) => {
                const node: TreeNode = {
                    skill: sk,
                };
                if (sk.activated) {
                    node.children = addNodes(sk.children ?? []);
                }
                return node;
            });
        };
        return addNodes(skillTree ?? []);
    }, [skillTree]);

    return (
        show && (
            <div className="tree-view-wrapper">
                <div className="tree-view">
                    <TreeViewContext.Provider value={{ curMoney, onActivateSkill }}>
                        {treeData.map((n) => (
                            <TreeNode key={n.skill.id} node={n} />
                        ))}
                    </TreeViewContext.Provider>
                </div>
            </div>
        )
    );
}

type TreeNodeProps = {
    node: TreeNode;
    depth?: number;
};

function TreeNode({ node, depth = 0 }: TreeNodeProps) {
    const treeViewContext = useContext(TreeViewContext);
    const sk = node.skill;

    const maxUpgrades = sk.upgrades?.length ?? 0;
    const [, curUpgradeIndex, nextUpgrade] = (sk.upgrades ?? []).reduce(
        (acc, s, i) => {
            return [s.activated ? s : acc[0], s.activated ? i + 1 : acc[1], acc[2] ?? (!s.activated ? s : acc[2])];
        },
        [null, 0, null],
    );
    const isActivated = sk.activated;
    const isFullyUpgraded = isActivated && (!maxUpgrades || !nextUpgrade);
    const nextCost: number = isActivated ? (nextUpgrade?.cost ?? 0) : sk.cost;
    const isAffordable = nextCost <= treeViewContext.curMoney;

    const label = [sk.name, maxUpgrades ? `${curUpgradeIndex}/${maxUpgrades}` : "", nextUpgrade ? `($${nextUpgrade.cost})` : ""].join(" ");

    const colors = isFullyUpgraded ? ["#ffff00", "#ffff0055"] : isAffordable ? ["#00ff00", "#00ff0055"] : ["#ff0000", "#ff000055"];

    return (
        <div className="tree-node" data-depth={depth}>
            <div className="tree-node-title">
                <label style={{ color: colors[0] }}>{label}</label>
                {!isActivated || nextUpgrade ? (
                    <button
                        type="button"
                        className={isAffordable ? "affordable" : "not-affordable"}
                        onClick={() => {
                            if (nextUpgrade) {
                                treeViewContext.onActivateSkill(nextUpgrade.id);
                            } else {
                                treeViewContext.onActivateSkill(node.skill.id);
                            }
                        }}
                    >
                        BUY ${nextUpgrade?.cost || nextCost}
                    </button>
                ) : null}
            </div>
            {node.children?.length ? (
                <div className="tree-node-content">
                    {node.children.map((n) => (
                        <TreeNode key={n.skill.id} node={n} depth={depth + 1} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
