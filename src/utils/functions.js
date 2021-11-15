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
 * @returns 
 */
export function isSubset(a, b)
{
    for(let v of a) if(!b.has(v)) return false;
    return true;
}
