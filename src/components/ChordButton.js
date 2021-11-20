import { Button } from "@mui/material";
import Cookies from 'universal-cookie';

import ReadableChord from "./ReadableChord";


function ChordButton({idx=NaN, chordName="maj", position=0, nashville=false, onMouseOver=undefined, onMouseLeave=undefined, onClick=undefined}) 
{
    return (
        <Button 
            onClick={onClick}
            onMouseOver={onMouseOver}
            onMouseLeave={onMouseLeave}
            disabled={isNaN(idx)}
            value={chordName}
            sx={{ display:"inline-flex", flexDirection:"row", gap:"0.2em", textTransform:"none"}}
        >
            <ReadableChord nashville={nashville} chordName={chordName} position={position} baseVariant="h3"/>
        </Button>
    )
}

export default ChordButton;