import { Box } from "@mui/material";

function Piano({pressedKeys=[], incorrectKeys=[]}) 
{
    function calculateStyle(idx, isNatural=true)
    {
        let style = {...(isNatural ? styles.naturalKey : styles.accidentalKey)};
        if(pressedKeys.indexOf(idx) !== -1)
            style.backgroundColor = "#90CAF9";
        if(incorrectKeys.indexOf(idx) !== -1)
            style.backgroundColor = "#F99090";
        return style;
    }
    
    return (
        <Box sx={{position:"relative"}}>
            <Box sx={{
                display:"flex", 
                flexDirection:"row",
                margin:"auto", 
                backgroundColor:"white", 
                width:"fit-content",
            }}>
                <Box key={0}    sx={calculateStyle(0)}></Box>
                <Box key={2}    sx={calculateStyle(2)}></Box>
                <Box key={4}    sx={calculateStyle(4)}></Box>
                <Box key={5}    sx={calculateStyle(5)}></Box>
                <Box key={7}    sx={calculateStyle(7)}></Box>
                <Box key={9}    sx={calculateStyle(9)}></Box>
                <Box key={11}   sx={calculateStyle(11)}></Box>
            </Box>
            <Box sx={{
                position:"absolute", 
                top:0,
                left:"50%",
                transform:"translateX(-50%)",
                display:"flex", 
                flexDirection:"row", 
                gap:"0.5em",
                width:"fit-content"
            }}>
                <Box key={1}    sx={calculateStyle(1, false)}></Box>
                <Box key={3}    sx={calculateStyle(3, false)}></Box>
                <Box sx={{...styles.accidentalKey, opacity:0}}></Box> {/* Gap between E and F */}
                <Box key={6}    sx={calculateStyle(6, false)}></Box>
                <Box key={8}    sx={calculateStyle(8, false)}></Box>
                <Box key={10}   sx={calculateStyle(10, false)}></Box>
            </Box>
        </Box>
    );
}
export default Piano;

const styles = {
    naturalKey: {
        width:"2em",
        height:"10em",
        backgroundColor:"white",
        border:"1px solid black",
    },
    accidentalKey: {
        width:"1.5em",
        height:"6em",
        backgroundColor: "black",
        border:"2px solid black",
    },
}
