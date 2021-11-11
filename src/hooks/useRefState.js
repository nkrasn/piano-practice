import { useRef, useState } from "react";

/**
 * State hook that also stores its value in a ref. Useful for listeners which only have access to
 * a state's initial value.
 * 
 * https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
 * @param {*} initialValue 
 * @returns [value, ref, setValue]
 */
function useRefState(initialValue = undefined)
{
    const [value, _setValue] = useState(initialValue);
    const valueRef = useRef(value);
    const setValue = newValue => {
        valueRef.current = newValue;
        _setValue(newValue);
    }

    return [value, valueRef, setValue];
}

export default useRefState;
