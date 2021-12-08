import { 
    Box,
    Button,
    Container,
    Divider,
    FormControlLabel,
    FormGroup,
    ImageList,
    ImageListItem,
    Tabs,
    Tab,
    Typography,
    Slider,
    Switch,
    Backdrop,
    Checkbox,
    Tooltip,
} from "@mui/material";
import { useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import * as Tone from 'tone';

import { resetProgress } from "../slices/exerciseProgress";
import { chordDefinitions, drawerWidth, nashvilleNumerals } from '../utils/constants';
import ChordButton from "../components/ChordButton";
import Piano from "../components/Piano";
import { HelpOutline } from "@mui/icons-material";


const sessionStorage = window.sessionStorage;


function ExerciseForm({setInGame}) 
{
    const [selectedPosition, setSelectedPosition] = useState(0);
    const [hoveredChord, setHoveredChord] = useState();
    const [countdownStarted, setCountdownStarted] = useState(false);
    const [countdown, _setCountdown] = useState(3);
    const countdownRef = useRef(countdown);
    const setCountdown = val => {
        countdownRef.current = val;
        _setCountdown(val);
    }

    const [chords, _setChords]                  = useState(JSON.parse(sessionStorage.getItem("chords")));
    const [mode, _setMode]                      = useState(parseInt(sessionStorage.getItem("mode")));
    const [useInversions, _setUseInversions]    = useState(sessionStorage.getItem("useInversions") === "true");
    const [inversions, _setInversions]          = useState(JSON.parse(sessionStorage.getItem("inversions")));
    const [tts, _setTTS]                        = useState(sessionStorage.getItem("tts") === "true");
    const [sessionLength, _setSessionLength]    = useState(parseInt(sessionStorage.getItem("sessionLength")));
    const setChords         = val => { sessionStorage.setItem("chords",     JSON.stringify(val)); _setChords(val); }
    const setMode           = val => { sessionStorage.setItem("mode",                       val); _setMode(parseInt(val)); }
    const setUseInversions  = val => { sessionStorage.setItem("useInversions",              val); _setUseInversions(val); }
    const setInversions     = val => { sessionStorage.setItem("inversions", JSON.stringify(val)); _setInversions(val); }
    const setTTS            = val => { sessionStorage.setItem("tts",                        val); _setTTS(val); }
    const setSessionLength  = val => { sessionStorage.setItem("sessionLength",              val); _setSessionLength(parseInt(val)); }

    const dispatch = useDispatch();

    const chordsToSet = () => new Set(chords.map(chord => chord.name));


    function handleClickChord(event) 
    {
        if(mode === 0)
        {
            setChords([...chords, { name:event.currentTarget.value, position:selectedPosition }]);
        }
        else if(!chordsToSet().has(event.currentTarget.value))
        {
            setChords([
                ...chords, { 
                    name:event.currentTarget.value, 
                    position:Math.floor(Math.random() * 7) 
                }
            ]);
        }
    }

    function handleClickStartExercise(event)
    {
        setCountdownStarted(true);
        dispatch(resetProgress());
        const countdownInterval = setInterval(() => {
            if(countdownRef.current === 1)
            {
                Tone.start();
                setInGame(true);
                clearInterval(countdownInterval);
            }
            else
            {
                setCountdown(countdownRef.current - 1);
            }
        }, 1000);
    }

    function handleChangePosition(event, newValue) 
    {
        setSelectedPosition(newValue);
    }

    function handleChangeMode(event, newValue) 
    {
        setMode(newValue);
    }

    function handleChangeInversion(event) 
    {
        const targetCheckbox = parseInt(event.currentTarget.value);
        if(event.currentTarget.checked)
        {
            setInversions([...inversions, targetCheckbox]);
        }
        else
        {
            setInversions(inversions.filter(val => val !== targetCheckbox));
        }
    }

    function handleChangeUseInversions(event, newValue)
    {
        setUseInversions(newValue);
    }

    function handleChangeTTS(event, newValue) 
    {
        setTTS(newValue);
    }

    function handleChangeSessionLength(event, newValue) 
    {
        setSessionLength(newValue * 60);
    }
    
    function handleMouseOverChord(event)
    {
        setHoveredChord(event.currentTarget.value);
    }

    function handleMouseLeaveChord(event)
    {
        setHoveredChord();
    }


    function removeChordAt(idx)
    {
        let newChords = [...chords];
        console.log("chords:",chords);
        console.log("newChords:",newChords);
        newChords.splice(idx, 1);
        console.log("spliced:",newChords);
        setChords(newChords);
    }


    return (
        <FormGroup>
            <Box sx={{flexGrow:1, marginLeft:drawerWidth, padding:"2em"}}>
                {/* Chosen chords display */}
                <Box sx={{ 
                        display:"flex", 
                        gap:"3em", 
                        height:"4em", 
                        width:`calc(100vw - ${drawerWidth} - ${drawerWidth})`,
                        minWidth: 832,
                        overflowX:"auto",
                    }}
                >
                    {Object.keys(chords).length === 0 && <Typography variant="h5">No chords selected...</Typography>}
                    {mode === 0 && chords.map((chord, idx) => {
                        return <ChordButton 
                            key={idx} 
                            idx={idx}
                            chordName={chord.name} 
                            position={chord.position} 
                            onMouseOver={handleMouseOverChord}
                            onMouseLeave={handleMouseLeaveChord}
                            onClick={() => removeChordAt(idx)}
                            tooltip="Delete"
                            nashville
                        />;
                    })}
                    {mode === 1 && [...chordsToSet()].map((chordName, idx) => {
                        return <ChordButton
                            key={idx}
                            idx={idx}
                            chordName={chordName}
                            onMouseOver={handleMouseOverChord}
                            onMouseLeave={handleMouseLeaveChord}
                            onClick={() => removeChordAt(idx)}
                            tooltip="Delete"
                        />;
                    })}
                </Box>
                <Divider sx={{"marginBottom":"1em"}}/>
                {/* Mode (chord progresssion/randomized) */}
                <Tabs value={mode} onChange={handleChangeMode}>
                    <Tab label="Chord Progression"/>
                    <Tab label="Randomized"/>
                </Tabs>
                {/* Position selector */}
                {mode === 0 && (
                    <Tabs value={selectedPosition} onChange={handleChangePosition}>
                        {nashvilleNumerals.map((val,idx) => <Tab key={idx} label={val} disabled={mode === 1}/>)}
                    </Tabs>
                )}
                {/* Chord selector */}
                <Box sx={{display:"flex", flexDirection:"row", gap:"2em", alignItems:"center"}}>
                    <ImageList sx={{ minWidth: 400 }} cols={4}>
                        {Object.keys(chordDefinitions).map((chord,idx) => (
                            <ImageListItem key={idx}>
                                <Button 
                                    sx={{textTransform:"none"}} 
                                    onMouseOver={handleMouseOverChord} 
                                    onMouseLeave={handleMouseLeaveChord}
                                    onClick={handleClickChord} 
                                    value={chord}
                                >
                                    {chord}
                                </Button>
                            </ImageListItem>
                        ))}
                    </ImageList>
                    <Container align="center" sx={{ minWidth: 400 }}>
                        <Typography variant="h5" sx={{marginBottom:"0.2em", opacity:(hoveredChord ? 1 : 0)}}>{hoveredChord ? chordDefinitions[hoveredChord].longName : "."}</Typography>
                        <Piano pressedKeys={hoveredChord && chordDefinitions[hoveredChord].notes}/>
                    </Container>
                </Box>
                <Divider/>
                {/* Inversions */}
                <Box sx={{display:mode === 0 ? "none" : "block"}}>
                    <FormControlLabel control={<Switch checked={useInversions} onChange={handleChangeUseInversions} />} label="Practice inversions"/>
                    <Box sx={{display:"flex", flexDirection:"column", marginLeft:"2em", marginBottom:"1em"}}>
                        <FormControlLabel control={<Checkbox value={0} disabled={!useInversions || mode === 0} checked={inversions.indexOf(0) !== -1} onChange={handleChangeInversion}/>} label="Root position"/>
                        <FormControlLabel control={<Checkbox value={1} disabled={!useInversions || mode === 0} checked={inversions.indexOf(1) !== -1} onChange={handleChangeInversion}/>} label="First inversion"/>
                        <FormControlLabel control={<Checkbox value={2} disabled={!useInversions || mode === 0} checked={inversions.indexOf(2) !== -1} onChange={handleChangeInversion}/>} label="Second inversion"/>
                        <FormControlLabel control={<Checkbox value={3} disabled={!useInversions || mode === 0} checked={inversions.indexOf(3) !== -1} onChange={handleChangeInversion}/>} label="Third inversion"/>
                    </Box>
                </Box>
                <Box sx={{display:"flex", flexDirection:"row", margin:"1em 0", alignItems:"center"}}>
                    {/* TTS */}
                    <FormControlLabel control={<Switch checked={tts} onChange={handleChangeTTS}/>} label="TTS"/>
                    <Tooltip title="At the start of a prompt, hear what chord you have to play."><HelpOutline/></Tooltip>
                    {/* Session length */}
                    <Slider 
                        sx={{marginTop:"2em", marginLeft:"5em", width:"500px", display:"block"}}
                        value={sessionLength / 60}
                        step={5}
                        marks
                        min={5}
                        max={30}
                        valueLabelDisplay="on"
                        valueLabelFormat={x => `${x} minute session`}
                        onChange={handleChangeSessionLength}
                    />
                </Box>
                <Button 
                    variant="contained"
                    onClick={handleClickStartExercise}
                    disabled={chords.length === 0}
                >
                    Start Exercise
                </Button>
                {(!process.env.NODE_ENV || process.env.NODE_ENV === "development") && (
                    <Button
                        onClick={() => { sessionStorage.setItem("sessionLength", sessionLength/60); handleClickStartExercise(); }}
                        disabled={chords.length === 0}
                    >
                        Start Exercise (seconds)
                    </Button>
                )}
            </Box>
            <Backdrop
                open={countdownStarted}
                sx={{display:"flex", flexDirection:"column", justifyContent:"center"}}
            >
                <Typography variant="h3">Starting in</Typography>
                <Typography variant="h3">{countdown}</Typography>
            </Backdrop>
        </FormGroup>
    );
}

export default ExerciseForm;