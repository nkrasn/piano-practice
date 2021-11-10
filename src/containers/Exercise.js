import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import * as Tone from 'tone';
import Cookies from 'universal-cookie';

import useInterval from "../hooks/useInterval";
import { selectChordCount, selectCorrectChordCount, incrementChordCount, incrementCorrectChordCount, resetProgress } from "../slices/exerciseProgress";
import { chordDefinitions, noteNames } from '../utils/constants';
import Piano from "../components/Piano";

import "../css/exercise.css";
import useRefState from "../hooks/useRefState";
import useIsMounted from "../hooks/isMounted";

const cookies = new Cookies();

const synth = new Tone.Sampler({
    urls: {
        /*"C4": "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3",*/
        "A3":"A3vH.mp3",
        "A4":"A4vH.mp3",
        "A5":"A5vH.mp3",
        "A6":"A6vH.mp3",
        "A7":"A7vH.mp3",
        "B1":"B1vH.mp3",
        "B2":"B2vH.mp3",
        "B7":"B7vH.mp3",
        "C1":"C1vH.mp3",
        "C4":"C4vH.mp3",
        "C5":"C5vH.mp3",
        "C6":"C6vH.mp3",
        "C7":"C7vH.mp3",
        "D#2":"Ds2vH.mp3",
        "D#3":"Ds3vH.mp3",
        "D#4":"Ds4vH.mp3",
        "D#5":"Ds5vH.mp3",
        "D#6":"Ds6vH.mp3",
        "D#7":"Ds7vH.mp3",
        "F#1":"Fs1vH.mp3",
        "F#2":"Fs2vH.mp3",
        "F#3":"Fs3vH.mp3",
        "F#4":"Fs4vH.mp3",
        "F#5":"Fs5vH.mp3",
        "F#6":"Fs6vH.mp3",
        "F#7":"Fs7vH.mp3",
    },
    release: 1,
    //baseUrl: "https://tonejs.github.io/audio/salamander/",
    baseUrl: process.env.PUBLIC_URL + "/audio/piano-samples/",
}).toDestination();

function Exercise() 
{
    const chords = cookies.get("chords");
    const mode = parseInt(cookies.get("mode"));
    const tts = cookies.get("tts") === "true";
    const sessionLength = parseInt(cookies.get("sessionLength"));
    /*
     *  Making listeners have access to state values:
     *  https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
     */
    const [audioRunning, audioRunningRef, setAudioRunning] = useRefState(false);
    const [time, timeRef, setTime] = useRefState(sessionLength);
    const [heldKeys, heldKeysRef, setHeldKeys] = useRefState([]);
    const [targetKey, targetKeyRef, setTargetKey] = useRefState(-1);
    const [targetChord, targetChordRef, setTargetChord] = useRefState("none");
    const [failedCurrentChord, failedCurrentChordRef, setFailedCurrentChord] = useRefState(false);
    const [flashed, flashedRef, setFlashed] = useRefState(false);
    const [midiInputs, midiInputsRef, setMidiInputs] = useRefState([]);

    const flashedTimerRef = useRef(undefined);


    const chordCount = useSelector(selectChordCount);
    const correctChordCount = useSelector(selectCorrectChordCount);
    const dispatch = useDispatch();

    const history = useHistory();
    const isMounted = useIsMounted();

    // Exercise timer
    useInterval(() => {
        if(audioRunning)
        {
            const newTime = time - 1;
            setTime(newTime);
            // Exercise completed!
            if(newTime < 0)
            {
                if(chordCount > 0)
                {
                    cookies.set("exerciseHistory", [...cookies.get("exerciseHistory"), { 
                        chords: cookies.get("chords"),
                        mode: cookies.get("mode"),
                        sessionLength: cookies.get("sessionLength"),
                        chordCount: chordCount,
                        correctChordCount: correctChordCount
                    }], { path: '/', expires:new Date(2100,12,12,12,12,12,12) });
                }
                (new Audio(process.env.PUBLIC_URL + "/audio/bell.mp3")).play();
                history.push("/");
            }
        }
    }, 1000);

    useEffect(() => {
        let midiInputs = ['what'];
        navigator.requestMIDIAccess().then(
            midiAccess => {
                console.log(midiAccess.inputs);
                midiInputs = midiAccess.inputs.values();
                setMidiInputs(midiInputs);
                for(let input of midiInputs)
                {
                    input.onmidimessage = onMidiMessage;
                    console.log("subscribed " + input);
                }
            }
        );
    }, []);

    useEffect(() => {
        Tone.context.on("statechange", e => {
            setAudioRunning(e === "running");
            console.log("state changed to " + e);
        });
        synth.volume.value = -12;
        initGame();

        return () => {
            //synth.volume.value = -10000;
        }
    }, []);

    /******************************************************************************************
     *  Listeners
     */
    function onMidiMessage(midiMessage)
    {
        console.log(targetKeyRef.current, targetChordRef.current);
        const keyPressed = midiMessage.data[1];
        const velocity = midiMessage.data[2] / 127.0;
        const wasPressed = midiMessage.data[0] === 144 && velocity > 0;

        if(wasPressed)
        {
            setHeldKeys([...heldKeysRef.current, keyPressed])
            const [note, octave] = keyNameOctave(keyPressed);
            synth && synth.triggerAttack(note + octave);
        }
        else
        {
            setHeldKeys(heldKeysRef.current.filter(key => key !== keyPressed));
            const [note, octave] = keyNameOctave(keyPressed);
            synth && synth.triggerRelease(note + octave);
        }

        // Check if you pressed the right chord
        if(targetChordIsPressed(wasPressed))
        {
            dispatch(incrementChordCount());
            if(!failedCurrentChordRef.current)
                dispatch(incrementCorrectChordCount());
            goToNextChord();
            setHeldKeys([]);
        }
    }

    /******************************************************************************************
     *  Game logic
     */
    function initGame()
    {
        dispatch(resetProgress());
        goToNextChord();
    }

    function goToNextChord()
    {
        let newTargetKey = -1;
        do
        {
            newTargetKey = Math.floor(Math.random() * 12);
        } while(newTargetKey === targetKeyRef.current);
        setTargetKey(newTargetKey);
        setTargetChord(chords[Math.floor(Math.random() * chords.length)].name);
        setFailedCurrentChord(false);
        
        if(tts)
        {
            let msg = new SpeechSynthesisUtterance();
            if(chordDefinitions[targetChordRef.current])
            {
                msg.text = noteNames[targetKeyRef.current] + " " + chordDefinitions[targetChordRef.current].longName;
                msg.text = msg.text.replace("♭", " flat ");
                msg.text = msg.text.replace("#", " sharp ");
            }
            else
            {
                msg.text = "error"
            }
            window.speechSynthesis.speak(msg);
        }
    }

    function targetChordIsPressed(lastKeyWasPressed=true) 
    {
        const targetChordNotes = getTargetChordNotes();
        const heldNotes = getHeldNotes();

        let noIncorrectNotes = true;
        let numberOfCorrectNotes = 0;
        for(let note of heldNotes)
        {
            if(targetChordNotes.indexOf(note) === -1)
            {
                noIncorrectNotes = false;
                break;
            }
            numberOfCorrectNotes++;
        }

        if(!noIncorrectNotes)
        {
            setFailedCurrentChord(true);
        }
        
        if(noIncorrectNotes && numberOfCorrectNotes === targetChordNotes.length)
        {
            return true;
        }

        if(!noIncorrectNotes && lastKeyWasPressed)
        {
            if(flashedTimerRef.current) clearTimeout(flashedTimerRef.current);
            setFlashed(false);
            setTimeout(() => {
                setFlashed(true);
                flashedTimerRef.current = setTimeout(() => {
                    setFlashed(false);
                }, 1000);
            }, 10);
        }

        return false;
    }
    
    /******************************************************************************************
     *  Helpers
     */
    function startAudio() 
    {
        Tone.start();
        if(Tone.context.state === "running")
        setAudioRunning(true); 
    }

    /**
     * Get the note name of a key and the octave it's in.
     * @param {Number} key
     * @returns An array, first element being the note name and the second being the octave
     */
    function keyNameOctave(key)
    {
        const noteName = noteNames[(key-21)%12];
        const noteOctave = Math.floor((key-12)/12);
        return [noteName, noteOctave];
    }

    /**
     * Converts the values of the currently held keys to a range between 0 and 12, with 0 representing A.
     * @param {Number} offset Offset the key that 0 represents
     * @returns An array of the normalized keys
     */
    function getHeldNotes(offset=0)
    {
        return [...new Set(heldKeysRef.current.map(key => (key-21+offset)%12))];
    }

    function getTargetChordNotes()
    {
        let targetChordNotes = chordDefinitions[targetChordRef.current].notes; // In the key of A
        targetChordNotes = targetChordNotes.map(note => (note + targetKeyRef.current) % 12); // Translated to the target key
        return targetChordNotes;
    }

    /**
     * Get all the held notes that are not in the target chord, with 0 representing A.
     * @param {Number} offset Offset the key that 0 represents
     * @returns An array of all the held notes that are not in the target chord
     */
    function getIncorrectHeldNotes(offset=0)
    {
        const allHeldNotes = getHeldNotes();
        const correctNotes = getTargetChordNotes();
        let incorrectNotes = [];
        for(let note of allHeldNotes)
        {
            if(correctNotes.indexOf(note) === -1)
                incorrectNotes.push(note);
        }
        let answer = incorrectNotes;
        if(offset !== 0)
            answer = incorrectNotes.map(note => (((note + offset) % 12) + 12) % 12);
        return answer;
    }
    
    function timerToString()
    {
        const seconds = time % 60;
        const minutes = Math.floor(time / 60)
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }


    return (
        <Grid 
            container 
            alignItems="center"
            justifyContent="center"
            direction="column"
            sx={{textAlign:"center"}}
            className={"exercise-container " + (flashed && "flashed")}
        >
            {/* Debug data */}
            <Grid item sx={{
                    position:"fixed", 
                    top:0, left:0, 
                    display:"flex", 
                    flexDirection:"row", 
                    gap:"5em", 
                    flexWrap:"wrap",
                    width:"100vw",
                    textAlign: "left"
                }}
            >
                <Box>
                    <Typography>chords: [{chords.map(chord=>`${chord.name}:${chord.position}, `)}]</Typography>
                    <Typography>mode: {mode}</Typography>
                    <Typography>tts: {tts ? "true" : "false"}</Typography>
                    <Typography>session length: {sessionLength} sec</Typography>
                    <Typography>audioRunning:{audioRunning ? "true" : "false"}</Typography>
                </Box>
                <Box>
                    <Typography>targetChord: [{targetChord}]</Typography>

                    {/**
                     * const [audioRunning, setAudioRunning] = useRefState(false);
    const [time, setTime] = useRefState(100);
    const [heldKeys, setHeldKeys] = useRefState([]);
    const [targetKey, setTargetKey] = useRefState(-1);
    const [targetChord, setTargetChord] = useRefState("none");
    const [failedCurrentChord, setFailedCurrentChord] = useRefState(false);
    const [flashed, setFlashed] = useRefState(false);
    const flashedTimerRef = useRef(undefined);
                     */}
                </Box>
            </Grid>

            <Grid item sx={{display:"flex", flexDirection:"column", gap:"0.5em"}}>
                {/* Current chord */}
                {!chordDefinitions[targetChord] ? <Typography variant="h3">Loading...</Typography> : (
                    <>
                    <Typography variant="h3">{noteNames[targetKey]} {chordDefinitions[targetChord].longName}</Typography>
                    <Piano pressedKeys={getHeldNotes(-3)} incorrectKeys={getIncorrectHeldNotes(-3)}/> 
                    <Typography variant="h5">Accuracy: {chordCount ? Math.round(correctChordCount / chordCount * 100) : '-'}% ({correctChordCount}/{chordCount})</Typography>
                    <Typography variant="h5">{timerToString()}</Typography>
                    </>
                )}

                {/* Error dialogs */}
                <Dialog open={midiInputs.size === 0}>
                    <DialogTitle>No MIDI device found</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Please plug a device with MIDI output, then go to the
                            last page and put in all your settings again (this will be
                            fixed later and done automatically).
                        </DialogContentText>
                    </DialogContent>
                </Dialog>

                <Dialog open={!audioRunning && midiInputs.size > 0}>
                    <DialogTitle>Audio context was suspended</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Press OK to resume the audio context. This can happen 
                            if you refresh the page or aren't active for a while. 
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={startAudio} autoFocus>OK</Button>
                    </DialogActions>
                </Dialog>
            </Grid>
        </Grid>
    );
}
export default Exercise;
