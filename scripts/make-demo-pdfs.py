"""Generate the fictional one-page source PDFs; no external dependencies."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'public' / 'raw'
def pdf(filename, company, title, lines):
    def esc(s): return s.replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
    commands = ['0.10 0.15 0.22 rg', '48 738 516 6 re f']
    def text(x,y,size,s): commands.append(f'BT /F1 {size} Tf 1 0 0 1 {x} {y} Tm ({esc(s)}) Tj ET')
    text(48,710,22,company); text(48,682,12,title)
    text(48,648,9,'PRIVATE DOCUMENT  |  APEX PACIFIC  |  SEPTEMBER 2026')
    y=607
    for label,value in lines:
        commands.extend(['0.82 0.84 0.86 RG',f'48 {y-13} m 564 {y-13} l S','0.10 0.15 0.22 rg'])
        text(48,y,10,label)
        # Long prose is wrapped rather than truncated.
        import textwrap
        chunks=textwrap.wrap(value,64) or ['']
        for j,chunk in enumerate(chunks): text(220,y-j*15,10,chunk)
        y-=max(43, len(chunks)*15+20)
    text(48,60,9,'Fictional demonstration document. All entities and figures are illustrative.')
    text(505,40,9,'Page 1 of 1')
    stream='\n'.join(commands).encode('ascii')
    objs=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream']
    out=bytearray(b'%PDF-1.4\n'); offsets=[0]
    for i,obj in enumerate(objs,1):
        offsets.append(len(out)); out.extend(f'{i} 0 obj\n'.encode()+obj+b'\nendobj\n')
    start=len(out);out.extend(b'xref\n0 6\n0000000000 65535 f \n')
    for offset in offsets[1:]:out.extend(f'{offset:010d} 00000 n \n'.encode())
    out.extend(f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n'.encode());(ROOT/filename).write_bytes(out)
pdf('Harborline_August_NAV.pdf','Harborline Fund Administration','Net asset value statement',[
 ('Fund','Halcyon Event-Driven Credit'),('Share class','Apex Pacific ARF'),('Valuation date','31 August 2026'),('Net asset value','$17,100,000'),('Management fee charged','0.15%'),('Fee per LPA','0.12%'),('Note 4','July NAV restated -0.8pp after final pricing; fee accrual recomputed.')])
pdf('PacificFundServices_September_Invoice.pdf','Pacific Fund Services Ltd','Invoice PFS-2026-0944',[
 ('Invoice date','1 September 2026'),('Due date','30 September 2026'),('Bill to','Apex Pacific Absolute Return Fund'),('Description','Q3 2026 fund administration'),('Amount due','$48,750.00'),('Memo','Includes restatement processing (Halcyon).')])
pdf('Halcyon_Management_Terms.pdf','Halcyon','Management fee terms',[
 ('Annual management rate','1.44%'),('Accrual convention','Actual/365; constant NAV example'),('Calculation period','Calendar days, inclusive; constant NAV'),('Reviewed by','A. Chan, portfolio manager')])
pdf('Manager_Reference_Note.pdf','Apex Pacific','Manager reference note',[
 ('Reference discussion','4 September 2026'),('Reference finding','Former colleague describes a disciplined escalation process; independently corroborate staffing coverage.')])
(ROOT/'Meridian_Statement.eml').write_text('From: ops@meridianam.example\nTo: operations@apexpacific.example\nSubject: Quick confirm on this week statement\n\nQuick confirm on this week statement: we are showing 12,500 AAPL marked at 201.30, cash sits at 3.42M, and the 0.15% management fee looks off - we had 0.12% last month. There are also two FX lines I did not expect.\n')

pdf('Halcyon_August_Fee_Invoice.pdf','Harborline Fund Administration','Halcyon August management fee invoice',[('Invoiced management fee','$22,500.00'),('Period start','1 August 2026'),('Period end','31 August 2026')])
