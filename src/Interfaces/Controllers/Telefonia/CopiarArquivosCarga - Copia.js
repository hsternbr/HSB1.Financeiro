import fs from 'fs';
import path from  'path';
import { promisify } from 'util';

const copyFile = promisify(fs.copyFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configure your paths here
const networkFolderPath = '\\\\10.1.0.133\\interface_ebs\\prd';
const localFolderPath = 'C:\\Node\\HSB1.Financeiro\\src\\Infrastructure\\Data\\Telefonia';

let arquivosCopiados = [];
//let diferencaHoraServidor = (28*60*1000);

// Function to copy new files
async function copyNewFiles() {
    try {

        let localFiles = await readdir(localFolderPath);
        let networkFiles = await readdir(networkFolderPath);
        let filesToCopy = networkFiles.filter(file => !localFiles.includes(file.replace(/\.[^.]*$/g, '')));
        /*let files = await readdir(networkFolderPath);
        const now = new Date();
		console.log(`Execução: ${now}`);
        files = files.filter((file) => file.startsWith('telefone_') || file.startsWith('aluguel_'));
        console.log(`Qtd. Arquivos: ${files.length}`);*/

        for (const file of filesToCopy) {
            const filePath = path.join(networkFolderPath, file);
            //const fileStats = await stat(filePath);

            // Check if the file was created in the last 5 minutes
            //if ((now - fileStats.mtime) < ((5 * 60 * 1000)+diferencaHoraServidor)) {
                const destination = path.join(localFolderPath, file);
                try{
                    if (arquivosCopiados.includes(file)) {
                        console.log(`Arquivo já existe: ${file}`); 
                        continue;
                    }
                    await copyFile(filePath, destination, fs.constants.COPYFILE_EXCL);
                    console.log(`Arquivo copiado: ${file}`);
                    arquivosCopiados.push(file);                    
                }
                catch(error){
                    console.log(`Arquivo ${file} já existe: ${error}`);    
                }
            //}
        }
    } catch (error) {
        console.error('Erro ao copiar arquivos:', error);
    }
}

// Run the function every 5 minutes
setInterval(copyNewFiles, 5 * 60 * 1000);

// Initial run
//copyNewFiles();
