const tempAdminData = {};

/**
 * Stores admin data with a unique key.
 * @param {string} key 
 * @param {object} data 
 */
export function setTempAdminData(key, data) {
    tempAdminData[key] = data;
}

/**
 * Retrieves admin data using the unique key.
 * @param {string} key 
 * @returns {object|null} 
 */
export function getTempAdminData(key) {
    return tempAdminData[key] || null;
}

/**
 * Deletes admin data after retrieval.
 * @param {string} key 
 */
export function deleteTempAdminData(key) {
    delete tempAdminData[key];
}