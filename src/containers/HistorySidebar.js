import {
    Box,
    Card,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import Cookies from 'universal-cookie';

import { drawerWidth } from '../utils/constants';


const cookies = new Cookies();


function HistorySidebar() 
{
    const [exerciseHistory, setExerciseHistory] = useState(cookies.get("exerciseHistory"));

    
    function deleteExercise(deletionIdx)
    {
        const newExerciseHistory = exerciseHistory.filter((exercise, idx) => idx !== deletionIdx);
        setExerciseHistory(newExerciseHistory);
        cookies.set("exerciseHistory", newExerciseHistory, { path: '/', expires:new Date(2100,12,12,12,12,12,12) });
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
                <Typography variant="h4">History</Typography>
                <List>
                    {(!exerciseHistory || !exerciseHistory.length) && <ListItem>Nothing here... yet.</ListItem>}
                    {exerciseHistory && exerciseHistory.length > 0 && exerciseHistory.map((exercise, idx) => (
                        <ListItem key={idx} sx={{flexDirection:"column"}}>
                            <Card sx={{padding:"1em", width:"100%"}}>
                                <ListItemText primary={exercise.chords.map(chord => chord.name + " ")}/>
                                <ListItemText primary={Math.round(exercise.sessionLength / 60) + " minutes"}/>
                                <ListItemText primary={exercise.chordCount + " chords"}/>
                                <ListItemText primary={(exercise.chordCount > 0 ? Math.round(exercise.correctChordCount / exercise.chordCount * 100) : '-') + "% accuracy"}/>
                                <ListItemButton onClick={() => deleteExercise(idx)}>Delete</ListItemButton>
                            </Card>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
};
export default HistorySidebar;
