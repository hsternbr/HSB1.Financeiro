import fs from 'fs';

function parseCSV(filePath) {
  const csvText = fs.readFileSync(filePath, 'utf8');
  const rows = csvText.trim().split('\n');
  const headers = rows.shift().split(';');
  const fieldNames = getFieldNames(filePath);

  return rows.map(row => {
    const fields = row.split(';');
    const obj = {};
    for (let i = 0; i < headers.length && i < fields.length; i++) {
      obj[fieldNames[i]] = fields[i];
    }
    return obj;
  });
}

function getFieldNames(filePath) {
  const fileName = filePath.toUpperCase();
  if (fileName.includes('OI')) {
    return ['NUMERO_FATURA', 'NUMERO_TELEFONE', 'VALOR', 'ALIQ_ICMS', 'VALOR_ICMS', 'VALOR_IMPOSTO', 'DT_VENCIMENTO', 'DT_FATURA', 'COMPETENCIA'];
  }
  return headers.map((_, i) => `F${i + 1}`);
}

export default parseCSV;
