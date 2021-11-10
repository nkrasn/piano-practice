import { combineReducers, createStore } from 'redux';

import exerciseProgressReducer from './exerciseProgress';

const store = createStore(combineReducers({
    exerciseProgress: exerciseProgressReducer,
}));

export default store;
