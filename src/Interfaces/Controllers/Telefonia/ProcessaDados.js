import getNewFilesInFolder from "./RetornarListaArquivos.js";
import parseCSV from "./ExtrairDadosArquivos.js";
import getLastExecutionTime from "../../../Infrastructure/Data/Telefonia/UtilTelefonia.js";
import dotenv from "dotenv";
import PlanilhaOi from "../../../Models/Telefonia/PlanilhaOiModel.js";

dotenv.config();

export default function loadTelefoniaData() {
	const inputFolderPath = "./src/Infrastructure/Data/Telefonia"; //DIR_TELEFONIA;
	const lastExecutionTime = getLastExecutionTime();
	const filePaths = getNewFilesInFolder(inputFolderPath, lastExecutionTime);
	const processedData = [];

	filePaths.forEach((filePath) => {
		const fileName = filePath.split("\\").pop();
		const fileType = fileName.substring(0, 2).toUpperCase();

		switch (fileType) {
			case "OI":
				const data = parseCSV(filePath);
				const processedFile = processOICSVData(data);
				processedData.push(processedFile);
				break;

			default:
				break;
		}
	});

	return processedData;
}

function processOICSVData(data) {
	const processedData = [];

	data.forEach((dp) => {
		const documentType = parseInt(dp.NUMERO_NF) > 0 ? "NFSTE" : "FATURA";
		const key = documentType === "NFSTE" ?
			parseInt(dp.ALIQ_ICMS) + dp.NUMERO_NF + dp.NUMERO_TELEFONE :
			parseInt(String(dp.NUMERO_FATURA).slice(-10).trim()) + dp.NUMERO_TELEFONE;

		const index = processedData.findIndex(o => o.ChaveDoc === key);

		if (index === -1) {
			const obj = new PlanilhaOi({ ChaveDoc: key, Tipo: documentType });
			obj.initialize();
			processedData.push(obj);
		}

		const item = processedData[index];

		item.NumeroTelefone = dp.NUMERO_TELEFONE;
		item.DtEmissao = new Date(String(dp.DT_FATURA).slice(0, 4) + "-" + String(dp.DT_FATURA).slice(4, 6) + "-" + String(dp.DT_FATURA).slice(6, 8));
		item.DtVencimento = new Date(String(dp.DT_VENCIMENTO).slice(0, 4) + "-" + String(dp.DT_VENCIMENTO).slice(4, 6) + "-" + String(dp.DT_VENCIMENTO).slice(6, 8));
		item.MesCompetencia = new Date(String(dp.COMPETENCIA).slice(0, 4) + "-" + String(dp.COMPETENCIA).slice(4, 6));
		item.ValorTotal += parseFloat(dp.VALOR.replace(",", "."));
		item.ValorLinha += parseFloat(dp.VALOR.replace(",", "."));

		if (documentType !== "FATURA") {
			item.NumeroNF = parseInt(dp.NUMERO_NF);
			item.Serie = String(dp.SERIE_NF).trim();
			item.BaseICMS += parseFloat(dp.VALOR.replace(",", "."));
			item.AliqICMS = parseFloat(dp.ALIQ_ICMS.replace(",", "."));
		} else {
			item.NumeroFatura = parseInt(dp.NUMERO_FATURA);
		}
	});

	return processedData;
}
