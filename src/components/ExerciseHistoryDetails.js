import {
    IconButton,
    ListItem,
    Typography
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { compareSets } from '../utils/functions';
import { Box } from '@mui/system';
import { readableChordProgression } from '../utils/functions';

function ExerciseHistoryDetails({exercises, chords, isChordProgression, onClickDelete})
{
    const getFilteredExercises = () => {
        let targetChords = chords.split(' ');
        if(isChordProgression)
        {
            targetChords = targetChords.map(chord => {
                const chordData = chord.split(',');
                return { name:chordData[1], position:parseInt(chordData[0]) };
            });
            return exercises.filter(exercise => {
                if(targetChords.length !== exercise.chords.length) return false;
                for(let i = 0; i < exercise.chords.length; i++)
                {
                    if(exercise.chords[i].name !== targetChords[i].name || exercise.chords[i].position !== targetChords[i].position)
                        return false;
                }
                return true;
            });
        }
        else
        {
            targetChords = new Set(targetChords);
            
            return exercises.filter(exercise => {
                const chords = new Set(exercise.chords.map(chord => chord.name));
                return compareSets(chords, targetChords);
            });
        }
    }

    const filteredExercises = getFilteredExercises();

    return (
        <>
        <ListItem>
            {isChordProgression && readableChordProgression(chords.split(' '))}
            {!isChordProgression && <Typography variant="h6">{chords}</Typography>}
        </ListItem>
        {filteredExercises.map((exercise, idx) => (
            <ListItem key={idx} sx={{flexDirection:"row", gap:"2em"}}>
                <Box sx={{flexDirection:"column"}}>
                    <Typography>{Math.round(exercise.sessionLength/60)} minutes</Typography>
                    <Typography>{new Date(exercise.date).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{flexDirection:"column"}}>
                    <Typography>{exercise.exerciseCount > 0 ? Math.round(exercise.succeedCount/exercise.exerciseCount*100) : '-'}%</Typography>
                    <Typography>{exercise.succeedCount}/{exercise.exerciseCount}</Typography>
                </Box>
                <Box>
                    <IconButton onClick={() => onClickDelete(exercise.date)}><Delete/></IconButton>
                </Box>
            </ListItem>
        ))}
        </>
    );
}

export default ExerciseHistoryDetails;
