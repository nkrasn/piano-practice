import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Tone from 'tone';

import "../css/exercise.css";
import Piano from "../components/Piano";
import useInterval from "../hooks/useInterval";
import useIsMounted from "../hooks/isMounted";
import useRefState from "../hooks/useRefState";
import { selectChordCount, selectCorrectChordCount, incrementChordCount, incrementCorrectChordCount, resetProgress } from "../slices/exerciseProgress";
import { chordDefinitions, noteNames, noteNamesAlt, majorScale } from '../utils/constants';
import { compareSets, isSubset } from "../utils/functions";
import ChordButton from "../components/ChordButton";
import ReadableChord from "../components/ReadableChord";


const sessionStorage = window.sessionStorage;
const localStorage = window.localStorage;

const synth = new Tone.Sampler({
    urls: {
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
    baseUrl: process.env.PUBLIC_URL + "/audio/piano-samples/",
}).toDestination();

function Exercise({setInGame}) 
{
    const chords        = JSON.parse(sessionStorage.getItem("chords"));
    const mode          = parseInt(sessionStorage.getItem("mode"));
    const useInversions = sessionStorage.getItem("useInversions") === "true";
    const inversions    = JSON.parse(sessionStorage.getItem("inversions"));
    const tts           = sessionStorage.getItem("tts") === "true";
    const sessionLength = parseInt(sessionStorage.getItem("sessionLength"));

    const [audioRunning, audioRunningRef, setAudioRunning] = useRefState(false);
    const [time, timeRef, setTime] = useRefState(sessionLength);
    const [heldKeys, heldKeysRef, setHeldKeys] = useRefState([]);
    const [describeNoteUsingAltName, describeNoteUsingAltNameRef, setDescribeNoteUsingAltName] = useRefState(false);
    const [failedCurrentChord, failedCurrentChordRef, setFailedCurrentChord] = useRefState(false);
    const [flashed, flashedRef, setFlashed] = useRefState(false);
    const [midiInputs, midiInputsRef, setMidiInputs] = useRefState([]);
    // Current exercise
    const [targetKey, targetKeyRef, setTargetKey] = useRefState(-1);
    const [targetChord, targetChordRef, setTargetChord] = useRefState("none");
    const [targetInversion, targetInversionRef, setTargetInversion] = useRefState(0);
    const [targetProgressionKey, targetProgressionKeyRef, setTargetProgressionKey] = useRefState(-1);
    const [currPosition, currPositionRef, setCurrPosition] = useRefState(Number.MAX_VALUE-1);

    const flashedTimerRef = useRef(undefined);

    const [pressedCorrectChord, setPressedCorrectChord] = useState(false);

    const isMounted = useIsMounted();


    const chordCount = useSelector(selectChordCount);
    const correctChordCount = useSelector(selectCorrectChordCount);
    const dispatch = useDispatch();

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
                    let newExerciseHistory = {...JSON.parse(localStorage.getItem("exerciseHistory"))};

                    let newEntry = {
                        chords: chords,
                        sessionLength: sessionLength,
                        exerciseCount: chordCount,
                        succeedCount: correctChordCount,
                        date: new Date()
                    };
                    console.log(chords, newEntry);
                    if(mode === 0) // Chord progression
                    {
                        newExerciseHistory.chordProgressions.push(newEntry);
                    }
                    else if(mode === 1) // Randomized
                    {
                        newExerciseHistory.randomized.push(newEntry);
                    }

                    localStorage.setItem("exerciseHistory", JSON.stringify(newExerciseHistory));
                }
                (new Audio(process.env.PUBLIC_URL + "/audio/bell.mp3")).play();
                setInGame(false);
            }
        }
    }, 1000);

    useEffect(() => {
        let midiInputs = [];
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
        setAudioRunning(true);
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

    useEffect(() => {
        if(!pressedCorrectChord)
            return;
        goToNextChord();
        setPressedCorrectChord(false);
    }, [pressedCorrectChord])

    /******************************************************************************************
     *  Listeners
     */
    function onMidiMessage(midiMessage)
    {
        if(!isMounted.current)
            return;
        //console.log(targetKeyRef.current, targetChordRef.current);
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
            console.log(currPositionRef.current, chords.length);
            if((mode === 0 && currPositionRef.current === chords.length - 1) || mode === 1)
            {
                dispatch(incrementChordCount());
                if(!failedCurrentChordRef.current)
                    dispatch(incrementCorrectChordCount());
            }
            if(mode === 1)
                setPressedCorrectChord(true);
            else if(mode === 0)
            {
                if(currPositionRef.current === chords.length - 1)
                    setPressedCorrectChord(true);
                else
                    goToNextChord();
            }
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
        // Randomized mode
        if(mode === 1)
        {
            setFailedCurrentChord(false);
            setDescribeNoteUsingAltName(Math.random() < 0.5);
        }
        let newTargetKey = -1;
        do
        {
            newTargetKey = Math.floor(Math.random() * 12);
        } while(newTargetKey === targetKeyRef.current);
        setTargetKey(newTargetKey);
        const newTargetChord = chords[Math.floor(Math.random() * chords.length)].name;
        setTargetChord(newTargetChord);
        let newTargetInversion = 0;
        if(inversions.length > 0)
        {
            newTargetInversion = inversions[Math.floor(Math.random() * inversions.length)];
            newTargetInversion = Math.min(newTargetInversion, chordDefinitions[newTargetChord].notes.length - 1);
        }
        setTargetInversion(newTargetInversion);

        // Chord progression mode
        setCurrPosition(currPositionRef.current + 1);
        if(currPositionRef.current >= chords.length)
        {
            setFailedCurrentChord(false);
            setCurrPosition(0);
            let newTargetProgressionKey = -1;
            do
            {
                newTargetProgressionKey = Math.floor(Math.random() * 12);
            } while(newTargetProgressionKey === targetProgressionKeyRef.current);
            setTargetProgressionKey(newTargetProgressionKey);
            setDescribeNoteUsingAltName(Math.random() < 0.5);
        }
        
        if(tts && (mode === 1 || (mode === 0 && currPositionRef.current === 0)))
        {
            let msg = new SpeechSynthesisUtterance();
            if(chordDefinitions[targetChordRef.current])
            {
                if(mode === 0) // Chord progression mode
                {
                    const noteNameTTS = describeNoteUsingAltNameRef.current ? noteNamesAlt[targetProgressionKeyRef.current] : noteNames[targetProgressionKeyRef.current];
                    msg.text = noteNameTTS;
                }
                else if (mode === 1) // Randomized mode
                {
                    const noteNameTTS = describeNoteUsingAltNameRef.current ? noteNamesAlt[targetKeyRef.current] : noteNames[targetKeyRef.current];
                    msg.text = noteNameTTS + " " + chordDefinitions[targetChordRef.current].longName;
                    if(useInversions && inversions.length > 1)
                        msg.text += " " + ["", "First inversion", "Second inversion", "Third inversion"][newTargetInversion];
                }
                msg.text = msg.text.replace("♭", " flat ");
                msg.text = msg.text.replace("#", " sharp ");
                msg.text = msg.text.replace("b", " flat ");
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
        if(mode === 0)
            return targetChordIsPressed_ChordProgression(lastKeyWasPressed);
        return targetChordIsPressed_Randomized(lastKeyWasPressed);
    }

    function targetChordIsPressed_Randomized(lastKeyWasPressed)
    {
        const targetChordNotes = getChordNotes();
        const targetChordNotesSet = new Set(targetChordNotes);
        const heldNotes = getHeldNotes();
        const heldNotesSet = new Set(heldNotes);
        const heldKeysSorted = heldKeysRef.current.sort((a,b)=>a-b);
        const lowestNote = (heldKeysSorted[0] - 21) % 12;

        let inCorrectInversion = true;
        if(useInversions)
            inCorrectInversion = lowestNote === targetChordNotes[targetInversionRef.current];
        const pressedWrongNote = !isSubset(heldNotesSet, targetChordNotesSet);
        const pressedAllTargetNotes = compareSets(heldNotesSet, targetChordNotesSet);

        if(pressedWrongNote || (pressedAllTargetNotes && !inCorrectInversion))
        {
            setFailedCurrentChord(true);
            if(lastKeyWasPressed)
            {
                flashScreen();
            }
        }

        if(pressedAllTargetNotes && inCorrectInversion)
        {
            return true;
        }

        return false;
    }
    
    function targetChordIsPressed_ChordProgression(lastKeyWasPressed)
    {
        const targetChordNotes = getChordNotes();
        const targetChordNotesSet = new Set(targetChordNotes);
        const heldNotes = getHeldNotes();
        const heldNotesSet = new Set(heldNotes);

        const pressedWrongNote = !isSubset(heldNotesSet, targetChordNotesSet);
        const pressedAllTargetNotes = compareSets(heldNotesSet, targetChordNotesSet);

        if(pressedWrongNote)
        {
            setFailedCurrentChord(true);
            if(lastKeyWasPressed)
            {
                flashScreen();
            }
        }

        if(pressedAllTargetNotes)
        {
            return true;
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

    function flashScreen()
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

    /**
     * Converts the values of the currently held keys to a range between 0 and 12, with 0 representing A.
     * @param {Number} offset Offset the key that 0 represents
     * @returns An array of the normalized keys
     */
    function getHeldNotes(offset=0)
    {
        return [...new Set(heldKeysRef.current.map(key => (key-21+offset)%12))];
    }

    function getChordNotes()
    {
        let chordToCheck = undefined;
        let keyToCheck = undefined;
        if(mode === 0) // Chord progression
        {
            chordToCheck = chords[currPositionRef.current].name;
            keyToCheck = (targetProgressionKeyRef.current + majorScale[chords[currPositionRef.current].position])%12;
        }
        else if(mode === 1)
        {
            chordToCheck = targetChordRef.current;
            keyToCheck = targetKeyRef.current;
        }
        if(chordToCheck === undefined || keyToCheck === undefined)
        {
            console.error("Cannot get chord notes");
            return [];
        }
        let chordNotes = chordDefinitions[chordToCheck].notes; // In the key of A
        chordNotes = chordNotes.map(note => (note + keyToCheck) % 12); // Translated to the target key
        return chordNotes;
    }

    /**
     * Get all the held notes that are not in the target chord, with 0 representing A.
     * @param {Number} offset Offset the key that 0 represents
     * @returns An array of all the held notes that are not in the target chord
     */
    function getIncorrectHeldNotes(offset=0)
    {
        const allHeldNotes = getHeldNotes();
        const correctNotes = getChordNotes();
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
                    <Typography>useInversions: {useInversions ? "true" : "false"}</Typography>
                    <Typography>inversions: {inversions}</Typography>
                    <Typography>tts: {tts ? "true" : "false"}</Typography>
                    <Typography>session length: {sessionLength} sec</Typography>
                    <Typography>audioRunning:{audioRunning ? "true" : "false"}</Typography>
                </Box>
                <Box>
                    <Typography>targetChord: {targetChord}</Typography>
                    <Typography>targetKey: {targetKey}</Typography>
                    <Typography>targetInversion: {targetInversion}</Typography>
                    <Typography>---------</Typography>
                    <Typography>targetProgressionKey: {targetProgressionKey}</Typography>
                    <Typography>currPosition: {currPosition}</Typography>
                </Box>
            </Grid>

            <Grid item sx={{display:"flex", flexDirection:"column", gap:"0.5em"}}>
                {/* Current chord */}
                {!chordDefinitions[targetChord] ? <Typography variant="h3">Loading...</Typography> : (
                    <>
                    {mode === 0 && ( // Chord progression mode
                        <>
                        <Typography variant="h3">{describeNoteUsingAltName ? noteNamesAlt[targetProgressionKey] : noteNames[targetProgressionKey]}</Typography>
                        <Box sx={{display:"flex", flexDirection:"row", gap:"1em"}}>
                            {mode === 0 && chords.map((chord,idx) => (
                                <ReadableChord 
                                    key={idx} 
                                    chordName={chord.name} 
                                    position={chord.position} 
                                    baseVariant="h3"
                                    superscriptVariant="h6"
                                    color={currPosition-1 < idx ? "#626262" : "#FFFFFF"}
                                    nashville/>)
                            )}
                        </Box>
                        </>
                    )}
                    {mode === 1 && ( // Randomized mode
                        <>
                        <Typography variant="h3">{describeNoteUsingAltName ? noteNamesAlt[targetKey] : noteNames[targetKey]} {chordDefinitions[targetChord].longName}</Typography>
                        </>
                    )}
                    {mode === 1 && useInversions && <Typography variant="h5">{["Root position", "First inversion", "Second inversion", "Third inversion"][targetInversion]}</Typography>}
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
