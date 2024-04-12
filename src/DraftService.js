import execSAP from "../src/Infrastructure/connSAP.js";
//"../Infrastructure/connSAP.js";
//import session from 'express-session';

function conectaSAP(objLog, objParam) {
    const sessionConfig = {
        secret: "apiHSB1-BP",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Ajuste as configurações do cookie conforme necessário
    };

    //let conexao = session(sessionConfig);

    const endPoint = "/Drafts".concat(objParam);
    const e = execSAP(
        "get",
        endPoint,
        null,
        sessionConfig
        //conexao
    ).then((resolve) => {
        objLog.addTexto("Conexão SAP:", resolve.data);
        objLog.tipo = "INFO";

        return resolve.data;

    }).catch((err) => {
        const x = execSAP("get",'/Logout',null,sessionConfig).then((resolve) => {
            objLog.addTexto("Logout SAP:", resolve.data);
            objLog.tipo = "INFO";
        });
        
        objLog.addTexto("Erro ExecSAP: ", err.message);
        objLog.tipo = "ERRO";
        console.dir("Erro Exec Conecta SAP: ", err);
    }); 
    

    return e;
};

export function getDraftCTE(chaveCTE, objLog) {
    const listaRetorno = "DocDate,CardName,NumAtCard,DocTotal,TransportationCode,DocumentStatus,BPLName,VATRegNum,TaxExtension"
//    `https://193.123.108.195:50000/b1s/v1/Drafts?$select=DocEntry,DocNum,Series,VATRegNum,BPLName,CardName,Address,DocTotal,DocTotalSys,NumAtCard&$filter=U_B1SYS_MeterCode eq '712588'`
    //var paramDraft = `?$select=${listaRetorno}&$filter=U_TX_tagCTe eq ${chaveCTE}`; /*U_AGL_CHV_CTE */
    var paramDraft = `?$select=${listaRetorno}&$filter=U_B1SYS_MeterCode eq '${chaveCTE}'`;//U_B1SYS_TaxID12
    
    objLog.addParam(`paramDraft:${paramDraft}`);

    var resultadoDraft;
    try {
        resultadoDraft = conectaSAP(objLog, paramDraft);
    } catch (error) {
        objLog.addTexto("Erro ExecSAP (getDraft): ", error.message);
        return null;
    }
    

    return JSON.stringify(resultadoDraft);
};

export function confirmaDraftCTE(idDraft, objLog) {
    //Drafts(123)/Close
    var paramConfirma = `(${idDraft})/Close`;
    objLog.addParam(`paramConfirma:${paramConfirma}`);
    

    var resultadoConfirmacao;
    try {
        resultadoConfirmacao = conectaSAP(log, paramConfirma);;
    } catch (error) {
        objLog.addTexto("Erro ExecSAP: ", error.message);
        return null;
    }
    
    return JSON.stringify(resultadoConfirmacao);
};