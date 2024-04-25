/**
 * Returns an array of file paths of files that were added to the specified
 * folder since the last execution time.
 *
 * @param {string} folderPath - The path of the folder to check.
 * @param {number} lastExecutionTime - The time of the last execution in
 * milliseconds since the Unix epoch.
 * @return {Array<string>} An array of file paths of files that were added to
 * the folder since the last execution time.
 */

import fs from "fs";
import path from "path";

function getNewFilesInFolderSince(folder, lastExecutionTime) {
  return fs.readdirSync(folder)
    .map(file => path.join(folder, file))
    .filter(filePath => fs.statSync(filePath).mtimeMs > lastExecutionTime)
    .filter(filePath => path.extname(filePath) === ".csv");
}

export default getNewFilesInFolderSince;
