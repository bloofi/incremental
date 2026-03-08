import * as THREE from "three";

export type FreeLookControlsOptions = {
    horizontalPanEnabled?: boolean;
    verticalPanEnabled?: boolean;
    horizontalSpeed?: number;
    verticalSpeed?: number;
    pitchMin?: number;
    pitchMax?: number;
    keyMap?: Record<string, FreeLookActions>;
};

enum FreeLookActions {
    LOOK_LEFT = 1 << 0,
    LOOK_RIGHT = 1 << 1,
    LOOK_UP = 1 << 2,
    LOOK_DOWN = 1 << 3,
}

const DefaultKeyMapping: FreeLookControlsOptions["keyMap"] = {
    KeyA: FreeLookActions.LOOK_LEFT, // Q
    KeyD: FreeLookActions.LOOK_RIGHT, // D
    KeyW: FreeLookActions.LOOK_UP, // Z
    KeyS: FreeLookActions.LOOK_DOWN, // S
};

export const defaultOptions: FreeLookControlsOptions = {
    horizontalPanEnabled: false,
    verticalPanEnabled: false,
    horizontalSpeed: 0,
    verticalSpeed: 0,
    pitchMin: Math.PI / 4 - 0.01,
    pitchMax: Math.PI / 4 - 0.01,
};

//  https://github.com/isRyven/SpectatorControls/blob/master/SpectatorControls.js
export default class FreeLookControls {
    private camera: THREE.Camera;
    private element: HTMLElement;
    private enabled: boolean;
    private _options: FreeLookControlsOptions;
    private keyMap: FreeLookControlsOptions["keyMap"];
    private keyState: {
        press: number;
        prevPress: number;
    };
    private yaw: number = 0;
    private pitch: number = 0;

    constructor(camera: THREE.Camera, element: HTMLElement = document.documentElement, options: FreeLookControlsOptions = {}) {
        this.camera = camera;
        this.element = element;
        this.enabled = false;
        this._options = {
            ...defaultOptions,
            ...(options ?? {}),
        };
        this.keyState = { press: 0, prevPress: 0 };
        this.keyMap = { ...DefaultKeyMapping, ...(options?.keyMap ?? {}) };
    }

    private onKeyEvent(event: KeyboardEvent) {
        const key = event.code;
        const isPressed = event.type === "keydown";
        const { press } = this.keyState;
        let newPress = press;
        switch (this.keyMap[key]) {
            case FreeLookActions.LOOK_LEFT:
            case FreeLookActions.LOOK_RIGHT:
            case FreeLookActions.LOOK_DOWN:
            case FreeLookActions.LOOK_UP:
                if (isPressed) {
                    newPress |= this.keyMap[key];
                } else {
                    newPress &= ~this.keyMap[key];
                }
                break;
            default:
                break;
        }
        this.keyState.press = newPress;
    }

    public enable(): void {
        this.element.addEventListener("keydown", this.onKeyEvent.bind(this));
        this.element.addEventListener("keyup", this.onKeyEvent.bind(this));
        this.enabled = true;
        this.keyState.press = 0;
        this.keyState.prevPress = 0;
        console.log("CONTROLS ENABLED");
    }

    public disable(): void {
        this.element.removeEventListener("keydown", this.onKeyEvent);
        this.element.removeEventListener("keyup", this.onKeyEvent);
        this.enabled = false;
        console.log("CONTROLS DISABLED");
    }

    public toggle(): void {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    public setOptions(options: FreeLookControlsOptions): void {
        this._options = {
            ...this._options,
            ...(options ?? {}),
        };
    }

    public update(delta = 1): void {
        if (!this.enabled) {
            return;
        }

        const actualHSpeed = delta * this._options.horizontalSpeed;
        const actualVSpeed = delta * this._options.verticalSpeed;

        const { press } = this.keyState;
        if (this._options.horizontalPanEnabled && press & FreeLookActions.LOOK_LEFT) {
            this.yaw += actualHSpeed;
        }
        if (this._options.horizontalPanEnabled && press & FreeLookActions.LOOK_RIGHT) {
            this.yaw -= actualHSpeed;
        }
        if (this._options.verticalPanEnabled && press & FreeLookActions.LOOK_UP) {
            this.pitch += actualVSpeed;
        }
        if (this._options.verticalPanEnabled && press & FreeLookActions.LOOK_DOWN) {
            this.pitch -= actualVSpeed;
        }

        this.pitch = Math.max(-this._options.pitchMin, Math.min(this._options.pitchMax, this.pitch));

        // Create yaw quaternion (WORLD Y axis)
        const yawQuat = new THREE.Quaternion();
        yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        // Create pitch quaternion (LOCAL X axis)
        const pitchQuat = new THREE.Quaternion();
        pitchQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
        // Combine them: yaw first, then pitch
        this.camera.quaternion.copy(yawQuat).multiply(pitchQuat);

        this.keyState.prevPress = press;
    }
}
