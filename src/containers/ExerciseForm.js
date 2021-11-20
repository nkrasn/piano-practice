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
} from "@mui/material";
import { useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import * as Tone from 'tone';
import Cookies from 'universal-cookie';

import { resetProgress } from "../slices/exerciseProgress";
import { chordDefinitions, drawerWidth, nashvilleNumerals } from '../utils/constants';
import ChordButton from "../components/ChordButton";
import Piano from "../components/Piano";


const cookies = new Cookies();


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

    const [chords, _setChords]                  = useState(cookies.get("chords"));
    const [mode, _setMode]                      = useState(parseInt(cookies.get("mode")));
    const [useInversions, _setUseInversions]    = useState(cookies.get("useInversions") === "true");
    const [inversions, _setInversions]          = useState(cookies.get("inversions"));
    const [tts, _setTTS]                        = useState(cookies.get("tts") === "true");
    const [sessionLength, _setSessionLength]    = useState(parseInt(cookies.get("sessionLength")));
    const setChords         = val => { cookies.set("chords",        val, { path: '/' }); _setChords(val); }
    const setMode           = val => { cookies.set("mode",          val, { path: '/' }); _setMode(parseInt(val)); }
    const setUseInversions  = val => { cookies.set("useInversions", val, { path: '/' }); _setUseInversions(val); }
    const setInversions     = val => { cookies.set("inversions",    val, { path: '/' }); _setInversions(val); }
    const setTTS            = val => { cookies.set("tts",           val, { path: '/' }); _setTTS(val); }
    const setSessionLength  = val => { cookies.set("sessionLength", val, { path: '/' }); _setSessionLength(parseInt(val)); }

    const dispatch = useDispatch();

    const chordsToSet = () => new Set(chords.map(chord => chord.name));


    function handleClickChord(event) 
    {
        if(mode === 0)
        {
            setChords([...cookies.get("chords"), { name:event.currentTarget.value, position:selectedPosition }]);
        }
        else if(!chordsToSet().has(event.currentTarget.value))
        {
            setChords([
                ...cookies.get("chords"), { 
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
        newChords.splice(idx, 1);
        setChords(newChords);
    }


    return (
        <FormGroup>
            <Box sx={{flexGrow:1, marginLeft:drawerWidth, padding:"1em"}}>
                {/* Chosen chords display */}
                <Box sx={{ 
                        display:"flex", 
                        gap:"3em", 
                        height:"5em", 
                        width:`calc(100vw - ${drawerWidth} - ${drawerWidth})`,
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
                        />;
                    })}
                </Box>
                <Divider/>
                {/* Mode (chord progresssion/randomized) */}
                <Tabs value={mode} onChange={handleChangeMode}>
                    <Tab label="Chord Progression"/>
                    <Tab label="Randomized"/>
                </Tabs>
                {/* Chord selector */}
                <Box sx={{display:"flex", flexDirection:"row", gap:"2em", alignItems:"center"}}>
                    <ImageList sx={{ width: 400 }} cols={4}>
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
                    <Container align="center">
                        <Typography variant="h5" sx={{marginBottom:"0.2em", opacity:(hoveredChord ? 1 : 0)}}>{hoveredChord ? chordDefinitions[hoveredChord].longName : "."}</Typography>
                        <Piano pressedKeys={hoveredChord && chordDefinitions[hoveredChord].notes}/>
                    </Container>
                </Box>
                {/* Position selector */}
                {mode === 0 && (
                    <Tabs value={selectedPosition} onChange={handleChangePosition}>
                        {nashvilleNumerals.map((val,idx) => <Tab key={idx} label={val} disabled={mode === 1}/>)}
                    </Tabs>
                )}
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
                {/* TTS */}
                <FormControlLabel control={<Switch checked={tts} onChange={handleChangeTTS}/>} label="TTS"/>
                {/* Session length */}
                <Slider 
                    sx={{marginTop:"2em", marginLeft:"4em", width:"500px", display:"block"}}
                    value={sessionLength / 60}
                    step={5}
                    marks
                    min={5}
                    max={30}
                    valueLabelDisplay="on"
                    valueLabelFormat={x => `${x} minute session`}
                    onChange={handleChangeSessionLength}
                />
                <Button 
                    variant="contained"
                    onClick={handleClickStartExercise}
                    disabled={chords.length === 0}
                >
                    Start Exercise
                </Button>
                <Button
                    onClick={() => { cookies.set("sessionLength", sessionLength/60, { path: '/' }); handleClickStartExercise(); }}
                    disabled={chords.length === 0}
                >
                    Start Exercise (seconds)
                </Button>
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