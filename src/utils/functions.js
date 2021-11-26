import { Box } from "@mui/material";
import ReadableChord from "../components/ReadableChord";

/**
 * Checks if two sets have the same values
 * @param {Set} a 
 * @param {Set} b 
 * @returns {boolean}
 */
export function compareSets(a, b)
{
    if(a.size !== b.size) return false;
    for(let v of a) if(!b.has(v)) return false;
    return true;
}

/**
 * Checks if Set A is a subset of Set B
 * @param {Set} a 
 * @param {Set} b 
 * @returns {boolean}
 */
export function isSubset(a, b)
{
    for(let v of a) if(!b.has(v)) return false;
    return true;
}

/**
 * Converts an array of chords in the format "position,chordName"
 * into a readable format using components.
 * @param {Array} chords
 * @returns {Box} Flex box with <ReadableChord/>s
 */
export function readableChordProgression(chords)
{
    const readableChords = chords.map((chord,idx) => {
        const chordData = chord.split(',');
        const position = parseInt(chordData[0]);
        const chordName = chordData[1];

        return <ReadableChord key={idx} nashville chordName={chordName} position={position}/>
    });

    return <Box sx={{display:"flex", gap:"1em"}}>{readableChords}</Box>;
}
