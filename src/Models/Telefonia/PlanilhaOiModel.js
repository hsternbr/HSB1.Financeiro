class PlanilhaOi{
    constructor(obj){
        this.NumeroTelefone = obj.NumeroTelefone;
        this.DtEmissao = obj.DtEmissao;
        this.Tipo = obj.Tipo;
        this.ValorLinha = obj.ValorLinha;
        this.NumeroNF = obj.NumeroNF;
        this.Serie = obj.Serie;
        this.ValorTotal = obj.ValorTotal;
        this.BaseICMS = obj.BaseICMS;
        this.AliqICMS = obj.AliqICMS;
        this.DtVencimento = obj.DtVencimento;
        this.MesCompetencia = obj.MesCompetencia;
        this.NumeroFatura = obj.NumeroFatura;
        this.ChaveDoc = obj.ChaveDoc;
    }

    initialize(){
        this.NumeroTelefone = "";
        this.DtEmissao = "";
        this.Tipo = "";
        this.NumeroNF = "";
        this.Serie = "";
        this.ValorTotal = 0;
        this.BaseICMS = 0;
        this.AliqICMS = 0;
        this.ValorLinha = 0;
        this.DtVencimento = "";
        this.MesCompetencia = "";
        this.NumeroFatura = "";
        this.ChaveDoc = "-";
    }
}
export default PlanilhaOi;