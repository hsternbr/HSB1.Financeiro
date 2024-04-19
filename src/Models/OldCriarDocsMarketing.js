import fs  from 'fs';
import csv from 'csv-parser';
import ExecORA  from '../../../../HSB1.Utilities/Infrastructure/connORA.js';
import chokidar from 'chokidar';
import execSAP from '../../../../HSB1.Utilities/Infrastructure/connSAP.js';
import HSB1Log from '../../../../HSB1.Utilities/HSB1Log/HSB1LogModel.js';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';


//const pastaDestino = 'C:\\HS\\HSB1\\HSB1.Financeiro\\src\\Infrastructure\\Data\\Telefonia';
const folderToMonitor = path.resolve() + '\\src\\Infrastructure\\Data\\Telefonia';
//const folderToMonitor = '\\\\10.1.0.133\\interface_ebs\\prd'; // Replace with the path to the folder you want to monitor

//const folderToMonitor = 'C:\\HS\\HSB1\\HSB1.Financeiro\\src\\Infrastructure\\Data\\Telefonia';

dotenv.config();

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

async function CallService(comando) {
  let targetURL;
  targetURL = `${process.env.SERVICE_URL}/${comando}`; 
  console.log(`CallService=> ${targetURL}`);
  
  let retorno = {};

  await axios
    .get(targetURL)
    .then((res) => {
      retorno = res; 
      })
    .catch((error) => { 
      //console.log(error);
      retorno = {"status":500,"message":error.message, "data": ""}; });

    return retorno;
  }

function formataData(dt) {
    return dt == null ? null : dt.slice(6, 10) + '-' + dt.slice(3, 5) + '-' + dt.slice(0, 2);    
}

function getUsage() {
    return null;   
}

async function getModel(tipoNota) {
    var queryModel = `select id_b1 "id_b1" from modelo_doc_fiscal where cod_docto_msaf = '${tipoNota}'`;
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
            min(pe.cod_forn_hsb1) "CardCode", min(pe.pessoa_num) "pessoa_num"
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
    if (auxCardCode == null && retorno[0].pessoa_num) {
        var resultado = await CallService(`bp/enviarForn(${retorno[0].pessoa_num})`);

        if ((resultado.status > 200 && resultado.status < 300) || (resultado.status==undefined && resultado.data.CardCode !== null))
          auxCardCode = resultado.data.CardCode;

        if (auxCardCode == null){
          log.addTexto(`Erro ao buscar o CardCode para o CNPJ: ${docFornCod} \n ${JSON.stringify(retorno)}`);
          //log.gravarHS();
          throw new Error(`Não foi encontrado o CardCode para o DocFornCod: ${docFornCod}` );
        }
        return auxCardCode;
    }
      else{
        console.error(`ATENÇÃO: Não foi encontrado o CardCode para o DocFornCod: ${docFornCod}`);
    }

    return auxCardCode;
};

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

    var queryBPLIdfromCCusto = `select  e.bplid_b1 "bplid_b1"
    from    ccusto cc, estab e
    where   cc.estab_num = e.estab_num
    and    (ccusto_gl_cod = '${auxCcusto}' 
    or praca_cod||' - '||sigla_cod = '${auxCcusto}')`;

    const retorno =   await ExecORA(queryBPLIdfromCCusto);
    try{
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

    if (obj.TipoCarga == 'TELEFONIA')
        return "1006389";
    
    if (obj.TipoCarga == 'TELEFONIA')
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
        
        return "1006389";
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

const processCSVFile = async (filePath) => {
  let documento = [];
  let documentoAtual = null;
  var tempNumeroNota = null;
  var tipoCarga;

  const stream = fs.createReadStream(filePath, { encoding: 'latin1' });

  for await (const row of stream.pipe(csv({ separator: ';', cast_date: true }))) {
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
        }

        const funcoes = [
          getCardCode(row["CNPJFornec"]),
          getBPLIdfromCCusto(row["EmpresaPgto"] == '' ? row["CC2"] : row["EmpresaPgto"]),
          getModel(row["TipoNota"])
        ];
      
        var cardCode, bplId, model;
        //const retornos = await Promise.all(funcoes);
        try {
           [cardCode, bplId, model] =  await Promise.all(funcoes);   
           //cardCode = await getCardCode(row["CNPJFornec"]);
           //bplId = await getBPLIdfromCCusto(row["EmpresaPgto"] == '' ? row["CC1"] : row["EmpresaPgto"]);
           //model = await getModel(row["TipoNota"]);       
        } catch (error) {
            log.addTexto(error.message);
            console.log(error.message);
            tempNumeroNota = row["NumeroNota"];
            documentoAtual = {SequenceSerial : 0};
            continue;
        }


        if (row["TipoCarga"] === "TELEFONIA") {
          referencia = "1006389";
          memo = `${row["TipoNota"]} ${row["NumeroNota"]} / ${row["Serie"]} | ${row["Fornecedor"]} | Pgto Telefonia`;
        }
        
        if (row["TipoCarga"] === "ALUGUEL") {
          referencia = "1008116";
          memo = `${row["TipoNota"]} ${row["NumeroNota"]} | ${row["Fornecedor"]} | Pgto Aluguel`;
        }

        documentoAtual = {
          DocDate: formataData(row["Emissao"]),
          DocDueDate: formataData(row['Vencimento']),
          TaxDate: formataData(row['DtGL']),
          CardCode: cardCode,
          JournalMemo: memo,
          SeriesString: row["Serie"],
          SequenceSerial: row["NumeroNota"],
          BPL_IDAssignedToInvoice: bplId,
          SequenceModel: model,
          SequenceCode: -2,
          U_ChaveAcesso : row["ChaveNFS"],
          DocumentLines: [],
          DocumentInstallments: []
        };

        tempNumeroNota = row["NumeroNota"];
      }

      // Add the current item to the order's items array
      let valorLinha = row["Valor"].replace(",",".");
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
        ProjectCode: "00000",
        CostingCode4: "00000",
        CSTCode:"0.90",
        TaxCode:"HSCODE54",
        CFOPCode:"1303",
        AccountCode: `${row["Conta"]}.${row["Sconta"]}`,
        FreeOfChargeBP: "tNO", //row["DebitoAutomatico"] === "SIM" ? "tYES" : "tNO",
        LineTaxJurisdictions: getImpostos(row["ValorBaseICMS"].replace(",","."), row["AliqICMS"].replace(",",".")),
      };
      if (linhaAtual){
        if (linhaAtual.FreeOfChargeBP === "tNO" && documentoAtual.DocumentInstallments.length === 0){
            documentoAtual.DocumentInstallments.push({
                DueDate: formataData(row["Vencimento"]),
                Total: row["Valor"].replace(",","."),
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
            console.log(`Doc. ${doc.SequenceSerial} de ${tipoCarga} enviado com sucesso`);
        } else {
            log.addTexto(`Doc. ${doc.SequenceSerial} de ${tipoCarga} não enviado. (${response.message})`);
            log.tipo = "E";
            console.log(`Doc. ${doc.SequenceSerial} de ${tipoCarga} não enviado. (${response.message})`);
            console.log(JSON.stringify(doc));
        }
      } catch (e) {
          log.tipo = "E";
          log.addTexto(`Erro ao tentar conexão com o SAP: ${e.message}`);
          console.log(e.message);
      }
    }

    log.gravarHS();
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
   // console.log(`Arquivo adicionado: ${file}`);
    if (file && (file.toUpperCase().startsWith('TELEFONE') || file.toUpperCase().startsWith('ALUGUEL')) 
                && file.toUpperCase().endsWith('.TXT')) {
      //const filePath = `${folderToMonitor}/${filename}`;
      console.log(`Processando arquivo: ${file}`);
      await processCSVFile(path); // processCSVFile(filePath);
      setTimeout(() => {fs.renameSync(path, path.slice(0,-3).concat('prc'))},3000);
    }
});