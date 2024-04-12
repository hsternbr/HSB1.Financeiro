import ExecCMD from '../Infrastructure/connORA.js';

class HSB1Log{

    constructor(evento, programa){
        this.evento = null;
        this.programa = null;
        this.texto = [];  
        this.tipo  = null;  
        this.param_serv = [];
        this.execucao  = null;
    };    

    addTexto (txt){
        this.texto.push(txt);
    };

    addParam (txt){
        this.param_serv.push(txt);
    };

    gravarHS(){
        
        let txt;
        this.texto.map((dado, i ) =>{
            if(i == 0){
                txt = String(dado).replaceAll(`'`,'')  + '|';    
            }
            else{
                txt = txt + String(dado).replaceAll(`'`,'')  + '|';
            }
            
        })

        
        let param;
        this.param_serv.map((dado, i ) =>{
            if(i == 0){
                param = dado + '|';    
            }
            else {
                param = param + dado + '|';
            }
            
        })       
        const sql =  `INSERT INTO HSB1_LOG(EVENTO,PROGRAMA,TEXTO,TIPO,PARAM_SERV,EXECUCAO) VALUES('`+this.evento + `','`+this.programa +`','` + String(txt).substr(0,3999) + `','` + this.tipo + `','` + String(param).substr(0,3999) + `',to_date('` + this.execucao + `','DD/MM/YYYY HH24:MI:SS'))`;
        ExecCMD(sql);
    }
}

export default HSB1Log;