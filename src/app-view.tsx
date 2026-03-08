import { Provider } from "react-redux";

import Game from "./game-view";
import store from "./store/store";

export default function App() {
    return (
        <Provider store={store}>
            <Game />
        </Provider>
    );
}
