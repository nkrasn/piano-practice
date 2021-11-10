import { Button, Card, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useHistory } from 'react-router-dom';
import { useSelector } from "react-redux";
import * as Tone from 'tone';

import {
    selectChords,
    selectMode,
    selectTTS,
    selectSessionLength,
} from '../slices/sessionSettings';
import { chordDefinitions, noteNames } from '../utils/constants';
import Piano from "../components/Piano";

const synth = new Tone.PolySynth(Tone.Synth).toDestination();
synth.volume.value = -10;

function Exercise() 
{
    /*
    Making React states work with listeners:
    https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
    */
    const [audioRunning, _setAudioRunning] = useState(false);
    const audioRunningRef = useRef(audioRunning);
    const setAudioRunning = data => {
        audioRunningRef.current = data;
        _setAudioRunning(data);
    };
    const [time, _setTime] = useState(10);
    const timeRef = useRef(time);
    const setTime = data => {
        timeRef.current = data;
        _setTime(data);
    };
    const [keysHeld, _setKeysHeld] = useState(new Set());
    const keysHeldRef = useRef(keysHeld);
    const setKeysHeld = data => {
        keysHeldRef.current = data;
        _setKeysHeld(data);
    }
    const [targetChord, _setTargetChord] = useState(new Set());
    const targetChordRef = useRef(targetChord);
    const setTargetChord = data => {
        targetChordRef.current = data;
        _setTargetChord(data);
    }
    const [targetChordName, _setTargetChordName] = useState(new Set());
    const targetChordNameRef = useRef(targetChordName);
    const setTargetChordName = data => {
        targetChordNameRef.current = data;
        _setTargetChordName(data);
    }
    const [targetKey, _setTargetKey] = useState(0);
    const targetKeyRef = useRef(targetKey);
    const setTargetKey = data => {
        targetKeyRef.current = data;
        _setTargetKey(data);
    }
    const [midiInputs, setMidiInputs] = useState([]);

    const history = useHistory();

    const chords = useSelector(selectChords);
    const mode = useSelector(selectMode);
    const tts = useSelector(selectTTS);
    const sessionLength = useSelector(selectSessionLength);

    useEffect(() => {
        setTime(sessionLength);

        Tone.context.on("statechange", e => {
            setAudioRunning(e === "running");
            console.log("state changed to " + e);
        });
        startAudio();
        chooseNewChord();

        navigator.requestMIDIAccess().then(
            midiAccess => {
                console.log(midiAccess.inputs);
                setMidiInputs(midiAccess.inputs);
                for(let input of midiAccess.inputs.values())
                    input.onmidimessage = getMIDIMessage;
            }
        );

        const timer = setInterval(() => {
            if(audioRunningRef.current)
            {
                setTime(timeRef.current - 1);
                if(timeRef.current < 0)
                    history.push("/");
            }
        }, 1000);

        // Cleanup
        return () => {
            if(timer)
                clearInterval(timer);
        };
    }, []);

    
    function startAudio() {
        Tone.start();
        if(Tone.context.state === "running")
        setAudioRunning(true); 
    }
    
    function keyNameOctave(keyPressed)
    {
        const noteName = noteNames[(keyPressed-21)%12];
        const noteOctave = Math.floor((keyPressed-12)/12);
        console.log(noteName, noteOctave);
        return [noteName, noteOctave];
    }
    
    function timerToString()
    {
        const seconds = time % 60;
        const minutes = Math.floor(time / 60)
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
    
    function getMIDIMessage(midiMessage)
    {
        const keyPressed = midiMessage.data[1];
        const velocity = midiMessage.data[2];
        const wasPressed = midiMessage.data[0] === 144 && velocity > 0;

        if(wasPressed)
        {
            setKeysHeld(new Set([...keysHeldRef.current, keyPressed]));
            const [note, octave] = keyNameOctave(keyPressed);
            synth.triggerAttackRelease(note + octave, "8n");
        }
        else
        {
            let newKeysHeld = new Set([...keysHeldRef.current]);
            newKeysHeld.delete(keyPressed);
            setKeysHeld(newKeysHeld);
        }

        // Check if you pressed the right chord
        if(targetChordIsPressed())
        {

        }
    }

    function chooseNewChord() {
        const newTargetKey = (Math.floor(Math.random() * 12)) % 12; // 0 = C
        
        const newTargetChordName = chords[Math.floor(Math.random() * chords.length)].name;
        let newTargetChord = chordDefinitions[newTargetChordName].notes;
        newTargetChord = newTargetChord.map(note => (note + newTargetKey) % 12);

        setTargetKey(newTargetKey);
        setTargetChord(newTargetChord);
        setTargetChordName(chordDefinitions[newTargetChordName].longName);
    }

    function targetChordIsPressed() {
        const keysHeldNormalized = new Set([[...keysHeldRef.current].map(val => val % 12)]);
        console.log(targetChordRef.current)
    }


    return (
        <Grid 
            container 
            alignItems="center"
            justifyContent="center"
            direction="column"
            sx={{textAlign:"center"}}
        >
            {/* Debug data */}
            <Grid item sx={{position:"fixed", 
                    display:"flex", 
                    top:0, left:0, 
                    flexDirection:"row", gap:"5em", flexWrap:"wrap",
                    width:"100vw", 
                }}
            >
                <Typography>chords: [{chords.map(chord=>`${chord.name}:${chord.position}, `)}]</Typography>
                <Typography>mode: {mode}</Typography>
                <Typography>tts: {tts ? "true" : "false"}</Typography>
                <Typography>session length: {sessionLength} min</Typography>
                <Typography>audioRunning:{audioRunning ? "true" : "false"}</Typography>
            </Grid>

            <Grid item>
                <Typography variant="h3">{noteNames[targetKey]} {targetChordName} chord</Typography>
                <Typography variant="h6">target keys: {[...targetChord].map(val => val + " ")}</Typography>
                <Typography variant="h6">keys held: {[...keysHeld].map(val => (val%12) + " ")}</Typography>
                {/*<Piano/>*/}
                <Typography variant="h5">{timerToString()}</Typography>

                <Dialog open={midiInputs.size === 0}>
                    <DialogTitle>No MIDI device found</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Please plug a device with MIDI output, then go to the
                            last page and put all your settings again (this will be
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
