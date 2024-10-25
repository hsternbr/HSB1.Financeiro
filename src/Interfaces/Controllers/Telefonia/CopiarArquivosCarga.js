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

function compareFileLists(list1, list2) {
    // Função auxiliar para obter o nome sem extensão
    const getNameWithoutExtension = (filename) => {
        // Encontra a última ocorrência do ponto
        const dotIndex = filename.lastIndexOf('.');
        // Se não houver ponto, retorna o nome completo
        if (dotIndex === -1) {
            return filename;
        }
        // Retorna apenas a parte antes do último ponto
        return filename.substring(0, dotIndex);
    };

    // Cria um Set com os nomes sem extensão da segunda lista
    const namesList2 = new Set(
        list2.map(file => getNameWithoutExtension(file))
    );

    // Filtra a primeira lista, mantendo apenas os arquivos únicos
    const uniqueFiles = list1.filter(file => {
        const nameWithoutExt = getNameWithoutExtension(file);
        return !namesList2.has(nameWithoutExt);
    });

    return uniqueFiles;
}
//let diferencaHoraServidor = (28*60*1000);

// Function to copy new files
async function copyNewFiles() {
    try {
        let localFiles = await readdir(localFolderPath);
        let networkFiles = await readdir(networkFolderPath);
		//console.table(localFiles);

		networkFiles = networkFiles.filter((file) => file.startsWith('telefone_') || file.startsWith('aluguel_'));
        //console.table(networkFiles);	
        let filesToCopy = compareFileLists(networkFiles, localFiles);
        //networkFiles.filter(file => !localFiles.includes(file.replace(/\.[^.]*$/g, '')));

       
        console.log(`Arquivos a serem copiados: ${filesToCopy.length}`);
        console.log(filesToCopy); 
        /*let files = await readdir(networkFolderPath);
        const now = new Date();
		console.log(`Execução: ${now}`);
        files = files.filter((file) => file.startsWith('telefone_') || file.startsWith('aluguel_'));
        console.log(`Qtd. Arquivos: ${files.length}`);*/

        for (const file of filesToCopy) {
            const filePath = path.join(networkFolderPath, file);
            console.log(`Origem: ${filePath}`);
            //const fileStats = await stat(filePath);

            // Check if the file was created in the last 5 minutes
            //if ((now - fileStats.mtime) < ((5 * 60 * 1000)+diferencaHoraServidor)) {
                const destination = path.join(localFolderPath, file);
                console.log(`Destino: ${destination}`);
                try{
/*                     if (arquivosCopiados.includes(file)) {
                        console.log(`Arquivo já existe: ${file}`); 
                        break;
                    } */
                    await copyFile(filePath, destination, fs.constants.COPYFILE_EXCL);
/*                     console.log(`Arquivo copiado: ${file}`);
                    arquivosCopiados.push(file);    */                 
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
let running = false;
async function loop() {
    if (running) return;
    running = true;
    try {
        await copyNewFiles();
    } finally {
        running = false;
        setTimeout(loop, 5 * 60 * 1000);
    }
}
loop();

// Initial run
//copyNewFiles();
//setInterval( copyNewFiles, 5 * 60 * 1000);