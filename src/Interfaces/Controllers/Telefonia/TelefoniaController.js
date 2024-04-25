import ExcelJS from "exceljs";
import CargarDadosTelefonia from "./ProcessaDados.js";

const formatoData = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

let ultimoRegistro, registrosAdicionados = 0;

var workbook = new ExcelJS.Workbook();

function getUltimoRegistro(sheet) {
  for (let rowIndex = 1; rowIndex <= 100; rowIndex++) {
    if (!sheet.getRow(rowIndex).getCell(4).value) break;
  }
  return rowIndex - 1;
}

workbook.xlsx
  .readFile("C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx")
  .then((worksheet) => {
    const lastRow = getUltimoRegistro(worksheet.getWorksheet("UPLOAD"));
    const newRows = CargarDadosTelefonia().map((data) => {
      const row = worksheet.getWorksheet("UPLOAD").getRow(lastRow + 1);
      row.getCell(3).value = "N";
      row.getCell(4).value = data.NumeroTelefone;
      row.getCell(8).value = new Date(data.DtEmissao).toLocaleString(
        "pt-BR",
        formatoData
      );
      row.getCell(9).value = data.Tipo;
      row.getCell(10).value = data.NumeroNF;
      row.getCell(11).value = data.Serie;
      row.getCell(13).value = data.ValorTotal;
      row.getCell(14).value = data.ValorLinha;
      row.getCell(15).value = data.BaseICMS;
      row.getCell(16).value = data.AliqICMS;
      row.getCell(17).value = new Date(data.DtVencimento).toLocaleString(
        "pt-BR",
        formatoData
      );
      row.getCell(19).value = data.MesCompetencia;
      return row;
    });

    newRows.push(
      ...CargarDadosTelefonia().map((data) => {
        const row = worksheet.getWorksheet("UPLOAD").getRow(
          lastRow + 1 + newRows.length
        );
        row.getCell(3).value = "N";
        row.getCell(4).value = data.NumeroTelefone;
        row.getCell(8).value = new Date(data.DtEmissao).toLocaleString(
          "pt-BR",
          formatoData
        );
        row.getCell(9).value = "FATURA";
        row.getCell(10).value = data.NumeroFatura;
        row.getCell(13).value = data.ValorTotal;
        row.getCell(14).value = data.ValorLinha;
        row.getCell(15).value = 0;
        row.getCell(16).value = 0;
        row.getCell(17).value = new Date(data.DtVencimento).toLocaleString(
          "pt-BR",
          formatoData
        );
        row.getCell(19).value = data.MesCompetencia;
        return row;
      })
    );

    worksheet.commit();
    workbook.commit().then(() => {
      workbook.xlsx
        .writeFile("C:\\ArqsTemporarios\\PlanOi\\PlanilhaUploadTelefonia.xlsx")
        .then(() => console.log("FIM"));
    });
  })
  .catch((err) => console.log("Erro Leitura:", err));