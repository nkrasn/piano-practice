import {
    Box,
    Divider,
    ListItem,
    ListItemButton,
    Typography,
} from '@mui/material';
import ReadableChord from './ReadableChord';
import { readableChordProgression } from '../utils/functions';


function ExerciseHistoryIndex({exerciseHistory, onExerciseClick}) 
{
    const ExerciseList = ({exercises, isChordProgressions}) => {

        const getChords = () => {
            if(!exercises)
                return undefined;

            if(isChordProgressions)
            {
                return chordProgressionsChords();
            }
            return randomizedChords();
        }

        const chordProgressionsChords = () => {
            const chordProgressions = exercises.map(exercise => exercise.chords);
            const chordProgressionsStr = chordProgressions.map(chordProgression => chordProgression.map(chord => chord.position + "," + chord.name).join(' '));
            return Array.from(new Set(chordProgressionsStr)).sort();
        }

        const randomizedChords = () => {
            let chordSets = exercises.map(exercise => exercise.chords.sort((a,b) => a.name.localeCompare(b.name)));
            let chords = chordSets.map(chordSet => chordSet.map(chord => chord.name).join(' '));
            return Array.from(new Set(chords)).sort();
        }

        return (
            <>
            {exercises && exercises.length > 0 && getChords().map((chords, idx) => (
                <ListItem key={idx} sx={{flexDirection:"row"}}>
                    <ListItemButton sx={{width:"100%", display:"flex", flexDirection:"row"}} onClick={() => onExerciseClick(chords, isChordProgressions)}>
                        {isChordProgressions && readableChordProgression(chords.split(' '))}
                        {!isChordProgressions && <Typography>{chords}</Typography>}
                    </ListItemButton>
                </ListItem>
            ))}
            </>
        )
    };

    return (
        <>
        {/* Chord progressions */}
        <Divider/>
        <ListItem><Typography variant="h6">Chord Progressions</Typography></ListItem>

        {(!exerciseHistory || !exerciseHistory.chordProgressions || exerciseHistory.chordProgressions.length === 0) && <ListItem>-</ListItem>}
        {exerciseHistory && <ExerciseList exercises={exerciseHistory.chordProgressions} isChordProgressions={true}/>}

        {/* Randomized */}
        <Divider/>
        <ListItem><Typography variant="h6">Randomized</Typography></ListItem>

        {(!exerciseHistory || !exerciseHistory.randomized || exerciseHistory.randomized.length === 0) && <ListItem>-</ListItem>}

        {exerciseHistory && <ExerciseList exercises={exerciseHistory.randomized} isChordProgressions={false}/>}
        </>
    );
}

export default ExerciseHistoryIndex;
