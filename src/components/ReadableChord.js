import { Box, Typography } from "@mui/material";

import { nashvilleNumerals } from "../utils/constants";

function ReadableChord({nashville, chordName, position, baseVariant="h6", superscriptVariant="p", color="#FFFFFF"})
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
        <Box sx={{display:"flex", gap:"0.25em", color:color}}>
            {nashville && (
                <>
                    <Typography variant={baseVariant}>{isUppercase ? nashvilleNumerals[position].toUpperCase() : nashvilleNumerals[position].toLowerCase()}</Typography>
                    {(chordName !== "major" && chordName !== "minor") && (
                        <Typography variant={superscriptVariant} sx={{transform:"translateY(-10%)"}}>{chordName}</Typography>
                    )}
                </>
            )}
            {!nashville && (
                <>
                    <Typography variant={superscriptVariant}>{chordName}</Typography>
                </>
            )}
        </Box>
    );
}

export default ReadableChord;
