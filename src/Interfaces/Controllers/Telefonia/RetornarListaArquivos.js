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

function getNewFilesInFolder(folderPath, lastExecutionTime) {
    const newFiles = [];
    fs.readdirSync(folderPath).forEach((file) => {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);
        if (fileStats.mtimeMs > lastExecutionTime && filePath.endsWith(".csv")) {
            newFiles.push(filePath);
        }
    });
  return newFiles;
}

export default getNewFilesInFolder;
