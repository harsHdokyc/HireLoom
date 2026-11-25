import pdfplumber

path = r"F:\code\dossier-main\HarshVerma_FullStack_Associate.pdf"
with pdfplumber.open(path) as pdf:
    p = pdf.pages[0]
    print("size", p.width, p.height)
    words = p.extract_words(extra_attrs=["size", "fontname"])
    for w in words[:80]:
        print(f"{w['top']:6.1f} {w['x0']:6.1f} sz={w['size']:4.1f} {w['text']}")
    print("---LINES---")
    # Group by roughly same top
    lines = {}
    for w in words:
        key = round(w["top"] / 2) * 2
        lines.setdefault(key, []).append(w)
    for top in sorted(lines)[:40]:
        ws = sorted(lines[top], key=lambda x: x["x0"])
        text = " | ".join(w["text"] for w in ws)
        x0 = min(w["x0"] for w in ws)
        x1 = max(w["x1"] for w in ws)
        print(f"{top:6.1f} x={x0:5.1f}-{x1:5.1f} {text}")
