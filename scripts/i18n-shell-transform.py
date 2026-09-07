"""Replace hard-coded English copy in the v2 shell with t('shell.<file>.<slug>') calls.
Dry run prints replacements and flags; --apply writes files and a keys JSON."""
import re, sys, json, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
FILES=['DesktopShell','MobileShell','PageHeader','PlayPage','MoneyPage','CareerPage','LearnPage','LifePage','MoreScreen','MonthlyActionsPreview','FirstSteps','ActionsScreen','ActionsDrawer','ProfileScreen','EventFeed','SignalsStack','CommandDashboard','NextBestStep']
APPLY='--apply' in sys.argv
keys={}
def slug(text):
    s=re.sub(r'[^a-zA-Z0-9]+',' ',text).strip().lower().split()
    s='_'.join(s[:5]) or 'text'
    return s
def key_for(file, text):
    base=f"shell.{file[0].lower()+file[1:]}.{slug(text)}"
    k=base; i=2
    while k in keys and keys[k]!=text: k=f"{base}_{i}"; i+=1
    keys[k]=text; return k
def is_copy(text):
    t=text.strip()
    if '\n' in t: return False
    if not re.search(r'[A-Za-z]{3,}', t): return False
    if re.match(r'^[a-z][a-zA-Z0-9]*$', t): return False          # identifiers
    if re.search(r'[{}<>;=()\[\]|]', t): return False
    if re.search(r'\b(const|return|typeof|void|string|number|boolean|React)\b', t): return False
    if not re.match(r'^[A-Za-z0-9+\-—•✓⚠💍💕🎁💡📉📈🧭🏆]', t): return False
    return True
for name in FILES:
    path=f"{ROOT}/components/v2/{name}.tsx"; src=open(path).read(); orig=src; n=0; flags=[]
    # 1. JSX text nodes: >Text< possibly with surrounding whitespace/newlines
    def jsx_text(m):
        global n
        text=m.group(2).strip()
        if not is_copy(text) or "'" in text and '"' in text: return m.group(0)
        n+=1; return f"{m.group(1)}{{t('{key_for(name,text)}')}}{m.group(3)}"
    src=re.sub(r'(>)([^<>{}]*?)(\s*<)', lambda m: jsx_text(m) if is_copy(m.group(2)) else m.group(0), src)
    # 2. JSX string attributes
    def attr(m):
        global n
        text=m.group(2)
        if not is_copy(text): return m.group(0)
        n+=1; return f"{m.group(1)}={{t('{key_for(name,text)}')}}"
    src=re.sub(r'\b(title|placeholder|aria-label|ariaLabel|label|description|subtitle|helper|hint|detail|tooltip|body|impact|cta|eyebrow|caption|emptyLabel|badge|text)="([^"{}]+)"', attr, src)
    # 3. object-literal values and ternary string literals with copy (single-quoted, starting uppercase)
    def objval(m):
        global n
        text=m.group(2)
        if not is_copy(text) or not text[0].isupper() and not text[0] in '💍💕⚠': return m.group(0)
        n+=1; return f"{m.group(1)}t('{key_for(name,text)}')"
    src=re.sub(r"\b((?:title|body|impact|cta|label|detail|description|subtitle|helper|hint|text|name|tooltip|message|eyebrow|caption|kicker|summary|note):\s*)'([^'\n]{3,})'", objval, src)
    # ternaries / logical text inside JSX braces: ? 'Text' : 'Text' and && 'Text'
    def tern(m):
        global n
        text=m.group(2)
        if not is_copy(text) or not (text[0].isupper() or text[0] in '💍💕⚠'): return m.group(0)
        n+=1; return f"{m.group(1)}t('{key_for(name,text)}')"
    src=re.sub(r"(\?\s*|:\s*|&&\s*)'([A-Z💍💕⚠][^'\n]{2,})'(?=\s*[:)}\n;,])", tern, src)
    # flags: remaining suspicious literals
    for m in re.finditer(r"'([A-Z][a-zA-Z ,.'!?-]{5,})'|\"([A-Z][a-zA-Z ,.!?-]{5,})\"", src):
        text=m.group(1) or m.group(2)
        if 'className' in src[max(0,m.start()-40):m.start()]: continue
        flags.append(text)
    # hook + import
    if n and "useI18n" not in orig:
        src=src.replace("import React", "import { useI18n } from '../../i18n';\nimport React",1)
    if n:
        lines=src.split('\n'); out=[]; i=0; added=0
        while i < len(lines):
            line=lines[i]; out.append(line)
            if re.match(r'^(?:export )?(?:const|function)\s+[A-Z]\w*', line) and not re.match(r'^(?:export )?const\s+[A-Z_]+\s*[:=]\s*(\[|\{|\d|["\'])', line):
                # find the end of the parameter list within 60 lines
                for j in range(i, min(i+60, len(lines))):
                    l=lines[j]
                    if re.search(r'=>\s*\{\s*$', l) or re.match(r'^(?:export )?function\s+[A-Z]\w*\(.*\)\s*(?::\s*[^{]+)?\{\s*$', l):
                        if j>i: out.extend(lines[i+1:j+1])
                        if "useI18n()" not in '\n'.join(lines[j+1:j+4]) and "t: (key" not in '\n'.join(lines[i:j+1]):
                            out.append("  const { t } = useI18n();"); added+=1
                        i=j; break
                    if re.match(r'^(?:export )?(?:const|function|type|interface)\s', l) and j>i: break
            i+=1
        src='\n'.join(out)
    print(f"== {name}: {n} replacements, hooks added: {src.count("const { t } = useI18n();")}, flags: {flags[:8]}")
    if APPLY and src!=orig: open(path,'w').write(src)
if APPLY:
    json.dump(keys, open('/private/tmp/claude-501/-Users-pietervanderwalt-Desktop-Current-High-Value-Apps-tycoon-step-main-2/ab55fde6-02d4-4044-83ce-9209b080d8cf/scratchpad/i18n/keys.json','w'), indent=1, ensure_ascii=False)
print('keys', len(keys))
