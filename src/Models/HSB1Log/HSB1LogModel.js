import ExecCMD from '../../Infrastructure/connORA.js';

class HSB1Log{

    constructor(evento, programa){
        this.evento = evento;
        this.programa = programa;
        this.texto = [];  
        this.tipo  = null;  
        this.param_serv = [];
        this.execucao  = new Date();
        
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
        const sql =  `INSERT INTO HSB1_LOG(EVENTO,PROGRAMA,TEXTO,TIPO,PARAM_SERV,EXECUCAO) VALUES('`+this.evento + `','`+this.programa +`','` + txt + `','` + this.tipo + `','` + param + `',sysdate)`;
        //console.log(sql);
        ExecCMD(sql);
    }
    

}

export default HSB1Log;