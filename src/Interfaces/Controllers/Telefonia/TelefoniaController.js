import ExcelJS from "exceljs";
import CargarDadosTelefonia from "./ProcessaDados.js";

const formatoData = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

let ultimoRegistro, registrosAdicionados = 0;

var workbook = new ExcelJS.Workbook();

async function getDataPlan() {
     workbook.xlsx.readFile("C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx");
     return workbook;
}

function getUltimoRegistro(planilhaAtual) {
  let valorAux, regAux = 0;

  for (let i = 1; i <= 100; i++) {
      valorAux = planilhaAtual.getRow(i).getCell(4).value;

      if (valorAux !== null && valorAux !== undefined) 
        regAux = i;
      else break;
  }

  return regAux;
}

console.log("INICIO");
const dadosPlanilha = CargarDadosTelefonia();
console.log(dadosPlanilha);

if (dadosPlanilha.length > 0) {
    workbook.xlsx.readFile("C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx")
    .then(async (ws) => {
      // Retorna a última lisha da planiha
        const sheet = ws.getWorksheet("UPLOAD");

        ultimoRegistro = getUltimoRegistro(sheet);

      //workbook.xlsx.writeFile("C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx").then((wr) => {

    dadosPlanilha.map((dp,i) => {
        let registro = sheet.getRow(ultimoRegistro+registrosAdicionados+1);
        registro.getCell(3).value = 'N';
        registro.getCell(4).value = dp[i].NumeroTelefone;
        registro.getCell(8).value = new Date(dp[i].DtEmissao).toLocaleString("pt-BR", formatoData)
        registro.getCell(9).value = dp[i].Tipo;
        registro.getCell(10).value = dp[i].NumeroNF;
        registro.getCell(11).value = dp[i].Serie;
        registro.getCell(13).value = dp[i].ValorTotal;
        registro.getCell(14).value = dp[i].ValorLinha;
        registro.getCell(15).value = dp[i].BaseICMS;
        registro.getCell(16).value = dp[i].AliqICMS;
        registro.getCell(17).value = new Date(dp[i].DtVencimento).toLocaleString("pt-BR", formatoData);
        registro.getCell(19).value = dp[i].MesCompetencia;//new Date(dp[i].MesCompetencia).toLocaleString("pt-BR", formatoData);
        registro.commit;
        //sheet.insertRow(ultimoRegistro+registrosAdicionados+1, registro);
        registrosAdicionados += 1;
        
        let registroFatura = sheet.getRow(ultimoRegistro+registrosAdicionados+1);

        registroFatura.getCell(3).value = 'N';
        registroFatura.getCell(4).value = dp[i].NumeroTelefone;
        registroFatura.getCell(8).value = new Date(dp[i].DtEmissao).toLocaleString("pt-BR", formatoData)
        registroFatura.getCell(9).value = "FATURA";
        registroFatura.getCell(10).value = dp[i].NumeroFatura;
        registroFatura.getCell(13).value = dp[i].ValorTotal;
        registroFatura.getCell(14).value = dp[i].ValorLinha;
        registroFatura.getCell(15).value = 0;
        registroFatura.getCell(16).value = 0;
        registroFatura.getCell(17).value = new Date(dp[i].DtVencimento).toLocaleString("pt-BR", formatoData);
        registroFatura.getCell(19).value = dp[i].MesCompetencia; //new Date(dp[i].MesCompetencia).toLocaleString("pt-BR", formatoData); 
        registroFatura.commit;
        //sheet.insertRow(ultimoRegistro+registrosAdicionados+1, registroFatura);
        registrosAdicionados += 1;
    });


      sheet.commit;
      await workbook.commit;
      console.dir( workbook.getWorksheet("UPLOAD").getRows(ultimoRegistro+1, registrosAdicionados));
      workbook.xlsx.writeFile(
        "C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx",
      ).then((wr) => {
        workbook.xlsx.readFile("C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx")
        .then(
            (wr) => {
                const rows = wr.getWorksheet("UPLOAD").getRows(ultimoRegistro+1, registrosAdicionados);

                for (const r of rows) {
                    console.dir(r);

                
                console.log("FIM");
                }
            }
        );
      })
      .catch((err) => {
        console.log("ERRO Gravação:",err);
      })

    })
    .catch((err) => {
      console.log("Erro Leitura:", err);
    });
}