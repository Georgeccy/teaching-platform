# -*- coding: utf-8 -*-
"""智学平台 · 课件同步编排器 (sync_courseware.py)
功能：
  1. 从【四个班型】桌面文件夹同步所有阅读 / 写作网页课件：
       加速班【港】 / 真题&模拟题 / 预备班 / 加速班【内地】
  2. 按「班型(classType)」对课件归类：manifest 标记 classType/className，
     单元库页面按班型分节展示（带筛选 chip + 班型配色）。
  3. 为每个单元挑选【最高版本/最新修改】的网页课件落盘：
     - 单文件课件 → courseware/{kind}/unit{N}.html
     - 文件夹项目（入口 HTML 引用本地 css/js/assets）→ 整目录复制为
       courseware/{kind}/unit{N}/，相对资源路径完整保留。
  4. 用最新语法讲义 md 刷新冲刺课（并重新生成 sprint.html）。
  5. 依据 manifest.json 自动重建 reading.html / writing.html（新增单元自动出现）。

设计要点：
  - 不再硬编码单一源目录；四个班型文件夹均为同步来源。
  - 班型内单元号保持 1..N（展示用），但落盘文件名用 base 偏移后的全局号，
    既保留可读的单元号，又彻底避免跨班型同名单元（如两班都有 Unit 1）互相覆盖。
  - reading-app.html 依赖 courseware/reading/unit{N}.html（N=1..5 指向加速班【港】
    阅读单元），故加速班【港】 base=0，其阅读单元 1..5 仍落在 unit1..unit5，兼容性不变。
  - 文件夹项目统一落盘为 courseware/{kind}/unit{N}/（单文件为 unit{N}.html）；
    进度上报注入的 assets 路径前缀按落盘深度自动计算，两种形态都正确。
  - 合并读写课件（标题/路径含「读写」）会同时进入 阅读 与 写作 两个库（共享同一单元号）。
  - manifest.json 保存你手写的单元标题/简介；脚本只刷新「版本号 / 班型 / 新增单元」。
  - 纯标准库 + 复用 build_sprint.py，无新增依赖。
"""
import os, re, json, shutil, subprocess, sys

PROJ = "/Users/chenchengyu/Developer/zhixue-platform"
DESKTOP = "/Users/chenchengyu/Desktop"
MANIFEST = os.path.join(PROJ, "courseware", "manifest.json")
PALETTE = ["pink", "blue", "yellow", "green", "teal", "purple", "orange"]
KIND_LABEL = {"reading": "Reading", "writing": "Writing"}

# ---------- 班型配置（同步来源 + 归类 + 落盘 base 偏移 + 配色） ----------
# base：该班型单元落盘时的全局号起点，确保跨班型不碰撞。
# color：单元库卡片按班型统一配色，强化「归类」视觉。
CLASS_TYPES = [
    {"slug": "acc_hk",   "name": "加速班（港）",   "dir": "加速班【港】",   "base": 0,   "color": "pink"},
    {"slug": "pastmock", "name": "真题 & 模拟题", "dir": "真题&模拟题",   "base": 100, "color": "yellow"},
    {"slug": "prep",     "name": "预备班",        "dir": "预备班",        "base": 200, "color": "blue"},
    {"slug": "acc_main", "name": "加速班（内地）", "dir": "加速班【内地】", "base": 300, "color": "green"},
    # 翻译检索类课件（如「DSE范文翻译练习_检索课件」系列）单独成集，与各班型练习并列展示，
    # 不归入任一班型子集。其源文件仍位于「加速班【内地】」桌面文件夹，仅扫描时按文件名过滤分流。
    {"slug": "translate","name": "翻译专项练习",  "dir": "加速班【内地】", "base": 400, "color": "purple"},
]
CT_BY_SLUG = {c["slug"]: c for c in CLASS_TYPES}

# 各单元主薄弱点映射（用于教师看板薄弱点排行；演示用合理默认值，可后续细化）
WEAK_MAP = {
    "reading": {1: "attitude", 2: "pronoun", 3: "tfng", 4: "attitude", 5: "pronoun"},
    "writing": {1: "wordform", 2: "conjunction", 3: "wordform", 4: "conjunction", 5: "wordform"},
}

# 扫描时跳过的目录 / 文件标记
EXCLUDE_DIR_MARKERS = (".", "暂时不用", ".build", "旧版", "node_modules", "__pycache__")
EXCLUDE_FILE_MARKERS = ("讲义", "学生版", "教师版", "答案", "备份", "backup", "~")
# 课堂讲义 / 学生版 / 教师版 等「非课件本体」标记（与上方部分重复，保留以兼容历史命名）
LECTURE_MARKERS = ("课堂讲义", "学生版", "教师版", "讲义", "翻译练习", "补充翻译")

# ---------- 进度上报注入（prefix 适配单文件与文件夹项目两种落盘深度） ----------
LOCAL_REF_RE = re.compile(r'(?:href|src)=["\']((?:\.\.?/)*((?:css|js|assets|lib|vendor|images|image)/)[^"\']*)', re.I)

def progress_inject_block(prefix, kind, storage_num, wk):
    unit = "%s-u%d" % (kind, storage_num)
    if kind == "reading":
        cfg = ("window.__ZX__={kind:'reading',unit:'%s',weakKey:'%s',mode:'score',"
               "selCorrect:'.score-badge .sb-correct',selTotal:'.score-badge .sb-total'};"
               % (unit, wk))
    else:
        cfg = "window.__ZX__={kind:'writing',unit:'%s',weakKey:'%s',mode:'quiz'};" % (unit, wk)
    return ('<script src="%sassets/app.js"></script>\n' % prefix) + \
           ('<script src="%sassets/courseware-progress.js"></script>\n' % prefix) + \
           ('<script>%s</script>\n' % cfg)

def inject_progress(html, prefix, kind, storage_num, wk):
    """把进度上报脚本注入到 </body> 之前（若已注入则跳过，幂等）。"""
    if "courseware-progress.js" in html:
        return html
    block = progress_inject_block(prefix, kind, storage_num, wk)
    idx = html.rfind("</body>")
    if idx == -1:
        idx = len(html)
        html = html + block
    else:
        html = html[:idx] + block + html[idx:]
    return html

def strip_injection(html):
    """去掉我们注入的进度上报脚本块（兼容 ../ 与 ../../ 两种深度），用于判断源文件是否真变化。"""
    html = re.sub(r'<script src="(\.\./)*assets/app\.js"></script>\s*', '', html)
    html = re.sub(r'<script src="(\.\./)*assets/courseware-progress\.js"></script>\s*', '', html)
    html = re.sub(r'<script>window\.__ZX__=\{.*?\};\s*</script>\s*', '', html, flags=re.S)
    return html

# ---------- 课件识别 ----------
def extract_unit(fname, dname):
    """提取单元号（Unit/单元/Module → 数字；真题年份 20xx 作为兜底）。

    文件名与目录名都参与识别——文件夹项目的年份通常在目录名上（如 2021DSE-Paper1_v5），
    而入口是 index.html，故年份兜底需同时扫描目录名。"""
    for src in (fname, dname):
        m = re.search(r"(?:unit|单元|module)\s*(\d+)", src, re.IGNORECASE)
        if m:
            return int(m.group(1))
    for src in (fname, dname):      # 年份兜底：文件名或目录名含 20xx（真题年份）
        m = re.search(r"(20\d{2})", src)
        if m:
            return int(m.group(1))
    return None

def extract_title(fp):
    """读取 HTML 的 <title>，用于更准的 阅读/写作 归类。"""
    try:
        t = open(fp, encoding="utf-8", errors="ignore").read()
    except OSError:
        return ""
    m = re.search(r"<title>(.*?)</title>", t, re.I | re.S)
    return m.group(1) if m else ""

def classify_kinds(fname, dname, title=""):
    """推断课件归属的阅读/写作集合：{'reading'} / {'writing'} / {'reading','writing'}（合并读写）。

    规则：文件名/目录名/标题含 阅读|reading → reading；写作|writing → writing；
    「读写」→ 两者（预备班整合读写网页课件）；DSE Paper1/2 → 阅读/写作。
    合并读写仅由入口自身（文件名 / 标题）判定，避免父目录「读写Unit N」把分开的
    Reading / Writing 单文件都误判成 both。完全无法判定时默认 Reading。"""
    s_all = (fname + " " + dname + " " + title).lower()
    s_self = (fname + " " + title).lower()
    kinds = set()
    if "reading" in s_all or "阅读" in s_all:
        kinds.add("reading")
    if "writing" in s_all or "写作" in s_all:
        kinds.add("writing")
    if "读写" in s_self:                 # 合并读写课件：仅入口自身标明（非父目录名）
        kinds.update(["reading", "writing"])
    if "paper1" in s_all or "paper 1" in s_all:
        kinds.add("reading")
    if "paper2" in s_all or "paper 2" in s_all:
        kinds.add("writing")
    if not kinds:
        kinds.add("reading")
    return kinds

def is_excluded_dir(d):
    d = d.strip()  # 容错：Finder 重命名可能带入首尾空格
    return (d.startswith(".")
            or "暂时不用" in d
            or ".build" in d
            or "旧版" in d
            or "node_modules" in d
            or "__pycache__" in d)

def is_courseware_name(f):
    """文件名明显是「课件本体」（而非讲义/答案/学生版等派生材料）的信号。

    用于放宽 LECTURE_MARKERS / EXCLUDE_FILE_MARKERS 的排除：名字带
    「课件 / 检索 / courseware / deck」的，无论是否含「翻译练习」等都按课件处理。"""
    s = f.lower()
    return ("课件" in f) or ("检索" in f) or ("courseware" in s) or ("deck" in s)

def is_standalone_file(f):
    """翻译检索类课件（如「DSE范文翻译练习_检索课件」系列）单独成集，
    与各班型练习集合并列展示，不归入任一班型子集。

    判定：文件名同时含「翻译练习」与「检索课件」。命中则在扫描时从 acc_main
    班型分流到独立的 translate 集合（同一桌面源文件夹，仅按文件名过滤）。"""
    return ("翻译练习" in f) and ("检索课件" in f)

def find_entry_html(r, files):
    """在目录 r 的文件列表中找入口 HTML：优先 index.html，否则首个非排除 .html。"""
    htmls = [f for f in files
             if f.endswith(".html")
             and not any(m in f for m in EXCLUDE_FILE_MARKERS)
             and not (any(m in f for m in LECTURE_MARKERS) and not is_courseware_name(f))]
    if not htmls:
        return None
    if "index.html" in htmls:
        return "index.html"
    return sorted(htmls)[0]

def html_refs_local(html):
    """判断入口 HTML 是否引用本地子资源（css/ js/ assets/ …），用于识别「文件夹项目」。"""
    return bool(LOCAL_REF_RE.search(html))

def asset_prefix(dest_rel):
    """根据落盘入口文件的相对路径，算出回到项目根目录所需的 ../ 数量。"""
    d = os.path.dirname(dest_rel)
    depth = 0 if d == "" else len(d.split("/"))
    return "../" * depth

def ignore_copytree(dir, names):
    return [n for n in names if n.startswith(".") or n in (".DS_Store", "Thumbs.db", "__pycache__")]

def safe_mtime(fp):
    try:
        return os.path.getmtime(fp)
    except OSError:
        return 0

def scan_class_type(ct):
    """扫描单个班型文件夹，返回 {kind: {storage_num: info}}。

    同时支持两种课件形态：
      - 单文件课件：一个 .html 文件（自包含，不引用本地子资源）。
      - 文件夹项目：含入口 HTML 且该 HTML 引用本地 css/ js/ assets 的目录
        （如预备班 / 真题的网页课件项目）。
    每个 (单元号, 阅读/写作) 组合挑选「修改时间最新、其次版本号高」的最佳课件。
    合并读写课件（标题/路径含「读写」）会同时进入 阅读 与 写作 两个库（同一 storage_num）。
    """
    root = os.path.join(DESKTOP, ct["dir"])
    candidates = []
    warnings = []
    if not os.path.isdir(root):
        warnings.append("⚠️ 班型目录不存在，已跳过：%s" % ct["dir"])
        return {}, warnings

    # 1) 文件夹项目：含入口 HTML 且引用本地子资源
    proj_dirs = []
    for r, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if not is_excluded_dir(d)]
        entry = find_entry_html(r, files)
        if entry is None:
            continue
        # 翻译检索类课件单独成集（slug=translate），不入各班型；反之亦然
        if ct["slug"] == "acc_main" and is_standalone_file(entry):
            continue
        if ct["slug"] == "translate" and not is_standalone_file(entry):
            continue
        ep = os.path.join(r, entry)
        try:
            html = open(ep, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        if not html_refs_local(html):
            continue
        proj_dirs.append(r)
        dirs[:] = []  # 不再深入项目内部（避免把子页当作独立项目）
        title = extract_title(ep)
        kinds = classify_kinds(entry, os.path.basename(r), title)
        uno = extract_unit(entry, os.path.basename(r))
        vm = re.search(r"_?v(\d+)", os.path.basename(r), re.I) or re.search(r"_?v(\d+)", entry, re.I)
        ver = int(vm.group(1)) if vm else 0
        if uno is None:
            warnings.append("⚠️ %s：无法判定单元号，将排在最后" % os.path.basename(r))
        candidates.append({
            "is_folder": True, "folder": r, "entry": entry, "src": ep,
            "ver": ver, "uno": uno, "fname": os.path.basename(r),
            "ct": ct, "kinds": list(kinds), "mtime": safe_mtime(ep),
        })

    proj_dir_set = set(proj_dirs)
    # 2) 单文件课件：不在任何文件夹项目内的 .html
    for r, dirs, files in os.walk(root):
        if any(r == p or r.startswith(p + "/") for p in proj_dir_set):
            dirs[:] = []
            continue
        dirs[:] = [d for d in dirs if not is_excluded_dir(d)]
        for f in files:
            if not f.endswith(".html"):
                continue
            if any(mk in f for mk in EXCLUDE_FILE_MARKERS) or (any(mk in f for mk in LECTURE_MARKERS) and not is_courseware_name(f)):
                continue
            # 翻译检索类课件单独成集（slug=translate），不入各班型；反之亦然
            if ct["slug"] == "acc_main" and is_standalone_file(f):
                continue
            if ct["slug"] == "translate" and not is_standalone_file(f):
                continue
            fp = os.path.join(r, f)
            dname = os.path.basename(r)
            title = extract_title(fp)
            kinds = classify_kinds(f, dname, title)
            uno = extract_unit(f, dname)
            vm = re.search(r"_?v(\d+)", f, re.I)
            ver = int(vm.group(1)) if vm else 0
            if uno is None and kinds == {"reading"}:
                warnings.append("⚠️ %s：无法判定单元号，默认归 Reading" % f)
            candidates.append({
                "is_folder": False, "src": fp, "ver": ver, "uno": uno,
                "fname": f, "ct": ct, "kinds": list(kinds), "mtime": safe_mtime(fp),
            })

    # 3) 按 (uno, kind) 分组，每组挑最佳；再按 uno 顺序分配 storage_num（base 偏移）
    groups = {}
    for c in candidates:
        for k in c["kinds"]:
            groups.setdefault((c["uno"], k), []).append(c)
    unos = sorted({c["uno"] for c in candidates},
                  key=lambda u: (1, float("inf")) if u is None else (0, u))
    uno_idx = {u: i + 1 for i, u in enumerate(unos)}
    result = {}
    for (uno, kind), cands in groups.items():
        # 文件夹项目优先于单文件（保留完整子资源）；同形态下版本号高、其次修改时间新
        cands.sort(key=lambda c: (1 if c["is_folder"] else 0, c["ver"], c["mtime"]), reverse=True)
        best = cands[0]
        sn = ct["base"] + uno_idx[uno]
        best["storage_num"] = sn
        result.setdefault(kind, {})[sn] = best
    return result, warnings

def copy_scanned(scanned):
    """把扫描结果落盘：单文件 → courseware/{kind}/unit{N}.html；
    文件夹项目 → courseware/{kind}/unit{N}/ 整目录复制，并注入进度上报（深度适配）。"""
    report = []
    for kind in ("reading", "writing"):
        dest_dir = os.path.join(PROJ, "courseware", kind)
        os.makedirs(dest_dir, exist_ok=True)
        for sn in sorted(scanned.get(kind, {})):
            info = scanned[kind][sn]
            ct = info["ct"]
            uno = info["uno"]
            ver = info["ver"]
            wk = WEAK_MAP.get(kind, {}).get(uno, "general") if uno in (1, 2, 3, 4, 5) else "general"
            if info["is_folder"]:
                sub = "unit%d" % sn
                dst_dir = os.path.join(dest_dir, sub)
                entry_rel = "courseware/%s/%s/%s" % (kind, sub, info["entry"])
                prefix = asset_prefix(entry_rel)
                changed = True
                if os.path.isdir(dst_dir):
                    entry_old = os.path.join(dst_dir, info["entry"])
                    if os.path.exists(entry_old):
                        with open(entry_old, encoding="utf-8", errors="ignore") as fh:
                            old = fh.read()
                        with open(info["src"], encoding="utf-8", errors="ignore") as fh:
                            new = fh.read()
                        changed = strip_injection(old) != new
                if os.path.isdir(dst_dir):
                    shutil.rmtree(dst_dir)
                shutil.copytree(info["folder"], dst_dir, ignore=ignore_copytree)
                entry_abs = os.path.join(dst_dir, info["entry"])
                with open(entry_abs, "r", encoding="utf-8", errors="ignore") as fh:
                    html = fh.read()
                html = inject_progress(html, prefix, kind, sn, wk)
                with open(entry_abs, "w", encoding="utf-8") as fh:
                    fh.write(html)
                after = os.path.getsize(entry_abs)
                status = "已更新" if changed else "无变化"
                report.append((kind, sn, ver, ct["name"], status, 0, after, info["fname"]))
            else:
                dst = os.path.join(dest_dir, "unit%d.html" % sn)
                existed = os.path.exists(dst)
                before = os.path.getsize(dst) if existed else 0
                with open(info["src"], "r", encoding="utf-8", errors="ignore") as fh:
                    src_html = fh.read()
                if existed:
                    with open(dst, "r", encoding="utf-8", errors="ignore") as fh:
                        old = fh.read()
                    changed = strip_injection(old) != src_html
                else:
                    changed = True
                shutil.copy2(info["src"], dst)
                prefix = asset_prefix("courseware/%s/unit%d.html" % (kind, sn))
                with open(dst, "r", encoding="utf-8", errors="ignore") as fh:
                    html = fh.read()
                html = inject_progress(html, prefix, kind, sn, wk)
                with open(dst, "w", encoding="utf-8") as fh:
                    fh.write(html)
                after = os.path.getsize(dst)
                status = "新增" if not existed else ("已更新" if changed else "无变化")
                report.append((kind, sn, ver, ct["name"], status, before, after, info["fname"]))
    return report

# ---------- 冲刺课刷新 ----------
def rebuild_sprint():
    md_src = None
    # 在四个班型文件夹中查找语法讲义 md（优先「讲练教案」完整源），取最新修改者
    candidates = []
    for ct in CLASS_TYPES:
        root = os.path.join(DESKTOP, ct["dir"])
        if not os.path.isdir(root):
            continue
        for r, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if not d.startswith(".") and "暂时不用" not in d]
            for f in files:
                if "语法讲义" in f and f.endswith(".md"):
                    candidates.append((safe_mtime(os.path.join(r, f)), os.path.join(r, f)))
    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        md_src = candidates[0][1]
    sprint_md = os.path.join(PROJ, "courseware", "grammar", "sprint_source.md")
    if md_src and os.path.exists(md_src):
        shutil.copy2(md_src, sprint_md)
        msg = "语法源 md 已刷新：%s" % os.path.basename(md_src)
    else:
        msg = "未找到桌面语法讲义 md，使用项目内现有 sprint_source.md"
    build = os.path.join(PROJ, "courseware", "grammar", "build_sprint.py")
    if os.path.exists(build):
        rr = subprocess.run([sys.executable, build], capture_output=True, text=True)
        if rr.returncode == 0:
            msg += " → sprint.html 已重新生成"
        else:
            msg += " → ⚠️ 冲刺课生成失败：%s" % rr.stderr.strip().splitlines()[-1]
    return msg

# ---------- manifest + 重建库页 ----------
def load_manifest():
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    return {"reading": {}, "writing": {}}

def make_title(kind, info):
    uno, fname = info["uno"], info["fname"]
    if uno is not None and uno >= 2000:
        return "DSE %d 真题" % uno
    if uno is not None:
        return "%s Unit %d" % (KIND_LABEL[kind], uno)
    base = fname[:-5] if fname.endswith(".html") else fname
    base = re.sub(r"_?v\d+$", "", base)
    base = (base.replace("香港加速班_", "").replace("加速班_", "")
                .replace("预备班_", "").replace("网页课件", "").replace("_", " ").strip())
    return base[:40] or (KIND_LABEL[kind] + " 课件")

def clean_title(raw):
    """把课件 <title>（如 '2021 DSE Paper 1 阅读卷 · 网页课件 v5'）清洗成卡片标题。"""
    if not raw:
        return ""
    t = raw.strip()
    # 去掉括号里的版本信息，如 (V7 MAX · v6)
    t = re.sub(r"\([^)]*?(?:MAX|ver|v\d)[^)]*?\)", "", t, flags=re.I)
    # 去掉「网页课件」及周围分隔符
    t = re.sub(r"\s*[·•\-–—]\s*网页课件", "", t, flags=re.I)
    t = t.replace("网页课件", "")
    # 去掉独立的版本号 token，如 V7 / v6
    t = re.sub(r"\s*[Vv]\d+(\s*MAX)?", "", t)
    t = re.sub(r"\s*[·•]\s*[Vv]\d+", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = t.strip(" ·•-–—")
    return t

def read_courseware_html(kind, sn, info):
    if info.get("is_folder"):
        p = os.path.join(PROJ, "courseware", kind, "unit%d" % sn, info.get("entry") or "index.html")
    else:
        p = os.path.join(PROJ, "courseware", kind, "unit%d.html" % sn)
    if os.path.exists(p):
        try:
            with open(p, encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""
    return ""

def extract_real_title(kind, sn, info):
    """从课件真实内容抽取标题：优先 <title>，其次首个 <h1>，再退化到 make_title。"""
    html = read_courseware_html(kind, sn, info)
    if not html:
        return ""
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    raw = m.group(1).strip() if m else ""
    if not raw:
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
        raw = m.group(1).strip() if m else ""
    if raw:
        raw = re.sub(r"<[^>]+>", "", raw)  # 去掉内部标签
        return clean_title(raw)
    return ""

def update_manifest(manifest, scanned):
    """把扫描到的桌面单元写回 manifest，并保留「课件生成工坊」手动发布的
    studio 条目。每个条目标记 classType / className（班型归类）。

    关键防御：桌面单元用 base 偏移后的全局号作 key，跨班型天然不碰撞；
    studio 条目（非数字 key）单独保留，桌面单元不得占用其 key。"""
    for kind in ("reading", "writing"):
        sec = manifest.setdefault(kind, {})
        used = {k for k in sec if sec[k].get("studio")}  # studio 占用key不得覆盖
        for sn in sorted(scanned.get(kind, {})):
            info = scanned[kind][sn]
            key = str(sn)
            if key in used:
                # 极端情况下与 studio key 撞车，顺延到最小空闲数字 key
                cand = 1
                while str(cand) in used:
                    cand += 1
                key = str(cand)
            used.add(key)
            entry = sec.get(key, {})
            # 稳定身份标识：班型 + 单元号 + 文件名。仅当身份一致时才保留手填标题等，
            # 否则（同 key 下方换成了别的单元，如跨次运行的编号漂移）必须重新生成，
            # 避免陈旧标题「粘」在错误的单元上。
            ident = "%s|%s|%s" % (info["ct"]["slug"], info["uno"], info["fname"])
            same_unit = entry.get("_id") == ident
            # 标题：默认从课件真实内容抽取（与文本一致）；手填标题加 lockTitle 可锁定不被覆盖
            if entry.get("lockTitle"):
                pass  # 保留手填标题
            else:
                real = extract_real_title(kind, sn, info)
                if real:
                    entry["title"] = real
                elif "title" not in entry:
                    entry["title"] = make_title(kind, info)
            if "desc" not in entry or not same_unit:
                entry["desc"] = "DSE %s 单元，配套完整交互课件。" % ("Paper 1" if kind == "reading" else "Paper 2")
            if "sub" not in entry or not same_unit:
                entry["sub"] = "%s · %s" % (info["ct"]["name"], "Paper 1" if kind == "reading" else "Paper 2")
            if "tag" not in entry or not same_unit:
                entry["tag"] = info["ct"]["name"]
            if "color" not in entry or not same_unit:
                entry["color"] = info["ct"]["color"]
            if "progress" not in entry:
                entry["progress"] = 0
            entry["_id"] = ident
            entry["version"] = info["ver"]
            if info["is_folder"]:
                entry["file"] = "courseware/%s/unit%d/%s" % (kind, sn, info["entry"])
                entry["isFolder"] = True
            else:
                entry["file"] = "courseware/%s/unit%d.html" % (kind, sn)
                entry["isFolder"] = False
            entry["classType"] = info["ct"]["slug"]
            entry["className"] = info["ct"]["name"]
            entry["unitNo"] = info["uno"] if info["uno"] is not None else None
            sec[key] = entry
        # 删除库里已不存在的桌面单元（保留 studio 条目）
        for k in list(sec.keys()):
            if k not in used and not sec[k].get("studio"):
                del sec[k]
        manifest[kind] = sec

def render_card(kind, key, e):
    n = int(key)
    ver = e.get("version", 0)
    sub = e["sub"]
    if ver > 0:
        sub += " · V%d MAX" % ver
    color = e.get("color", "blue")
    title = e["title"]
    desc = e["desc"]
    href = e.get("file") or ("courseware/%s/unit%d.html" % (kind, n))
    return (
        '        <div class="card" data-href="%s">\n'
        '          <button class="fav" type="button" aria-label="收藏此单元" title="收藏此单元">☆</button>\n'
        '          <div class="cap" style="background:var(--%s)">U%d</div>\n'
        '          <h3>%s</h3>\n'
        '          <div class="sub">%s</div>\n'
        '          <div class="desc">%s</div>\n'
        '          <a class="go" href="%s" target="_blank">打开课件 →</a>\n'
        "        </div>" % (href, color, n, title, sub, desc, href)
    )

def build_library_page(kind, manifest):
    sec = manifest.get(kind, {})
    # 按班型分组
    groups = {}
    for key in sec:
        e = sec[key]
        slug = e.get("classType") or "other"
        groups.setdefault(slug, []).append((int(key), e))

    sections = []
    total = 0
    for ct in CLASS_TYPES:
        items = groups.get(ct["slug"], [])
        if not items:
            continue
        items.sort(key=lambda x: x[0])
        cards = "\n".join(render_card(kind, k, e) for k, e in items)
        total += len(items)
        sections.append(
            '      <section class="bx-sec" data-bx="%s">\n'
            '        <div class="bx-head"><h2>%s</h2><span class="pixel">%d UNITS</span><button class="bx-collapse" type="button" aria-label="折叠或展开该班型">▾</button><span class="grip" title="拖拽排序">⠿</span></div>\n'
            '        <section class="grid">\n%s\n        </section>\n'
            "      </section>" % (ct["slug"], ct["name"], len(items), cards)
        )
    sections_html = '<div id="bxList">\n' + "\n".join(sections) + "\n      </div>"

    # 班型筛选 chip（班型按钮单独包进 #chipOrder，以便与课型区块同步拖拽排序）
    class_chips = []
    for ct in CLASS_TYPES:
        if ct["slug"] in groups:
            class_chips.append('<button class="chip" data-f="%s">%s</button>' % (ct["slug"], ct["name"]))
    class_chips_html = "\n".join(class_chips)

    hero = HERO[kind]
    nav_r = "active" if kind == "reading" else ""
    nav_w = "active" if kind == "writing" else ""
    return PAGE_TEMPLATE.format(
        kind=KIND_LABEL[kind], kind_slug=kind, nav_r=nav_r, nav_w=nav_w, logo=KIND_LOGO[kind],
        count=total, cap_pixel=total, hero=hero,
        class_chips=class_chips_html, sections=sections_html,
    )

KIND_LOGO = {
    "reading": '<span class="lg-en">READING</span><span class="lg-cn">阅读单元库</span>',
    "writing": '<span class="lg-en">WRITING</span><span class="lg-cn">写作单元库</span>',
}

HERO = {
    "reading": """
      <section class="hero">
        <div class="thumb">
          <svg viewBox="0 0 40 40" width="64" height="64" aria-hidden="true">
            <rect x="6" y="4" width="28" height="6" fill="#2E2A3B"/>
            <rect x="6" y="14" width="28" height="6" fill="#2E2A3B"/>
            <rect x="6" y="24" width="28" height="6" fill="#2E2A3B"/>
            <rect x="6" y="34" width="28" height="6" fill="#2E2A3B"/>
            <rect x="2" y="2" width="4" height="36" fill="#FFC83D"/>
          </svg>
        </div>
        <div>
          <span class="tag">PAPER 1 · READING</span>
          <h1>Reading 单元库</h1>
          <p>按班型分类的 DSE 阅读课件：加速班（港）、真题 &amp; 模拟题、预备班、加速班（内地）。点击任意单元即可打开完整交互课件（含词汇、练习与讨论）。</p>
        </div>
      </section>""",
    "writing": """
      <section class="hero">
        <div class="thumb">
          <svg viewBox="0 0 40 40" width="64" height="64" aria-hidden="true">
            <rect x="8" y="6" width="24" height="5" fill="#2E2A3B"/>
            <rect x="8" y="16" width="24" height="5" fill="#2E2A3B"/>
            <rect x="8" y="26" width="24" height="5" fill="#2E2A3B"/>
            <rect x="2" y="2" width="4" height="36" fill="#FFC83D"/>
          </svg>
        </div>
        <div>
          <span class="tag">PAPER 2 · WRITING</span>
          <h1>Writing 单元库</h1>
          <p>按班型分类的 DSE 写作课件：加速班（港）、真题 &amp; 模拟题、预备班、加速班（内地），另有与各班型并列的 <b>翻译专项练习</b>。点击任意单元即可打开完整交互课件。</p>
        </div>
      </section>""",
}

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>智学平台 · {kind} 单元库</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    :root {{ --bg:#F4ECD8; --card:#FFFFFF; --text:#2E2A3B; --line:#2E2A3B; --muted:#6B6478; --pink:#FF5D8F; --blue:#4D7CFE; --yellow:#FFC83D; --green:#4FC46A; --teal:#2EC4B6; --purple:#A66BFF; --shadow:#2E2A3B; --accent:var(--yellow); --accent-ink:#2E2A3B; }}
    body.dark {{ --bg:#1A1726; --card:#2E2A3B; --text:#F4ECD8; --line:#F4ECD8; --muted:#B4B2A9; --teal:#2EC4B6; --purple:#B98BFF; --shadow:#000; --accent-ink:#fff; }}
    body[data-kind="reading"] {{ --accent:var(--blue); }}
    body[data-kind="writing"] {{ --accent:var(--pink); }}
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{ background:var(--bg); color:var(--text); font-family:"Noto Sans SC",system-ui,sans-serif; font-size:15px; line-height:1.6; transition:background .25s, color .25s; }}
    .pixel {{ font-family:"Press Start 2P", monospace; }}
    .app {{ display:flex; min-height:100vh; }}
    .sidebar {{ width:220px; flex-shrink:0; border-right:3px solid var(--line); padding:24px 16px; display:flex; flex-direction:column; position:sticky; top:0; height:100vh; }}
    .logo {{ display:flex; flex-direction:column; gap:2px; border:3px solid var(--line); background:var(--accent); color:var(--accent-ink); padding:10px 12px; box-shadow:4px 4px 0 var(--shadow); margin-bottom:28px; }}
    .logo .lg-en {{ font-family:"Press Start 2P",monospace; font-size:13px; line-height:1.5; }}
    .logo .lg-cn {{ font-size:12px; font-weight:700; opacity:.92; }}
    .nav {{ display:flex; flex-direction:column; gap:6px; }}
    .nav a {{ display:flex; align-items:center; gap:10px; padding:11px 12px; color:var(--text); text-decoration:none; border:3px solid transparent; font-weight:500; transition:transform .12s, background .12s, border-color .12s; }}
    .nav a .dot {{ width:12px; height:12px; background:var(--blue); border:2px solid var(--line); flex-shrink:0; }}
    .nav a:hover {{ transform:translate(-2px,-2px); border-color:var(--line); box-shadow:3px 3px 0 var(--shadow); background:var(--card); }}
    .nav a.active {{ background:var(--pink); color:#fff; border-color:var(--line); box-shadow:4px 4px 0 var(--shadow); }}
    .nav a.active .dot {{ background:#fff; }}
    .sidebar-foot {{ margin-top:auto; display:flex; justify-content:center; padding-top:20px; }}
    .main {{ flex:1; min-width:0; padding:24px 32px 48px; }}
    .topbar {{ display:flex; align-items:center; gap:16px; margin-bottom:28px; }}
    .search {{ flex:1; display:flex; align-items:center; gap:10px; border:3px solid var(--line); background:var(--card); padding:10px 14px; box-shadow:4px 4px 0 var(--shadow); }}
    .search input {{ flex:1; border:none; background:transparent; outline:none; font-family:inherit; font-size:15px; color:var(--text); }}
    .search .mag {{ width:14px; height:14px; border:3px solid var(--line); border-radius:50%; position:relative; }}
    .search .mag::after {{ content:""; position:absolute; width:8px; height:3px; background:var(--line); bottom:-6px; right:-5px; transform:rotate(45deg); }}
    .icon-btn {{ width:46px; height:46px; flex-shrink:0; border:3px solid var(--line); background:var(--card); box-shadow:4px 4px 0 var(--shadow); cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; transition:transform .12s; }}
    .icon-btn:hover {{ transform:translate(-2px,-2px); }}
    .crumb {{ display:flex; align-items:center; gap:8px; margin-bottom:18px; font-size:13px; color:var(--muted); }}
    .crumb a {{ color:var(--blue); text-decoration:none; font-weight:500; }} .crumb a:hover {{ text-decoration:underline; }}
    .hero {{ border:3px solid var(--line); background:var(--card); box-shadow:6px 6px 0 var(--shadow); padding:26px; display:flex; gap:24px; align-items:center; margin-bottom:28px; }}
    .hero .thumb {{ width:150px; height:150px; flex-shrink:0; background:var(--accent); border:3px solid var(--line); display:flex; align-items:center; justify-content:center; }}
    .hero .tag {{ display:inline-block; font-family:"Press Start 2P"; font-size:9px; background:var(--yellow); color:#2E2A3B; padding:6px 8px; border:2px solid var(--line); margin-bottom:12px; }}
    .hero h1 {{ font-size:22px; margin-bottom:10px; }} .hero p {{ color:var(--muted); margin-bottom:16px; max-width:560px; }}
    .filters {{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:22px; }}
    .chip {{ font-family:inherit; font-size:13px; font-weight:700; padding:8px 14px; border:3px solid var(--line); background:var(--card); color:var(--text); cursor:pointer; box-shadow:3px 3px 0 var(--shadow); transition:transform .12s, background .12s; }}
    .chip:hover {{ transform:translate(-2px,-2px); }}
    .chip.active {{ background:var(--accent); color:var(--accent-ink); }}
    .filters #chipOrder {{ display:contents; }}
    .chip[data-f] {{ cursor:grab; }} .chip[data-f]:active {{ cursor:grabbing; }}
    .bx-sec {{ margin-bottom:34px; }}
    .bx-head {{ display:flex; align-items:flex-end; justify-content:space-between; margin:6px 0 16px; padding-bottom:8px; border-bottom:3px dashed var(--line); }}
    .bx-head h2 {{ font-size:18px; }} .bx-head .pixel {{ font-size:10px; color:var(--muted); }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:22px; }}
    .card {{ border:3px solid var(--line); background:var(--card); box-shadow:4px 4px 0 var(--shadow); padding:18px; display:flex; flex-direction:column; transition:transform .14s, box-shadow .14s; }}
    .card:hover {{ transform:translate(-3px,-3px); box-shadow:7px 7px 0 var(--shadow); }}
    .card .cap {{ width:100%; height:92px; border:3px solid var(--line); margin-bottom:14px; display:flex; align-items:center; justify-content:center; font-family:"Press Start 2P"; font-size:18px; color:#2E2A3B; }}
    .card h3 {{ font-size:16px; margin-bottom:4px; }} .card .sub {{ color:var(--muted); font-size:13px; margin-bottom:6px; }}
    .card .desc {{ color:var(--muted); font-size:12.5px; line-height:1.6; margin-bottom:16px; flex:1; }}
    .card .go {{ display:inline-block; align-self:flex-start; font-family:"Press Start 2P"; font-size:9px; background:var(--accent); color:var(--accent-ink); border:3px solid var(--line); padding:9px 11px; cursor:pointer; box-shadow:3px 3px 0 var(--shadow); text-decoration:none; transition:transform .12s; }}
    .card .go:hover {{ transform:translate(-2px,-2px); }}
    footer {{ margin-top:40px; color:var(--muted); font-size:13px; text-align:center; }}
    .bx-head {{ cursor:grab; user-select:none; }}
    .bx-head .grip {{ margin-left:10px; font-size:18px; opacity:.4; }}
    .bx-sec.dragging {{ opacity:.45; }}
    .order-hint {{ font-size:12px; color:var(--muted); margin-bottom:14px; }}
    .chip.reset {{ background:var(--card); }}
    @media (max-width:760px) {{ .sidebar{{display:none}} .main{{padding:18px}} .hero{{flex-direction:column; text-align:center}} }}
  </style>
  <link rel="stylesheet" href="assets/polish.css" />
</head>
<body data-kind="{kind_slug}">
  <div class="app">
    <aside class="sidebar">
      <div class="logo">{logo}</div>
      <nav class="nav">
        <a href="index.html"><span class="dot"></span>学习主页</a>
        <a href="dashboard.html"><span class="dot"></span>我的看板</a>
        <a href="reading.html" class="{nav_r}"><span class="dot"></span>Reading 单元</a>
        <a href="writing.html" class="{nav_w}"><span class="dot"></span>Writing 单元</a>
        <a href="grammar.html"><span class="dot"></span>Grammar 单元</a>
      </nav>
      <div class="sidebar-foot">
        <svg viewBox="0 0 40 40" width="56" height="56" aria-hidden="true">
          <rect x="8" y="4" width="24" height="8" fill="#FF5D8F"/><rect x="4" y="12" width="32" height="24" fill="#FF5D8F"/>
          <rect x="8" y="36" width="24" height="4" fill="#FF5D8F"/><rect x="12" y="18" width="5" height="5" fill="#2E2A3B"/><rect x="23" y="18" width="5" height="5" fill="#2E2A3B"/>
        </svg>
      </div>
    </aside>
    <main class="main">
      <div class="topbar">
        <div class="search"><span class="mag"></span><input id="unitSearch" type="text" placeholder="搜索单元 / 题目 / 知识点…  （按 / 聚焦）" /></div>
        <button class="icon-btn" id="themeBtn" title="切换主题">🌙</button>
        <span id="authChip"></span>
      </div>
      <div class="crumb"><a href="index.html">学习主页</a> <span>›</span> <span>{kind} 单元库</span></div>
      {hero}
      <div class="filters">
        <button class="chip active" data-f="all">全部</button>
        <div id="chipOrder">
{class_chips}
        </div>
        <button class="chip" data-f="fav" id="favChip" title="只看收藏的单元">★ 收藏</button>
        <button class="chip reset" id="resetOrder" title="恢复默认课型顺序">↺ 重置顺序</button>
      </div>
      <div class="order-hint">提示：点 <b>☆</b> 收藏单元、再用 <b>★ 收藏</b> 筛选；标题（⠿）或班型按钮可拖拽排序且同步；点 <b>▾</b> 折叠；按 <b>/</b> 搜索、<b>T</b> 主题、<b>Esc</b> 清空。</div>
      {sections}
      <div class="empty" id="emptyState" hidden>
        <div class="empty-box">
          <div class="empty-ico">🔍</div>
          <h3>没有找到匹配的单元</h3>
          <p>换个关键词，或清除筛选条件再试试。</p>
          <button class="btn" id="clearFilters" type="button">清空筛选</button>
        </div>
      </div>
      <footer>智学平台 · 混合架构 v0.6 · {kind} 单元库（按班型分类 · 由 sync_courseware 自动生成维护）</footer>
    </main>
  </div>
  <!-- 班型筛选由 assets/polish.js 统一接管（搜索 + chip 联动 + 折叠） -->
  <script src="assets/app.js"></script>
  <script> ZhiXue.initAuthChip(); </script>
  <script>
  (function(){{
    var list = document.getElementById('bxList');
    var chipOrder = document.getElementById('chipOrder');
    if (!list) return;
    var KEY = 'zhixue-bx-order-' + (document.body.dataset.kind || 'x');

    function orderFrom(container, sel, attr) {{
      var o = [];
      container.querySelectorAll(sel).forEach(function(el) {{ o.push(el.getAttribute(attr)); }});
      return o;
    }}
    // 以课型区块顺序为权威，把筛选按钮同步排到一致
    function syncChips() {{
      if (!chipOrder) return;
      orderFrom(list, '.bx-sec', 'data-bx').forEach(function(slug) {{
        var chip = chipOrder.querySelector('.chip[data-f="' + slug + '"]');
        if (chip) chipOrder.appendChild(chip);
      }});
    }}
    // 以筛选按钮顺序为准，把课型区块同步排到一致
    function syncSections() {{
      orderFrom(chipOrder, '.chip[data-f]', 'data-f').forEach(function(slug) {{
        var sec = list.querySelector('.bx-sec[data-bx="' + slug + '"]');
        if (sec) list.appendChild(sec);
      }});
    }}
    function save() {{
      try {{ localStorage.setItem(KEY, JSON.stringify(orderFrom(list, '.bx-sec', 'data-bx'))); }} catch (e) {{}}
    }}
    function restore() {{
      try {{
        var order = JSON.parse(localStorage.getItem(KEY) || '[]');
        if (order && order.length) {{
          order.forEach(function(slug) {{
            var sec = list.querySelector('.bx-sec[data-bx="' + slug + '"]');
            if (sec) list.appendChild(sec);
          }});
          syncChips();
        }}
      }} catch (e) {{}}
    }}
    restore();

    function makeDraggable(container, sel, onDrop, horizontal) {{
      var dragEl = null;
      container.querySelectorAll(sel).forEach(function(el) {{
        el.setAttribute('draggable', 'true');
        el.addEventListener('dragstart', function(e) {{
          dragEl = el; el.classList.add('dragging');
          try {{ e.dataTransfer.setData('text/plain', el.dataset.bx || el.dataset.f); }} catch (_) {{}}
          e.dataTransfer.effectAllowed = 'move';
        }});
        el.addEventListener('dragend', function() {{ el.classList.remove('dragging'); dragEl = null; onDrop(); }});
        el.addEventListener('dragover', function(e) {{
          e.preventDefault();
          if (!dragEl || dragEl === el) return;
          var r = el.getBoundingClientRect();
          var after = horizontal
            ? (e.clientX - r.left) > (r.width / 2)
            : (e.clientY - r.top) > (r.height / 2);
          if (after) container.insertBefore(dragEl, el.nextSibling);
          else container.insertBefore(dragEl, el);
        }});
      }});
    }}
    // 拖拽课型区块 → 同步筛选按钮 + 保存
    makeDraggable(list, '.bx-sec', function() {{ syncChips(); save(); if (window.ZhiXue) ZhiXue.toast('顺序已保存'); }}, false);
    // 拖拽筛选按钮 → 同步课型区块 + 保存
    if (chipOrder) makeDraggable(chipOrder, '.chip[data-f]', function() {{ syncSections(); save(); if (window.ZhiXue) ZhiXue.toast('顺序已保存'); }}, true);

    var rb = document.getElementById('resetOrder');
    if (rb) rb.addEventListener('click', function() {{
      try {{ localStorage.removeItem(KEY); }} catch (e) {{}}
      if (window.ZhiXue) ZhiXue.toast('已恢复默认顺序', 'ok');
      setTimeout(function() {{ location.reload(); }}, 700);
    }});
  }})();
  </script>
  <script src="assets/polish.js"></script>
</body>
</html>
"""

# ---------- 主流程 ----------
def main():
    print("🔄 智学平台课件同步开始（按班型归类）...")
    print("📂 同步来源（班型）：" + " / ".join(c["name"] for c in CLASS_TYPES))

    manifest = load_manifest()
    scanned = {"reading": {}, "writing": {}}
    for ct in CLASS_TYPES:
        units, warns = scan_class_type(ct)
        for w in warns:
            print("  " + w)
        if not units:
            continue
        scanned["reading"].update(units.get("reading", {}))
        scanned["writing"].update(units.get("writing", {}))
        n = len(units.get("reading", {})) + len(units.get("writing", {}))
        print("  ✓ %s：发现 %d 个课件" % (ct["name"], n))

    if not scanned["reading"] and not scanned["writing"]:
        print("❌ 四个班型文件夹均未发现阅读/写作网页课件。请确认课件位置。")
        return 1

    # 复制 + 注入进度
    print("\n[复制课件并注入进度上报]")
    report = copy_scanned(scanned)
    for kind, sn, ver, bx, status, before, after, fname in report:
        mark = "✓" if status == "无变化" else "⬆"
        print("  %s [%s] U%d (V%s) %s  %dB→%dB  [%s]" % (
            mark, bx, sn, ver if ver else "-", status, before, after, fname))

    # 刷新冲刺课
    print("\n[Grammar 冲刺课]")
    print("  " + rebuild_sprint())

    # 写 manifest + 重建库页
    update_manifest(manifest, scanned)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("\n[重建单元库页面]")
    for kind in ("reading", "writing"):
        html = build_library_page(kind, manifest)
        out = os.path.join(PROJ, "%s.html" % kind)
        with open(out, "w", encoding="utf-8") as f:
            f.write(html)
        n = len(manifest.get(kind, {}))
        print("  ✓ %s.html 已重建（%d 个单元，按班型分类）" % (kind, n))

    print("\n🎉 同步完成！刷新浏览器即可看到按班型分类的最新课件。")
    return 0

if __name__ == "__main__":
    sys.exit(main())
