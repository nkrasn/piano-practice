// Actions
export const incrementChordCount = () => ({type:"exerciseProgress/incrementChordCount"});
export const incrementCorrectChordCount = () => ({type:"exerciseProgress/incrementCorrectChordCount"});
export const resetProgress = () => ({type:"exerciseProgress/resetProgress"});

// Selectors
export const selectChordCount = state => state.exerciseProgress.chordCount;
export const selectCorrectChordCount = state => state.exerciseProgress.correctChordCount;



// Reducer
export const initialState = {
    chordCount: 0,
    correctChordCount: 0,
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
        default:
            return exerciseProgress;
    }
}
export default exerciseProgressReducer;
