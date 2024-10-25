import fs  from 'fs';
import csv from 'csv-parser';
import chokidar from 'chokidar';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

import ExecORA from 'hsb1.utilities/Infrastructure/connORA.js';
import execSAP from 'hsb1.utilities/Infrastructure/connSAP.js';
import HSB1Log from 'hsb1.utilities/HSB1Log/HSB1LogModel.js';
import  Email   from 'hsb1.utilities/Email/EnviaEmail.js';


/* import ExecORA  from '../../../../HSB1.Utilities/Infrastructure/connORA.js';
import execSAP from '../../../../HSB1.Utilities/Infrastructure/connSAP.js';
import HSB1Log from '../../../../HSB1.Utilities/HSB1Log/HSB1LogModel.js'; */

let arquivoProcessado;

const enviaEmail = (listaErros) => {
  let erros = '';
  if (listaErros.length > 0) {
      listaErros.forEach(element => {
        erros+= `<p>${element}</p>`
      })
    }
      
    Email("leonardo.carvalho@hstern.com.br",
    ["leonardo.carvalho@hstern.com.br"], ///"contasapagar.rj@hstern.com.br",
    `Erro na Carga do SAP - ${arquivoProcessado}`,
    erros
    );
}

//const pastaDestino = 'C:\\HS\\HSB1\\HSB1.Financeiro\\src\\Infrastructure\\Data\\Telefonia';
const folderToMonitor = path.resolve() + '\\HSB1.Financeiro\\src\\Infrastructure\\Data\\Telefonia';

//const folderToMonitor = '\\\\10.1.0.133\\interface_ebs\\prd'; // Replace with the path to the folder you want to monitor

//const folderToMonitor = 'C:\\HS\\HSB1\\HSB1.Financeiro\\src\\Infrastructure\\Data\\Telefonia';

dotenv.config();

let errosCarga=[];
let log = new HSB1Log(null, null);
log.execucao = new Date().toLocaleDateString("pt-br");

var sessionConfig = {
  secret: "apiHSB1-Carga",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Ajuste as configurações do cookie conforme necessário
  sessionTimeout: 5,
  sessionToken : ""
};

async function callService(serviceEndpoint) {
  const url = `${process.env.SERVICE_URL}/${serviceEndpoint}`;
  console.log(`callService => ${url}`);

  try {
    const response = await axios.get(url);
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, message: error.message, data: '' };
  }
}

function formataData(dt) {
    return dt == null ? null : dt.slice(6, 10) + '-' + dt.slice(3, 5) + '-' + dt.slice(0, 2);    
}

function getUsage() {
    return null;   
}

async function getModel(tipoNota, especie) {
    if (especie === '821' || especie === '441')
      return 28;

    var queryModel = `select id_b1 "id_b1" from modelo_doc_fiscal where cod_docto_msaf = '${tipoNota.trim()}'`;
    const retorno =  await ExecORA(queryModel);
      try {
          return retorno[0].id_b1;        
      } catch (error) {
          return 0;
      }
}

async function getCardCode(docFornCod) {
  var queryCardCode = `
  SELECT  
          max(pe.cod_forn_hsb1) "CardCode", max(pe.pessoa_num) "pessoa_num"
  FROM    
          empresa e, estab es, pessoa pe
  WHERE   1 = 1 and
          e.empresa_num = es.empresa_num AND
          es.estab_num = pe.pessoa_num AND
          e.cgc_base = substr('${docFornCod.replace(/\D/g, "").slice(1)}',1,8) AND
          regexp_replace(e.cgc_base||es.cgc_complemento, '[^0-9]', '') = '${docFornCod.replace(/\D/g, "").slice(1)}'
  `;

  const retorno =   await ExecORA(queryCardCode);

  var auxCardCode = retorno[0].CardCode;
  //if (auxCardCode == null && retorno[0].pessoa_num) {
      var resultado = await callService(`bp/enviarForn(${retorno[0].pessoa_num})`);

      if ((resultado.status > 200 && resultado.status < 300) || (resultado.status==undefined && resultado.data.CardCode !== null))
        if (resultado.status != 204) 
          auxCardCode = resultado.data.CardCode;
        else
        auxCardCode = `S${retorno[0].pessoa_num}`;

      if (auxCardCode == null && resultado.status != 204){
        log.addTexto(`Erro ao buscar o CardCode para o CNPJ: ${docFornCod} \n ${JSON.stringify(retorno)}`);
        //log.gravarHS();
        throw new Error(`Não foi encontrado o CardCode para o DocFornCod: ${docFornCod}` );
      }
      return auxCardCode;
/*   }
    else{
      //console.error(`ATENÇÃO: Não foi encontrado o CardCode para o DocFornCod: ${queryCardCode}`);
      return auxCardCode;
  } */

};

let cfop = null;

async function getBPLIdfromCCusto(ccusto){
    var auxCcusto;

    switch (ccusto) {
      case "ESP - ADMPESP": auxCcusto = "ESP - HSCI-PESP"
        break;
      case "RIO - MATRIZ": auxCcusto = "RIO - HSCI-PHS"
        break;
      case "ESP - HSCI PESP": auxCcusto = "ESP - HSCI-PESP"
        break;
      default:
        auxCcusto = ccusto;
    }

    var queryBPLIdfromCCusto = `select  e.bplid_b1 "bplid_b1", e.is_industria "is_industria"
    from    ccusto cc, estab e
    where   cc.estab_num = e.estab_num
    and    (ccusto_gl_cod = '${auxCcusto}' 
    or praca_cod||' - '||sigla_cod = '${auxCcusto}')`;

    const retorno =   await ExecORA(queryBPLIdfromCCusto);
    try{
        cfop = retorno[0].is_industria === 'S' ? '1302' : '1303';
        return retorno[0].bplid_b1;
    }catch(e){
        log.addTexto(`Erro ao buscar o BPLId para o CCusto: ${ccusto} \n ${e.message}`);
        //log.gravarHS();
        throw new Error("Não foi encontrado o BPLId para o CCusto: " + ccusto);
    }
};

function getReferencia(obj) {
    if (obj.TipoCarga == 'ALUGUEL')
        return "1008116";
   
    if (obj.TipoCarga == 'TELEFONE')
        if (obj.Conta == '3315010') {
            if (obj.Sconta == '00020')
                return "1052960";
            else
                if (obj.Sconta == '00040')
                    return "1052412";

            return "1053311";
        }
        else
            if (obj.Conta == '3315020') {
                if (obj.Sconta == '00010')
                    return "1052758";
                else
                    if (obj.Sconta == '00030')
                        return "1053864";	

                return "1051586";
            }
        
        return "1053829";
    }

function getImpostos(valorICMS, aliquotaICMS) {
    var impostos = [];

    impostos.push({
      "JurisdictionCode": "ICMSX52",
      "JurisdictionType": 31,
      "TaxAmount": 0.0,
      "TaxAmountSC": 0.0,
      "TaxAmountFC": 0.0,
      "TaxRate": aliquotaICMS,
      "ExternalCalcTaxRate": aliquotaICMS,
      "BaseSum": 0.0,
      "TaxInPrice": "tYES",
      "U_Outros": valorICMS,
      "ExternalCalcTaxAmount": 0,
    });

    return impostos;
}

async function defineCFOP(cardCode, BPLId){
  var queryUF = `
  select e.uf_cod 
  from pessoa p, endereco e
  where p.cod_forn_hsb1 = '${cardCode}'
  and  p.pessoa_num = e.pessoa_num
  and  p.pessoa_num = ${cardCode.slice(1)}
  union
  select e.uf_cod 
  from estab es, endereco e
  where es.bplid_b1 = '${BPLId}'
  and  es.estab_num = e.pessoa_num
`

const retorno = await ExecORA(queryUF);
try{
    return retorno.length > 1 ? `2${cfop.slice(1)}` : cfop;
}catch(e){
    log.addTexto(`Erro ao buscar o BPLId para o CCusto: ${ccusto} \n ${e.message}`);
    //log.gravarHS();
    throw new Error("Não foi encontrado o BPLId para o CCusto: " + ccusto);
}
}

const processCSVFile = async (filePath) => {
  let documento = [];
  let documentoAtual = null;
  var tempNumeroNota = null;
  var tipoCarga;

  console.log("Processando CSV") ;
  const stream = fs.createReadStream(filePath, { encoding: 'latin1' });

  for await (const row of stream.pipe(csv({ separator: ';', 
                                            cast_date: true , 
                                            mapValues: ({ header, index, value }) => value.trim() }))) {
      console.log("Row:",row["NumeroNota"]) ;

      if (row["NumeroNota"] == null)
          break;

      tipoCarga = row["TipoCarga"];
      log.programa = `${tipoCarga}`;
      log.evento = `CARGA TESOURARIA: ${filePath.replace(folderToMonitor.concat("\\"), "")}`;

      var referencia, memo; 
      // Check if a new order has started
      if (!documentoAtual || tempNumeroNota !== row["NumeroNota"]) {
        // If a new order, push the previous order to the array
        if (documentoAtual && documentoAtual.SequenceSerial != 0) {
          documento.push(documentoAtual);
          cfop = null;
        }

        const funcoes = [
          await getCardCode(row["CNPJFornec"]),
          getBPLIdfromCCusto(row["EmpresaPgto"] == '' ? row["CC2"] : row["EmpresaPgto"]),
          getModel(row["TipoNota"], row["Especie"])
        ];
      
        var cardCode, bplId, model;
        //const retornos = await Promise.all(funcoes);
        try {
          [cardCode, bplId, model] =  await Promise.all(funcoes);
          if (row["TipoNota"] !== "FATURA")
            cfop = await defineCFOP(cardCode, bplId);
          else
            cfop = "1000";
       
        } catch (error) {
            log.addTexto(error.message);
            console.log(error.message);
            tempNumeroNota = row["NumeroNota"];
            documentoAtual = {SequenceSerial : 0};
            continue;
        }


        if (row["TipoCarga"] === "TELEFONE") {
          referencia = "1053829";
          memo = `${row["TipoNota"]} ${row["NumeroNota"]} / ${row["Serie"]} | ${row["Fornecedor"]} | Pgto Telefonia`;
        }
        
        if (row["TipoCarga"] === "ALUGUEL") {
          referencia = "1008116";
          memo = `${row["TipoNota"]} ${row["NumeroNota"]} | ${row["Fornecedor"]} | Pgto Aluguel`;
        }

        documentoAtual = {
          DocDate: formataData(row["DtGL"]),
          DocDueDate: formataData(row['Vencimento']),
          TaxDate: formataData(row['Emissao']),
          CardCode: cardCode,
          JournalMemo: memo,
          SeriesString: row["Serie"],
          SequenceSerial: row["NumeroNota"],
          BPL_IDAssignedToInvoice: bplId,
          SequenceModel: model,
          SequenceCode: -2,
          U_ChaveAcesso : row["ChaveNFS"],
          Comments : memo,
          DocumentLines: [],
          DocumentInstallments: []
        };

        tempNumeroNota = row["NumeroNota"];
      }

      // Add the current item to the order's items array
      let valorLinha = parseFloat(row["Valor"].replace(",","."));
      const linhaAtual = {
        ItemCode: getReferencia(row),
        Description: row["TipoCarga"] === "ALUGUEL" ? String(row["Chave"]).slice(0,100) : String(`${row["NumeroNota"]}/${row["Serie"]} | ${row["Telefone"]}`).slice(0,100),
        FreeText: row["TipoCarga"] === "ALUGUEL" ? String(row["Chave"]).slice(0,100) : String(`${row["NumeroNota"]}/${row["Serie"]} | ${row["Telefone"]}`).slice(0,100),
        Quantity: 1,
        Price:valorLinha,
        PriceAfterVAT: valorLinha,
        UnitPrice: valorLinha,
        Usage: getUsage(),
        CostingCode: row["CC1"],
        CostingCode2: `R${row["CC2"]}`,
        CostingCode5: `UF${row["CC1"].slice(0,2)}001`,
        CostingCode3: `P${row["Projeto"]}`,
        /*ProjectCode: "00000",
        CostingCode4: "00000",*/
        CSTCode:"0.90",
        TaxCode:row["TipoNota"] !== "FATURA" ? "HSCODE54": "NTRIB",
        CFOPCode: cfop,
        AccountCode: `${row["Conta"]}.${row["Sconta"]}`,
        FreeOfChargeBP: "tNO", //row["DebitoAutomatico"] === "SIM" ? "tYES" : "tNO",
        LineTaxJurisdictions: getImpostos(row["ValorBaseICMS"].replace(",","."), row["AliqICMS"].replace(",",".")),
      };
      if (linhaAtual){
        if (linhaAtual.FreeOfChargeBP === "tNO" && documentoAtual.DocumentInstallments[0] == undefined){
            documentoAtual.DocumentInstallments.push({
                DueDate: formataData(row["Vencimento"]),
                Total: parseFloat(row["TotalNF"].replace(",",".")),
                U_LinhaDigitavel: row["LinhaDigitavel"] ? String(row["LinhaDigitavel"]).slice(0,100) : null,
            });
        }
        documentoAtual.DocumentLines.push(linhaAtual);
      }
      else
        log.addTexto(`Erro ao processar linha: ${row["NumeroNota"]} | ${row["Valor"]}`);
    }

    if (documentoAtual) {
      documento.push(documentoAtual);
    }
    console.log("=============================");

    stream.on('end', () => {
      // Push the last order to the array
      console.log("Stream Finalizado");
      fs.renameSync(filePath, filePath.replace('csv', 'csx'));
      // Do further processing with the documento array
    });

    documento = documento.filter(doc => doc.SequenceSerial !== 0);

    for (const doc of documento) {
      try {
        const response = await execSAP(
            "post",
            "/PurchaseInvoices",
            JSON.stringify(doc),
            sessionConfig
        );

        if (response.status >= 200 && response.status < 300) {
            log.addTexto(`Doc. ${doc.SequenceSerial} de ${tipoCarga} enviado com sucesso. (${response.status})`);
            log.tipo = log.tipo !== "E" && "I";
            //console.log(`Doc. ${doc.SequenceSerial} de ${tipoCarga} enviado com sucesso`);
        } else {
            log.addTexto(`${tipoCarga} - Doc. ${doc.SequenceSerial} não enviado. (${response.message})`);
            log.tipo = "E";
            console.log(`${tipoCarga} - Doc. ${doc.SequenceSerial} não enviado. (${response.message})`);
            //console.log(JSON.stringify(doc));

            errosCarga.push(`${tipoCarga} - Doc. ${doc.SequenceSerial} não enviado. (${response.message})`);

        }
      } catch (e) {
          log.tipo = "E";
          log.addTexto(`Erro ao tentar conexão com o SAP: ${e.message}`);
          console.log(e.message);
      }
    }

    log.gravarHS();
    console.log("ErrosCarga:",errosCarga.length);
    !errosCarga.length === 0 && enviaEmail(errosCarga);
};

console.log(`Monitorando a pasta: ${folderToMonitor}`);

const watcher = chokidar.watch(`${folderToMonitor}`, {
  ignored: /(^|[\/\\])\../, // Exclude hidden files and folders
  persistent: true, // Keep the process running
});

watcher.on('ready', () => {
  console.log('Verificação inicial finalizada. Aguardando novos arquivos...');
});

watcher.on('add', async (path) => {
    let file = path.split('\\').slice(-1)[0];
    if (file && (file.toUpperCase().startsWith('TELEFONE') || file.toUpperCase().startsWith('ALUGUEL')) 
                && file.toUpperCase().endsWith('.TXT')) {
      console.log(`Processando arquivo: ${file}`);
      arquivoProcessado = file;
      await processCSVFile(path);

      let tentativas = 0;
      do {
              try {
                setTimeout(() => {fs.renameSync(path, path.slice(0,-3).concat('prc'))},5000);
                break;
              } catch (error) {
                tentativas++;
              }
      } while (tentativas < 10);
    }
});