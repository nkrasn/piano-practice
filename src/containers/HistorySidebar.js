import {
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { drawerWidth } from '../utils/constants';

import ExerciseHistoryIndex from '../components/ExerciseHistoryIndex';
import ExerciseHistoryDetails from '../components/ExerciseHistoryDetails';

const localStorage = window.localStorage;

function HistorySidebar() 
{
    const [exerciseHistory, setExerciseHistory] = useState(JSON.parse(localStorage.getItem("exerciseHistory")));
    const [viewingDetails, setViewingDetails] = useState(false);
    const [chordsToView, setChordsToView] = useState(undefined);
    const [chordsToViewAreChordProgression, setChordsToViewAreChordProgression] = useState(false);
    
    function viewExerciseDetails(chords, isChordProgression)
    {
        setChordsToView(chords);
        setChordsToViewAreChordProgression(isChordProgression);
        setViewingDetails(true);
    }

    function viewAllExercises()
    {
        setViewingDetails(false);
    }

    function deleteExercise(exerciseDate)
    {
        let newExerciseHistory = {...exerciseHistory};
        newExerciseHistory.chordProgressions = newExerciseHistory.chordProgressions.filter(exercise => exercise.date !== exerciseDate);
        newExerciseHistory.randomized = newExerciseHistory.randomized.filter(exercise => exercise.date !== exerciseDate);
        setExerciseHistory(newExerciseHistory);
        localStorage.setItem("exerciseHistory", JSON.stringify(newExerciseHistory));
    }


    return (
        <Drawer 
            variant="permanent" 
            sx={{
                display: "block",
                "& .MuiDrawer-paper": { boxSizing: "border-box", width:drawerWidth }
            }}
            open
        >
            <Box sx={{padding: "1em"}}>
                <List>
                    <ListItem>
                        {viewingDetails && <IconButton sx={{marginRight:"0.5em"}} onClick={viewAllExercises}><ArrowBack/></IconButton>}
                        <Typography variant="h5">History</Typography>
                    </ListItem>

                    {viewingDetails && <ExerciseHistoryDetails 
                        exercises={chordsToViewAreChordProgression ? exerciseHistory.chordProgressions : exerciseHistory.randomized}
                        chords={chordsToView} 
                        isChordProgression={chordsToViewAreChordProgression}
                        onClickDelete={deleteExercise}
                    />}
                    {!viewingDetails && <ExerciseHistoryIndex exerciseHistory={exerciseHistory} onExerciseClick={viewExerciseDetails}/>}
                </List>
            </Box>
        </Drawer>
    );
};
export default HistorySidebar;
