import { CssBaseline, Grid, Paper, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useState } from 'react';
import Cookies from 'universal-cookie';

import ExerciseForm from './containers/ExerciseForm';
import Exercise from './containers/Exercise';
import HistorySidebar from './containers/HistorySidebar.js';

import './css/App.css';

const cookies = new Cookies();
(cookies.get("chords") === undefined) && cookies.set("chords", [
    {name:"major", position:0},
    {name:"o7", position:4},
    {name:"minor", position:5},
    {name:"+", position:3}
], { path: '/' });
(cookies.get("mode")            === undefined) && cookies.set("mode", 1, { path: '/' });
(cookies.get("useInversions")   === undefined) && cookies.set("useInversions", false, { path: '/' });
(cookies.get("inversions")      === undefined) && cookies.set("inversions", [1,2], { path: '/' });
(cookies.get("tts")             === undefined) && cookies.set("tts", true, { path: '/' });
(cookies.get("sessionLength")   === undefined) && cookies.set("sessionLength", 600, { path: '/' });
(cookies.get("exerciseHistory") === undefined) && cookies.set("exerciseHistory", {chordProgressions:[], randomized:[]}, { path: '/', expires:new Date(2100,12,12,12,12,12,12) });

const theme = createTheme({
    palette: {
        mode: 'dark'
    }
});

function App()
{
    const [inGame, setInGame] = useState(false);

    return (
        <ThemeProvider theme={theme}>
            <Paper square style={{ height: "100vh", display: "flex" }}>
                <CssBaseline/>
                
                {!navigator.requestMIDIAccess && (
                    <Paper square style={{ height:"100vh", width:"100vw", display:"flex", margin:"auto" }}>
                        <Grid 
                            container 
                            alignItems="center"
                            justifyContent="center"
                            direction="column"
                        >
                            <Grid item>
                                <Typography variant="h3" align="center">MIDI input not supported<br/>(try Chrome if you're not using it)</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {navigator.requestMIDIAccess && (
                    <>
                        {!inGame && <><HistorySidebar/><ExerciseForm setInGame={setInGame}/></>}
                        {inGame && <Exercise setInGame={setInGame}/>}
                    </>
                )}

            </Paper>
        </ThemeProvider>
    )
}

export default App;