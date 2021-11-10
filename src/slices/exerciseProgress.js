// Actions
export const incrementChordCount = () => ({type:"exerciseProgress/incrementChordCount"});
export const incrementCorrectChordCount = () => ({type:"exerciseProgress/incrementCorrectChordCount"});
export const resetProgress = () => ({type:"exerciseProgress/resetProgress"});
export const setInGame = val => ({type:"exerciseProgress/setInGame", payload:val});

// Selectors
export const selectChordCount = state => state.exerciseProgress.chordCount;
export const selectCorrectChordCount = state => state.exerciseProgress.correctChordCount;
export const selectInGame = state => state.exerciseProgress.inGame;



// Reducer
export const initialState = {
    chordCount: 0,
    correctChordCount: 0,
    inGame: false,
};
function exerciseProgressReducer(exerciseProgress=initialState, action) {
    switch(action.type)
    {
        case 'exerciseProgress/incrementChordCount':
            return {...exerciseProgress, chordCount:exerciseProgress.chordCount + 1};
        case 'exerciseProgress/incrementCorrectChordCount':
            return {...exerciseProgress, correctChordCount:exerciseProgress.correctChordCount + 1};
        case 'exerciseProgress/resetProgress':
            return initialState;
        case 'exerciseProgress/setInGame':
            return {...exerciseProgress, inGame:action.payload};
        default:
            return exerciseProgress;
    }
}
export default exerciseProgressReducer;
