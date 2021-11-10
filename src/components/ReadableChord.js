import { Button, Typography } from "@mui/material";
import Cookies from 'universal-cookie';

import { nashvilleNumerals } from '../utils/constants';


const cookies = new Cookies();


function ReadableChord({idx=NaN, chordName="maj", position=0, nashville=false, onMouseOver=undefined, onMouseLeave=undefined, onClick=undefined}) 
{
    let isUppercase = true;
    switch(chordName)
    {
        case "minor":
        case "m7":
        case "mM7":
        case "dim":
        case "o7":
        case "oM7":
        case "ø7":
            isUppercase = false;
            break;
        default:
            break;
    }

    return (
        <Button 
            onClick={onClick}
            onMouseOver={onMouseOver}
            onMouseLeave={onMouseLeave}
            disabled={isNaN(idx)}
            value={chordName}
            sx={{ display:"inline-flex", flexDirection:"row", gap:"0.2em", textTransform:"none"}}
        >
            {nashville && (
                <>
                    <Typography variant="h3">{isUppercase ? nashvilleNumerals[position].toUpperCase() : nashvilleNumerals[position].toLowerCase()}</Typography>
                    {(chordName !== "major" && chordName !== "minor") && (
                        <Typography variant="h6" sx={{transform:"translateY(-50%)"}}>{chordName}</Typography>
                    )}
                </>
            )}
            {!nashville && (
                <>
                    <Typography variant="h4">{chordName}</Typography>
                </>
            )}
        </Button>
    )
}

export default ReadableChord;