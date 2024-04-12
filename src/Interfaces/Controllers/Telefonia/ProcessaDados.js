import getNewFilesInFolder from "./RetornarListaArquivos.js";
import parseCSV from "./ExtrairDadosArquivos.js";
import getLastExecutionTime from "../../../Infrastructure/Data/Telefonia/UtilTelefonia.js";
import dotenv from "dotenv";
import PlanilhaOi from "../../../Models/Telefonia/PlanilhaOiModel.js";

dotenv.config();

export default function CargarDadosTelefonia() {
	let dadosProcessados = [];
	const folderPath = "./src/Infrastructure/Data/Telefonia"; //DIR_TELEFONIA; //'./src/Interfaces/Controllers/Telefonia';
	const lastExecutionTime = getLastExecutionTime();
	const arqs = getNewFilesInFolder(folderPath, lastExecutionTime);
	console.log(arqs);

	function OICSV(dadosParametro) {
		let NFOI = [];

		let obj = new PlanilhaOi({});
		obj.initialize();

		let chaveNF, chaveFatura, idx;
		//DocOI.DtEmissao = new Date(2000,0,1);

		dadosParametro.map((dp) => {
			if (parseInt(dp.NUMERO_NF) > 0) {
				chaveNF = parseInt(dp.ALIQ_ICMS) + dp.NUMERO_NF + dp.NUMERO_TELEFONE;
				idx = NFOI.findIndex((o) => o.ChaveDoc === chaveNF);

				if (idx === -1) {
					obj.ChaveDoc = chaveNF;
					NFOI.push(obj);
					idx = NFOI.length - 1;
				};

				NFOI[idx].NumeroNF = parseInt(dp.NUMERO_NF);
				NFOI[idx].Serie = String(dp.SERIE_NF).trim();
				NFOI[idx].BaseICMS += parseFloat(dp.VALOR.replace(",", "."));
				NFOI[idx].Tipo = "NFSTE";
				NFOI[idx].NumeroTelefone = dp.NUMERO_TELEFONE;
				NFOI[idx].ValorTotal += parseFloat(dp.VALOR.replace(",", "."));
				NFOI[idx].ValorLinha += parseFloat(dp.VALOR.replace(",", "."));
				NFOI[idx].AliqICMS = parseFloat(dp.ALIQ_ICMS.replace(",", "."));
				NFOI[idx].DtEmissao = new Date(
					String(dp.DT_FATURA).slice(0, 4) +
					"-" +
					String(dp.DT_FATURA).slice(4, 6) +
					"-" +
					String(dp.DT_FATURA).slice(6, 8)
				);
				NFOI[idx].DtVencimento = new Date(
					String(dp.DT_VENCIMENTO).slice(0, 4) +
					"-" +
					String(dp.DT_VENCIMENTO).slice(4, 6) +
					"-" +
					String(dp.DT_VENCIMENTO).slice(6, 8)
				);
				NFOI[idx].MesCompetencia = new Date(
					String(dp.COMPETENCIA).slice(0, 4) +
					"-" +
					String(dp.COMPETENCIA).slice(4, 6)
				);

				/*             NFOI[chaveNF].BaseICMS = NFOI[chaveNF].BaseICMS === null || DocOI.BaseICMS === undefined
									? parseFloat(dp.VALOR.replace(",", "."))
									: DocOI.BaseICMS + parseFloat(dp.VALOR.replace(",", ".")); */
			} else {
				chaveNF = null;
			};

			if (parseInt(dp.NUMERO_FATURA) > 0) {
				chaveFatura = parseInt(String(dp.NUMERO_FATURA).slice(-10).trim()) + dp.NUMERO_TELEFONE;
				idx = NFOI.findIndex((o) => o.ChaveDoc === chaveFatura);

				if (idx === -1) {
					let fat = new PlanilhaOi({});
					fat.initialize();
					fat.ChaveDoc = chaveFatura;
					NFOI.push(fat);
					idx = NFOI.length - 1;
				};
				/*if (FaturaOI.indexOf(chaveFatura) === -1) {
					FaturaOI.push(obj);
				}*/

				NFOI[idx].NumeroTelefone = dp.NUMERO_TELEFONE;
				NFOI[idx].ValorTotal += parseFloat(
					dp.VALOR.replace(",", ".")
				);
				NFOI[idx].ValorLinha += parseFloat(
					dp.VALOR.replace(",", ".")
				);
				NFOI[idx].DtEmissao = new Date(
					String(dp.DT_FATURA).slice(0, 4) +
					"-" +
					String(dp.DT_FATURA).slice(4, 6) +
					"-" +
					String(dp.DT_FATURA).slice(6, 8)
				);
				NFOI[idx].DtVencimento = new Date(
					String(dp.DT_VENCIMENTO).slice(0, 4) +
					"-" +
					String(dp.DT_VENCIMENTO).slice(4, 6) +
					"-" +
					String(dp.DT_VENCIMENTO).slice(6, 8)
				);
				NFOI[idx].MesCompetencia = new Date(
					String(dp.COMPETENCIA).slice(0, 4) +
					"-" +
					String(dp.COMPETENCIA).slice(4, 6)
				);
				NFOI[idx].Tipo = "FATURA";
				NFOI[idx].NumeroFatura = parseInt(dp.NUMERO_FATURA);
			};
		});

		return NFOI;
		//,["f3","f4","f16","f18","f19","f20","f21","f23"]));
	}

	var planilhaTelefonia = [];

	arqs.map((nomeArq) => {
		switch (String(nomeArq).toUpperCase().split("\\").pop().substring(0, 2)) {
			case "OI":
				planilhaTelefonia = OICSV(parseCSV(nomeArq));
				dadosProcessados.push(planilhaTelefonia);
				console.table(planilhaTelefonia);
				planilhaTelefonia = [];
				break;

			default:
				break;
		}
	});
	return dadosProcessados;
};