class SAPDocument {
    constructor(obj){
        //console.log('Dentro da Classe ' + obj);
        this.DocEntry          = obj.DocEntry;
        this.DocNum            = obj.DocNum;
        this.DocDate           = obj.DocDate;
        this.DocDueDate        = obj.DocDueDate;
        this.CardCode          = obj.CardCode;
        this.CardName          = obj.CardName ; 
        this.DocTotal          = obj.DocTotal ;
        this.DocCurrency       = obj.DocCurrency ;
        this.DocRate           = obj.DocRate ;
        this.Reference1        = obj.Reference1;
        this.JournalMemo       = obj.JournalMemo;
        this.PaymentGroupCode  = obj.PaymentGroupCode;
        this.Confirmed         = obj.Confirmed;
        this.PaymentGroupCode  = obj.PaymentGroupCode;
        this.Confirmed         = obj.Confirmed;
        this.SummeryType       = obj.SummeryType;
        this.DocObjectCode     = obj.DocObjectCode;
        this.DocTotalSys       = obj.DocTotalSys;
        this.PaymentMethod     = obj.PaymentMethod;
        this.PaymentBlock      = obj.PaymentBlock;
        this.BaseAmount        = obj.BaseAmount;
        this.BaseAmountSC      = obj.BaseAmountSC;
        this.DocumentStatus    = obj.DocumentStatus;
        this.PeriodIndicator   = obj.PeriodIndicator;
        this.DownPaymentAmount = obj.DownPaymentAmount;
        this.DownPaymentPercentage = obj.DownPaymentPercentage;
        this.DownPaymentType   = obj.DownPaymentType;
        this.DownPaymentAmountFC = obj.DownPaymentAmountFC;
        this.VatPercent        = obj.VatPercent;
        this.Cancelled         = obj.Cancelled;
    };

}

export default DPModel;