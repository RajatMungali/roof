import openpyxl
try:
    wb = openpyxl.load_workbook('Tim_Lamoureux_Residence_Brookfield_MA_Spreadsheet.xlsx', data_only=False)
    ws = wb.active
    with open('formulas.txt', 'w') as f:
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str) and cell.value.startswith('='):
                    f.write(f"{cell.coordinate}: {cell.value}\n")
                elif 'waste' in str(cell.value).lower() or 'shingle' in str(cell.value).lower():
                    f.write(f"TEXT {cell.coordinate}: {cell.value}\n")
    print("Done")
except Exception as e:
    with open('formulas.txt', 'w') as f:
        f.write(str(e))
