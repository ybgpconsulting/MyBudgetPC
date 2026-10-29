import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/browser';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DATA_ROWS = 1000;

export async function readBulkStockRows(file: File): Promise<Record<string, unknown>[]> {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (extension !== '.csv' && extension !== '.xlsx') {
    throw new Error('Choose a .xlsx or .csv file.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum 10MB.');
  }

  let sheetRows: unknown[][];
  if (extension === '.csv') {
    const result = Papa.parse<string[]>(await file.text(), { skipEmptyLines: 'greedy' });
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing failed: ${result.errors[0].message}`);
    }
    sheetRows = result.data;
  } else {
    const sheets = await readXlsxFile(file);
    sheetRows = sheets[0]?.data || [];
  }

  if (sheetRows.length === 0) {
    throw new Error('The selected file contains no rows.');
  }
  if (sheetRows.length - 1 > MAX_DATA_ROWS) {
    throw new Error(`The file exceeds the ${MAX_DATA_ROWS}-row import limit.`);
  }

  const headers = sheetRows[0].map((value) => String(value ?? '').replace(/^\uFEFF/, '').trim());
  const headerNames = new Set(headers.filter(Boolean));
  if (headerNames.size === 0) {
    throw new Error('The first row must contain column headers.');
  }
  if (headerNames.size !== headers.filter(Boolean).length) {
    throw new Error('The file contains duplicate column headers.');
  }

  return sheetRows.slice(1).map((values) => {
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header) row[header] = values[index] ?? '';
    });
    return row;
  });
}
