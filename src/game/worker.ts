import GameEngine from './engine';
import { type GameEngineAction, GameEngineActionTypes, GameEngineEventTypes } from './types';

const engine = new GameEngine((event) => {
    console.log('W<', `[${GameEngineEventTypes[event.type]}]`, event.payload);
    self.postMessage(event);
});

self.addEventListener('message', <T extends GameEngineActionTypes>({ data }: MessageEvent<GameEngineAction<T>>) => {
    console.log('W>', `[${GameEngineActionTypes[data.type]}]`, data);

    switch (data.type) {
        case GameEngineActionTypes.RESET: {
            engine.reset();
            break;
        }
        case GameEngineActionTypes.START: {
            engine.start();
            break;
        }
        case GameEngineActionTypes.STOP: {
            engine.stop();
            break;
        }
        case GameEngineActionTypes.DESTROY: {
            engine.stop();
            break;
        }
        case GameEngineActionTypes.UPDATE_OPTIONS: {
            engine.updateOptions(data.payload);
            break;
        }
        case GameEngineActionTypes.DELETE_COIN: {
            engine.deleteCoin(data.payload);
            break;
        }
        case GameEngineActionTypes.DELETE_ALL_COINS: {
            engine.deleteAllCoins();
            break;
        }
        case GameEngineActionTypes.ACTIVATE_SKILL: {
            engine.activateSkill(data.payload);
            break;
        }
    }
});
