import HSB1Log from "../src/Models/HSB1Log/HSB1LogModel.js";
//'../Models/HSB1Log/HSB1LogModel.js';
import { getDraftCTE } from "../src/DraftService.js";
//'../Service/DraftService.js';
import dotenv from 'dotenv';


//console.log(dirname(process.argv[1]));
dotenv.config();
//dotenv.config({path:`${__dirname(process.argv[1])}/.env`});

    
const dtEvento = `Início: ${new Date().toLocaleDateString('pt-br',process.env.DATE_OPTIONS)}`;

var logExecucao = new HSB1Log('CTE', 'Confirmação CTE');
let chaveCTE = process.argv.slice(2);


logExecucao.addTexto(dtEvento);
logExecucao.addParam(`Chave:${chaveCTE}`);

var retorno = getDraftCTE(chaveCTE, logExecucao);

console.dir(retorno);

//logExecucao.gravarHS();