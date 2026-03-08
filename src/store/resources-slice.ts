import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import * as THREE from 'three';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { BasicLoadStates } from '../types';

import type { AppDispatch, RootState } from './store';

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Loaded data (non-serializable) is stored in this record, the redux slice only stores references
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ResourcesMapping = {
    textures: {},
    models: {},
    skyboxes: {},
} as {
    textures: Record<string, THREE.Texture<HTMLImageElement> | null>;
    models: Record<string, GLTF | null>;
    skyboxes: Record<string, THREE.CubeTexture | null>;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Slice
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type ResourceReference = {
    state: BasicLoadStates;
    url: string;
    resourceRef?: string;
    error?: string;
};
type ResourceReferenceLoad<T extends keyof typeof ResourcesMapping> = Pick<ResourceReference, 'state' | 'url' | 'error'> & {
    data: (typeof ResourcesMapping)[T][string];
};

export type ResourcesState = {
    textures: Record<string, ResourceReference>;
    models: Record<string, ResourceReference>;
    skyboxes: Record<string, ResourceReference>;
};

const initialState: ResourcesState = {
    textures: {},
    models: {},
    skyboxes: {},
};

export const resourceSlice = createSlice({
    name: 'resources',
    initialState,
    reducers: {
        clearAllResources: (state) => {
            state.models = {};
            state.textures = {};
            state.skyboxes = {};
            ResourcesMapping.models = {};
            ResourcesMapping.textures = {};
            ResourcesMapping.skyboxes = {};
        },
        setTextures: (state, action: PayloadAction<Array<{ name: string; data: ResourceReference }>>) => {
            state.textures = {
                ...state.textures,
                ...action.payload.reduce((acc, { name, data }) => ({ ...acc, [name]: data }), {}),
            };
        },
        setModels: (state, action: PayloadAction<Array<{ name: string; data: ResourceReference }>>) => {
            state.models = {
                ...state.models,
                ...action.payload.reduce((acc, { name, data }) => ({ ...acc, [name]: data }), {}),
            };
        },
        setSkyboxes: (state, action: PayloadAction<Array<{ name: string; data: ResourceReference }>>) => {
            state.skyboxes = {
                ...state.skyboxes,
                ...action.payload.reduce((acc, { name, data }) => ({ ...acc, [name]: data }), {}),
            };
        },
    },
    selectors: {
        selectGetTextures: (state) => state.textures,
        selectGetModels: (state) => state.models,
        selectGetSkyboxes: (state) => state.skyboxes,
        isLoadingTextures: (state) => !!Object.values(state?.textures ?? {}).find((t) => t.state === BasicLoadStates.LOADING),
        isLoadingModels: (state) => !!Object.values(state?.models ?? {}).find((t) => t.state === BasicLoadStates.LOADING),
        isLoadingSkyboxes: (state) => !!Object.values(state?.skyboxes ?? {}).find((t) => t.state === BasicLoadStates.LOADING),
    },
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exports
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const { clearAllResources, setModels, setTextures, setSkyboxes } = resourceSlice.actions;
export const { isLoadingModels, isLoadingTextures, isLoadingSkyboxes } = resourceSlice.selectors;
export default resourceSlice.reducer;

export const selectGetTextures = createSelector(
    (state: RootState) => state?.resources,
    (resources) => resources?.textures ?? null,
);

export const selectGetModels = createSelector(
    (state: RootState) => state?.resources,
    (resources) => resources?.models ?? null,
);

export const selectGetSkyboxes = createSelector(
    (state: RootState) => state?.resources,
    (resources) => resources?.skyboxes ?? null,
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Async Actions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const textureLoader = new THREE.TextureLoader();
export const loadTexturesAsync = (textures: Array<{ name: string; url: string }>) => (dispatch: AppDispatch) => {
    dispatch(
        setTextures(textures.map(({ name, url }) => ({ name, data: { url, state: BasicLoadStates.LOADING } as ResourceReferenceLoad<'textures'> }))),
    );
    Promise.all(
        textures.map(({ name, url }) =>
            textureLoader
                .loadAsync(url)
                .then((res) => ({ name, data: { url, data: res, state: BasicLoadStates.LOADED } as ResourceReferenceLoad<'textures'> }))
                .catch((error) => ({ name, data: { url, state: BasicLoadStates.ERROR, error } as ResourceReferenceLoad<'textures'> })),
        ),
    ).then((results) => {
        const reduxResults: { name: string; data: ResourceReference }[] = [];
        results.forEach((r) => {
            const rr: ResourceReference = {
                state: r.data.state,
                url: r.data.url,
                error: 'Error loading : ' + r.name,
            };
            if (r.data.state === BasicLoadStates.LOADED) {
                const uuid = crypto.randomUUID();
                rr.resourceRef = uuid;
                ResourcesMapping.textures[uuid] = r.data.data;
            }
            reduxResults.push({ name: r.name, data: rr });
        });
        dispatch(setTextures(reduxResults));
    });
};

export const loadSkyboxesAsync = (skyboxes: Array<{ name: string; url: string }>) => (dispatch: AppDispatch) => {
    dispatch(
        setSkyboxes(skyboxes.map(({ name, url }) => ({ name, data: { url, state: BasicLoadStates.LOADING } as ResourceReferenceLoad<'skyboxes'> }))),
    );
    Promise.all(
        skyboxes.map(({ name, url }) =>
            new THREE.CubeTextureLoader()
                .setPath(`${url}/`)
                .loadAsync(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
                .then((res) => ({ name, data: { url, data: res, state: BasicLoadStates.LOADED } as ResourceReferenceLoad<'skyboxes'> }))
                .catch((error) => ({ name, data: { url, state: BasicLoadStates.ERROR, error } as ResourceReferenceLoad<'skyboxes'> })),
        ),
    ).then((results) => {
        const reduxResults: { name: string; data: ResourceReference }[] = [];
        results.forEach((r) => {
            const rr: ResourceReference = {
                state: r.data.state,
                url: r.data.url,
                error: 'Error loading : ' + r.name,
            };
            if (r.data.state === BasicLoadStates.LOADED) {
                const uuid = crypto.randomUUID();
                rr.resourceRef = uuid;
                ResourcesMapping.skyboxes[uuid] = r.data.data;
            }
            reduxResults.push({ name: r.name, data: rr });
        });
        dispatch(setSkyboxes(reduxResults));
    });
};

const modelLoader = new GLTFLoader();
export const loadModelsAsync = (models: Array<{ name: string; url: string }>) => (dispatch: AppDispatch) => {
    dispatch(
        setModels(
            models.map(({ name, url }) => ({ name, data: { url, data: null, state: BasicLoadStates.LOADING } as ResourceReferenceLoad<'models'> })),
        ),
    );
    Promise.all(
        models.map(({ name, url }) =>
            modelLoader
                .loadAsync(url)
                .then((res) => ({ name, data: { url, data: res, state: BasicLoadStates.LOADED } as ResourceReferenceLoad<'models'> }))
                .catch((error) => ({ name, data: { url, data: null, state: BasicLoadStates.ERROR, error } as ResourceReferenceLoad<'models'> })),
        ),
    ).then((results) => {
        const reduxResults: { name: string; data: ResourceReference }[] = [];
        results.forEach((r) => {
            const rr: ResourceReference = {
                state: r.data.state,
                url: r.data.url,
                error: r.data.error,
            };
            if (r.data.state === BasicLoadStates.LOADED) {
                const uuid = crypto.randomUUID();
                rr.resourceRef = uuid;
                ResourcesMapping.models[uuid] = r.data.data;
            }
            reduxResults.push({ name: r.name, data: rr });
        });
        dispatch(setModels(reduxResults));
    });
};
