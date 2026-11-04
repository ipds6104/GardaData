import zipfile
import xml.etree.ElementTree as ET
import re
import json
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DOCX_PATH = r"data\BPS0000-klasifikasi_baku_jabatan_indonesia_kbji_2026.docx"
SERVER_OUT_DIR = r"server\kbji_data"
BACKEND_OUT_DIR = r"backend\kbji_data"

LEVEL_NAMES = {
    1: "golongan_pokok",
    2: "sub_golongan_pokok",
    3: "golongan",
    4: "sub_golongan",
    5: "jabatan"
}

def clean_ligatures(text: str) -> str:
    """Normalize common font ligatures from PDF-to-Word export."""
    if not text:
        return ""
    text = re.sub(r'\bAhLI\b', 'AHLI', text)
    text = re.sub(r'\bUSAhA\b', 'USAHA', text)
    text = re.sub(r'\bKEhUTANAN\b', 'KEHUTANAN', text)
    text = re.sub(r'\bPEKERJA PENGOLAhAN\b', 'PEKERJA PENGOLAHAN', text)
    text = re.sub(r'\bPENGOLAhAN\b', 'PENGOLAHAN', text)
    text = re.sub(r'\bKhUSUS\b', 'KHUSUS', text)
    text = re.sub(r'\bBIJIh\b', 'BIJIH', text)
    text = re.sub(r'\bSAMPAh\b', 'SAMPAH', text)
    text = re.sub(r'\bLIMBAh\b', 'LIMBAH', text)
    text = re.sub(r'\bTANAh\b', 'TANAH', text)
    text = re.sub(r'\bPENGhALUS\b', 'PENGHALUS', text)
    text = re.sub(r'\bPOhON\b', 'POHON', text)
    text = re.sub(r'\bPEMUTIhAN\b', 'PEMUTIHAN', text)
    text = re.sub(r'\bPERANCAh\b', 'PERANCAH', text)
    text = re.sub(r'\bPEMERINTAh\b', 'PEMERINTAH', text)
    text = re.sub(r'\bhASIL\b', 'HASIL', text)
    text = re.sub(r'\bhUTAN\b', 'HUTAN', text)
    text = re.sub(r'\bhOIST\b', 'HOIST', text)
    text = re.sub(r'\bOLAhRAGA\b', 'OLAHRAGA', text)
    text = re.sub(r'\bKESEhATAN\b', 'KESEHATAN', text)
    text = re.sub(r'\bhUKUM\b', 'HUKUM', text)
    text = re.sub(r'\bhAYATI\b', 'HAYATI', text)
    text = re.sub(r'\bPEMECAh\b', 'PEMECAH', text)
    text = re.sub(r'\bhAKIM\b', 'HAKIM', text)
    text = re.sub(r'\bhERBALIS\b', 'HERBALIS', text)
    text = re.sub(r'\bhIPNOTIS\b', 'HIPNOTIS', text)
    text = re.sub(r'\bhORTIKULTURA\b', 'HORTIKULTURA', text)
    text = re.sub(r'\bhIDROLOGI\b', 'HIDROLOGI', text)
    text = re.sub(r'\bhIDROMETEOROLOGI\b', 'HIDROMETEOROLOGI', text)
    text = re.sub(r'\bSEKOLAh\b', 'SEKOLAH', text)
    text = re.sub(r'\bKEJAhATAN\b', 'KEJAHATAN', text)
    text = re.sub(r'\b([A-Z]+)h([A-Z]*)\b', r'\1H\2', text)
    return text.strip()

def format_title_case(raw_title: str) -> str:
    """Format title into readable title case while preserving official Indonesian acronyms."""
    cleaned = clean_ligatures(raw_title)
    words = cleaned.split()
    formatted = []
    acronyms = {
        'TNI', 'POLRI', 'MPR', 'DPR', 'DPRD', 'DPD', 'BPK', 'KPK', 'MK', 'KY',
        'YBDI', 'YTDL', 'KBLI', 'KBJI', 'BUMN', 'BUMD', 'BPS', 'RDF', 'IPLT',
        'SIM', 'KTP', 'UUD', 'APBN', 'APBD', 'UU', 'RUU', 'PERDA', 'ISCO',
        'TIK', 'IT', 'AI', 'SDM', 'POS', 'ATM', 'CCTV', 'GPS', 'LED', 'AC'
    }
    lowercase_words = {'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'atas', 'oleh', 'serta'}
    
    for i, w in enumerate(words):
        bare = re.sub(r'[^A-Za-z0-9]', '', w)
        if bare.upper() in acronyms:
            formatted.append(re.sub(r'[A-Za-z0-9]+', bare.upper(), w))
            continue
        
        if w.startswith('(') and w.endswith(')'):
            inner = w[1:-1]
            if inner.upper() in acronyms:
                formatted.append(f"({inner.upper()})")
            else:
                formatted.append(f"({inner.capitalize()})")
            continue

        lower = w.lower()
        if i > 0 and lower in lowercase_words:
            formatted.append(lower)
        else:
            formatted.append(w.capitalize())
            
    return ' '.join(formatted)

def is_title_line(s: str) -> bool:
    if not s or s.endswith(';') or s.endswith(',') or s.endswith(' dan'):
        return False
    lower = s.lower()
    if lower.startswith('tugas') or lower.startswith('jabatan ini') or lower.startswith('dikecualikan') or lower.startswith('subgolongan') or lower.startswith('golongan dalam'):
        return False
    clean = clean_ligatures(s)
    clean_letters = [c for c in clean if c.isalpha()]
    if not clean_letters:
        return False
    clean_upper = sum(1 for c in clean_letters if c.isupper())
    return (clean_upper / len(clean_letters)) > 0.6 and len(s) < 180

def parse_docx_paragraphs():
    print(f"Reading Word document from {DOCX_PATH}...")
    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        num_xml = z.read('word/numbering.xml')
        doc_xml = z.read('word/document.xml')

    root_num = ET.fromstring(num_xml)
    num_to_abstract = {}
    for num in root_num.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}num'):
        nid = num.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numId')
        ab_elem = num.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}abstractNumId')
        if ab_elem is not None:
            num_to_abstract[nid] = ab_elem.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')

    abstract_lvls = {}
    for absNum in root_num.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}abstractNum'):
        ab_id = absNum.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}abstractNumId')
        abstract_lvls[ab_id] = {}
        for lvl in absNum.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}lvl'):
            ilvl = lvl.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ilvl', '0')
            start_el = lvl.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}start')
            start = int(start_el.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '1')) if start_el is not None else 1
            numFmt_el = lvl.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numFmt')
            numFmt = numFmt_el.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', 'decimal') if numFmt_el is not None else 'decimal'
            lvlText_el = lvl.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}lvlText')
            lvlText = lvlText_el.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '%1') if lvlText_el is not None else '%1'
            abstract_lvls[ab_id][ilvl] = {'start': start, 'numFmt': numFmt, 'lvlText': lvlText}

    counters = {}
    root_doc = ET.fromstring(doc_xml)
    raw_paras = []
    
    for p in root_doc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
        full_text = ''.join(texts).strip()
        prefix = ''
        numPr = p.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr/{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numPr')
        if numPr is not None:
            numId_el = numPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numId')
            ilvl_el = numPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ilvl')
            nid = numId_el.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if numId_el is not None else ''
            ilvl = ilvl_el.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '0') if ilvl_el is not None else '0'
            ab_id = num_to_abstract.get(nid)
            if ab_id and ab_id in abstract_lvls and ilvl in abstract_lvls[ab_id]:
                cfg = abstract_lvls[ab_id][ilvl]
                key = (nid, ilvl)
                if key not in counters:
                    counters[key] = cfg['start']
                else:
                    counters[key] += 1
                curr_val = counters[key]
                fmt = cfg['numFmt']
                if fmt in ['decimal', 'decimalZero']:
                    val_str = f"{curr_val:02d}" if (fmt == 'decimalZero' or nid == '9') else str(curr_val)
                    prefix = cfg['lvlText'].replace('%1', val_str)
                    
        if prefix and full_text:
            line = f'{prefix} {full_text}'
        elif full_text:
            line = full_text
        else:
            line = ''
            
        if line:
            raw_paras.append(line)

    return raw_paras

def stitch_and_clean_paragraphs(raw_paras):
    """Stitch split code/title lines into cohesive headings."""
    stitched = []
    i = 0
    n = len(raw_paras)

    while i < n:
        p = raw_paras[i]

        # Check for 214 and 2141 anomaly
        if p == '214' and i + 2 < n and raw_paras[i+1] == '2141' and is_title_line(raw_paras[i+2]):
            stitched.append(f"214 {raw_paras[i+2]}")
            stitched.append("2141 AHLI TEKNIK INDUSTRI DAN PRODUKSI")
            i += 3
            continue

        m_code = re.match(r'^([0-9]{1,4}|[0-9]{4}\.[0-9]{2})$', p)
        if m_code and i + 1 < n:
            next_p = raw_paras[i+1]
            if is_title_line(next_p) and not re.match(r'^[0-9]', next_p):
                stitched.append(f"{m_code.group(1)} {next_p}")
                i += 2
                continue

        # Check if line starts with a code and title continues on next line
        m_head = re.match(r'^([0-9]{4}\.[0-9]{2})\s*([A-Za-z].*)$', p)
        if m_head and i + 1 < n:
            next_p = raw_paras[i+1]
            if is_title_line(next_p) and not re.match(r'^[0-9]', next_p) and len(next_p) < 60:
                stitched.append(f"{m_head.group(1)} {m_head.group(2).strip()} {next_p.strip()}")
                i += 2
                continue

        stitched.append(p)
        i += 1

    return stitched

def extract_kbji_data():
    raw_paras = parse_docx_paragraphs()
    paras = stitch_and_clean_paragraphs(raw_paras)
    print(f"Stitched paragraphs: {len(paras)}")

    entries = []
    current_entry = None

    def match_header(line: str):
        if re.search(r'\|\s*\d+$', line):
            return None

        m5 = re.match(r'^([0-9]{4}\.[0-9]{2})\s*([A-Za-z].*)$', line)
        if m5:
            return (m5.group(1), 5, m5.group(2).strip())

        m4 = re.match(r'^([0-9]{4})\s*([A-Za-z].*)$', line)
        if m4 and is_title_line(m4.group(2)):
            return (m4.group(1), 4, m4.group(2).strip())

        m3 = re.match(r'^([0-9]{3})\s*([A-Za-z].*)$', line)
        if m3 and is_title_line(m3.group(2)):
            return (m3.group(1), 3, m3.group(2).strip())

        m2 = re.match(r'^([0-9]{2})\s*([A-Za-z].*)$', line)
        if m2 and is_title_line(m2.group(2)):
            return (m2.group(1), 2, m2.group(2).strip())

        m1 = re.match(r'^([0-9])\s*([A-Za-z].*)$', line)
        if m1 and is_title_line(m1.group(2)):
            return (m1.group(1), 1, m1.group(2).strip())

        return None

    seen_codes = set()
    for idx, p in enumerate(paras):
        h = match_header(p)
        if h:
            code, lvl, raw_title = h
            if code in seen_codes:
                continue

            seen_codes.add(code)
            if current_entry:
                entries.append(current_entry)

            current_entry = {
                'kode': code,
                'digit': lvl,
                'level': LEVEL_NAMES[lvl],
                'raw_title': raw_title,
                'judul': format_title_case(raw_title),
                'desc_lines': []
            }
        else:
            if current_entry:
                if not re.search(r'\|\s*\d+$', p):
                    current_entry['desc_lines'].append(p)

    if current_entry:
        entries.append(current_entry)

    print(f"Total raw entries extracted: {len(entries)}")

    entry_map = {e['kode']: e for e in entries}

    for e in entries:
        code = e['kode']
        lvl = e['digit']
        e['deskripsi'] = clean_ligatures(' '.join(e['desc_lines'])).strip()
        del e['desc_lines']

        if lvl == 5:
            e['induk'] = code.split('.')[0]
            e['golongan_pokok_kode'] = code[0]
        elif lvl == 4:
            e['induk'] = code[:3]
            e['golongan_pokok_kode'] = code[0]
        elif lvl == 3:
            e['induk'] = code[:2]
            e['golongan_pokok_kode'] = code[0]
        elif lvl == 2:
            e['induk'] = code[0]
            e['golongan_pokok_kode'] = code[0]
        else:
            e['induk'] = ""
            e['golongan_pokok_kode'] = code

    for e in entries:
        children = [c for c in entries if c['induk'] == e['kode']]
        e['child_count'] = len(children)

    for e in entries:
        crumbs = []
        curr = e
        while curr.get('induk') and curr['induk'] in entry_map:
            p_node = entry_map[curr['induk']]
            crumbs.insert(0, {
                'kode': p_node['kode'],
                'judul': p_node['judul'],
                'level': p_node['level'],
                'digit': p_node['digit']
            })
            curr = p_node
        e['breadcrumbs'] = crumbs

    from collections import Counter
    counts = Counter([e['digit'] for e in entries])
    print("\n--- FINAL EXTRACTED KBJI 2026 SUMMARY ---")
    for lvl in sorted(counts.keys()):
        print(f"Level {lvl} ({LEVEL_NAMES[lvl]}): {counts[lvl]} entitas")

    print(f"Grand Total: {len(entries)} entitas KBJI 2026")

    g1 = [
        {'code': e['kode'], 'title': e['judul'], 'description': e['deskripsi']}
        for e in entries if e['digit'] == 1
    ]
    g2 = [
        {'code': e['kode'], 'title': e['judul'], 'golongan_pokok_code': e['induk'], 'description': e['deskripsi']}
        for e in entries if e['digit'] == 2
    ]
    g3 = [
        {'code': e['kode'], 'title': e['judul'], 'sub_golongan_pokok_code': e['induk'], 'description': e['deskripsi']}
        for e in entries if e['digit'] == 3
    ]
    g4 = [
        {'code': e['kode'], 'title': e['judul'], 'golongan_code': e['induk'], 'description': e['deskripsi']}
        for e in entries if e['digit'] == 4
    ]
    g5 = [
        {'code': e['kode'], 'title': e['judul'], 'sub_golongan_code': e['induk'], 'description': e['deskripsi']}
        for e in entries if e['digit'] == 5
    ]

    for target_dir in [SERVER_OUT_DIR, BACKEND_OUT_DIR]:
        os.makedirs(target_dir, exist_ok=True)
        print(f"\nSaving JSON files to {target_dir}...")
        
        with open(os.path.join(target_dir, '01_golongan_pokok.json'), 'w', encoding='utf-8') as f:
            json.dump(g1, f, ensure_ascii=False, indent=2)
            
        with open(os.path.join(target_dir, '02_sub_golongan_pokok.json'), 'w', encoding='utf-8') as f:
            json.dump(g2, f, ensure_ascii=False, indent=2)
            
        with open(os.path.join(target_dir, '03_golongan.json'), 'w', encoding='utf-8') as f:
            json.dump(g3, f, ensure_ascii=False, indent=2)
            
        with open(os.path.join(target_dir, '04_sub_golongan.json'), 'w', encoding='utf-8') as f:
            json.dump(g4, f, ensure_ascii=False, indent=2)
            
        with open(os.path.join(target_dir, '05_jabatan.json'), 'w', encoding='utf-8') as f:
            json.dump(g5, f, ensure_ascii=False, indent=2)

        with open(os.path.join(target_dir, 'kbji_2026_all_items.json'), 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)

        with open(os.path.join(target_dir, 'kbji_2014_all_items.json'), 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)

    print("\n✅ Ekstraksi KBJI 2026 selesai 100%!")

if __name__ == '__main__':
    extract_kbji_data()
