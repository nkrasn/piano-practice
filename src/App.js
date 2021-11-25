import { CssBaseline, Grid, Paper, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useState } from 'react';
import Cookies from 'universal-cookie';

import ExerciseForm from './containers/ExerciseForm';
import Exercise from './containers/Exercise';
import HistorySidebar from './containers/HistorySidebar.js';

import './css/App.css';

const sessionStorage = window.sessionStorage;
const localStorage = window.localStorage;
(sessionStorage.getItem("chords") === null) && sessionStorage.setItem("chords", JSON.stringify([
    {name:"major", position:0},
    {name:"o7", position:4},
    {name:"minor", position:5},
    {name:"+", position:3}
]));
(sessionStorage.getItem("mode")            === null) && sessionStorage.setItem("mode", 1);
(sessionStorage.getItem("useInversions")   === null) && sessionStorage.setItem("useInversions", false);
(sessionStorage.getItem("inversions")      === null) && sessionStorage.setItem("inversions", JSON.stringify([1,2]));
(sessionStorage.getItem("tts")             === null) && sessionStorage.setItem("tts", true);
(sessionStorage.getItem("sessionLength")   === null) && sessionStorage.setItem("sessionLength", 600);
(localStorage.getItem("exerciseHistory") === null) && localStorage.setItem("exerciseHistory", JSON.stringify({ chordProgressions:[], randomized:[] }));

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