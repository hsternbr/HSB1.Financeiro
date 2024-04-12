import fs from 'fs';

function parseCSV(fileName) {
  const csvText = fs.readFileSync(fileName, 'utf8');
  const lines = csvText.trim().split('\n');
  const headers = lines.shift().split(';');
  const nomeArq = String(fileName).toUpperCase().split('\\').pop().substring(0,2);
  const OI = ['F1','NUMERO_FATURA','F3','F4','F5','F6','F7','F8','NUMERO_TELEFONE','F10','F11','F12','F13','F14','F15','F16','F17','F18','F19','F20','VALOR','F22','F23','F24','F25','F26',
              'ALIQ_ICMS','F28','F29','F30','F31','NUMERO_NF','SERIE_NF','F34','F35','VALOR_ICMS','VALOR_IMPOSTO','DT_VENCIMENTO','F39','DT_FATURA','F41','F42','F43','COMPETENCIA'];

  function fieldName(fieldNumber) {
      if (nomeArq === "OI") {
          return OI[fieldNumber];
      }

      return "F"+fieldNumber;
  }

  return lines.map(line => {
    const fields = line.split(';');
    const obj = {};
    for (let i = 0; i < headers.length && i < fields.length; i++) {
      //obj['f' + (i + 1)] = fields[i];
      obj[fieldName(i)] = fields[i];
    }
    return obj;
  });
}

export default parseCSV;
