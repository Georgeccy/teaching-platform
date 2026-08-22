# -*- coding: utf-8 -*-
"""Generate a strongly-interactive grammar sprint courseware from the 讲练教案 markdown.
Interaction semantics borrowed from the Reading (V9) & Writing (V4-V6) courseware skills:
- real-time scoring + streak + Toast
- dark mode (D key + localStorage)
- sidebar nav grouped by unit
- translation practice: student writes -> submit group -> reveals reference (submitTrans-style)
- auto-scored MC quizzes driving the streak/score loop
- confetti end slide
Themed in the platform's pixel aesthetic (cream / ink / hard shadow / zero radius).
"""
import re, html, json

SRC = '/Users/chenchengyu/Developer/zhixue-platform/courseware/grammar/sprint_source.md'
OUT = '/Users/chenchengyu/Developer/zhixue-platform/courseware/grammar/sprint.html'

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

# ---------- Parse ----------
with open(SRC, encoding='utf-8') as f:
    raw = f.read()
lines = raw.split('\n')

blocks = []          # exercise blocks
teach_buf = []       # accumulated teaching lines since last heading
unit = section = sub = ''
mode = 'teach'
cur_block = None
details_buf = []

HEAD = re.compile(r'^(#{2,6})\s+(.*)$')

for line in lines:
    m = HEAD.match(line)
    if m:
        lvl, title = m.group(1), m.group(2).strip()
        if lvl == '##':
            unit = title
        elif lvl == '###':
            section = title
        elif lvl == '####':
            sub = title
        if '✍️ 练习' in title or '✍️练习' in title:
            cur_block = {
                'unit': unit, 'section': section, 'sub': sub,
                'teach': '\n'.join(teach_buf).strip(),
                'prompts': [], 'answers': [],
            }
            blocks.append(cur_block)
            mode = 'exercise'
        else:
            teach_buf = []
            mode = 'teach'
        continue

    s = line.strip()
    if mode == 'exercise':
        if s == '<details>':
            mode = 'details'; details_buf = []
        elif s.startswith('- '):
            cur_block['prompts'].append(s[2:].strip())
    elif mode == 'details':
        if s == '</details>':
            # parse answers from details_buf
            cur = None
            for dl in details_buf:
                d = dl.strip()
                if d.startswith('- **'):
                    key = d[3:].replace('**', '').strip()
                    cur = {'lines': []}
                    cur_block['answers'].append(cur)
                elif d.startswith('- ') or d.startswith('  - '):
                    if cur is not None:
                        cur['lines'].append(d.lstrip('- ').strip())
            mode = 'exercise'
        else:
            details_buf.append(line)
    else:  # teach
        if s and not s.startswith('- ') and not s.startswith('<'):
            teach_buf.append(line)
        elif s.startswith('- '):
            teach_buf.append(s)  # example list item

# ---------- Build exercise slides ----------
GID = 0
slides = []
quiz_q_total = 0   # auto-scored question count
group_total = 0    # submit-group count

def hint_cn(text):
    """Extract _hint_ and return (clean_cn, hint)."""
    m = re.search(r'_(.+?)_', text)
    if m:
        hint = m.group(1).strip()
        cn = re.sub(r'_.+?_', '', text).strip()
        return cn, hint
    return text.strip(), ''

ex_slides = []
for b in blocks:
    if not b['prompts']:
        continue
    GID += 1
    gid = 'g%d' % GID
    group_total += 1
    # pair prompts with answers by index
    paired = []
    for i, p in enumerate(b['prompts']):
        cn, hint = hint_cn(p)
        ans = ''
        if i < len(b['answers']):
            ans = ' / '.join(b['answers'][i]['lines']).strip()
        paired.append((cn, hint, ans))
    # teaching panel
    teach_html = ''
    if b['teach']:
        teach_html = '<details class="teach"><summary>📖 知识点 / 例句</summary><div class="teach-body">%s</div></details>' % esc(b['teach']).replace('\n', '<br>')
    rows = []
    for cn, hint, ans in paired:
        hint_html = ''
        if hint:
            hint_html = '<button class="ex-hint" type="button" onclick="toggleHint(this)">💡</button><span class="ex-hint-text">%s</span>' % esc(hint)
        ans_html = esc(ans) if ans else '（参考答案见教案）'
        rows.append(
            '<div class="ex-row">'
            '<div class="ex-cn">%s%s</div>'
            '<textarea class="ex-input" rows="1" placeholder="写下你的英文翻译…"></textarea>'
            '<div class="ex-ans"><span class="ex-stu"></span><span class="ex-ref">参考：%s</span></div>'
            '</div>' % (esc(cn), hint_html, ans_html)
        )
    slide = (
        '<section class="slide" data-unit="%s" data-title="%s">'
        '<div class="slide-head"><span class="unit-tag">%s</span><h2>%s</h2></div>'
        '%s'
        '<div class="ex-list" id="%s">%s</div>'
        '<button class="submit-group" type="button" onclick="submitGroup(\'%s\')">✅ 提交本组练习（%d 句）</button>'
        '</section>'
    ) % (esc(b['unit']), esc(b['sub']), esc(b['unit'].split('：')[-1] if '：' in b['unit'] else b['unit']),
         esc(b['sub']), teach_html, gid, ''.join(rows), gid, len(paired))
    ex_slides.append(slide)

# ---------- Hardcoded auto-scored quiz slides (drives streak/score) ----------
def quiz_card(q, opts, correct_idx, expl):
    global quiz_q_total
    quiz_q_total += 1
    oh = ''.join('<button class="quiz-opt" type="button" onclick="checkQuiz(this)">%s</button>' % esc(o) for o in opts)
    return ('<div class="quiz-card" data-correct="%d">'
            '<div class="quiz-q">%s</div>'
            '<div class="quiz-opts">%s</div>'
            '<div class="quiz-ans">%s</div></div>') % (correct_idx, esc(q), oh, esc(expl))

unit2_quiz = (
    '<section class="slide" data-unit="单元2：基本句型" data-title="🏆 基本句型闯关">'
    '<div class="slide-head"><span class="unit-tag">单元2</span><h2>🏆 基本句型闯关（自动计分）</h2></div>'
    '<p class="slide-note">判断下列英文句属于哪种基本句型。答对触发连胜 🔥，答错显示正确选项。</p>'
    + quiz_card('The massive use of fertilizer will damage the environment.',
                ['主+谓 (SV)', '主+谓+宾 (SVO)', '主+系+表 (SVC)', '主+谓+双宾 (SVOO)'], 1,
                'will damage 是谓语，the environment 是宾语 → 主谓宾 SVO。')
    + quiz_card('These artistic traditions might disappear.',
                ['主+谓 (SV)', '主+谓+宾 (SVO)', '主+系+表 (SVC)', '主+谓+宾+宾补 (SVOOC)'], 0,
                'disappear 是不及物谓语，无宾语 → 主谓 SV。')
    + quiz_card('We made him captain.',
                ['主+谓 (SV)', '主+谓+宾 (SVO)', '主+谓+宾+宾补 (SVOOC)', '主+谓+双宾 (SVOO)'], 2,
                'him 是宾语，captain 补充说明 him → 宾补 SVOOC。')
    + quiz_card('He gave me a book.',
                ['主+谓+宾 (SVO)', '主+谓+宾+宾补 (SVOOC)', '主+谓+双宾 (SVOO)', '主+系+表 (SVC)'], 2,
                'me 与 a book 都是宾语（人+物）→ 双宾 SVOO。')
    + quiz_card('She is a teacher.',
                ['主+谓 (SV)', '主+谓+宾 (SVO)', '主+系+表 (SVC)', '主+谓+双宾 (SVOO)'], 2,
                'is 是系动词，a teacher 是表语 → 主系表 SVC。')
    + '</section>'
)

unit3_quiz = (
    '<section class="slide" data-unit="单元3：单句组合" data-title="🏆 从句类型闯关">'
    '<div class="slide-head"><span class="unit-tag">单元3</span><h2>🏆 从句类型闯关（自动计分）</h2></div>'
    '<p class="slide-note">判断划线部分属于哪类从句。</p>'
    + quiz_card('I will call you when I arrive.',
                ['定语从句', '状语从句', '名词性从句', '强调句'], 1,
                'when 引导时间状语从句，修饰 call。')
    + quiz_card('The book that I bought is interesting.',
                ['定语从句', '状语从句', '名词性从句', '并列句'], 0,
                'that I bought 修饰 book → 定语从句。')
    + quiz_card('I know that he is honest.',
                ['定语从句', '状语从句', '名词性从句 (宾语)', '强调句'], 2,
                'that 引导宾语从句，作 know 的宾语 → 名词性从句。')
    + quiz_card('It is in the library that I met him.',
                ['定语从句', '状语从句', '名词性从句', '强调句'], 3,
                'It is ... that ... 结构 → 强调句（强调地点）。')
    + quiz_card('He not only sings but also dances.',
                ['定语从句', '状语从句', '名词性从句', '并列句'], 3,
                'not only ... but also ... 连接两个并列谓语 → 并列句。')
    + '</section>'
)

# ---------- Cover + end slides ----------
cover = (
    '<section class="slide is-active cover" data-unit="封面" data-title="封面 · 语法短期冲刺">'
    '<div class="cover-card">'
    '<div class="cover-top">DSE 语法 · 短期冲刺</div>'
    '<h1>语法短期冲刺 · 讲练结合</h1>'
    '<p class="cover-sub">基本句型 → 单句组合 → 实战翻译。每一组练习都请你动手写、提交、对照参考答案。</p>'
    '<div class="cover-meta">'
    '<div class="cm"><div class="cm-l">练习组</div><div class="cm-v">%d 组</div></div>'
    '<div class="cm"><div class="cm-l">翻译句</div><div class="cm-v">%d 句</div></div>'
    '<div class="cm"><div class="cm-l">闯关题</div><div class="cm-v">%d 题</div></div>'
    '</div>'
    '<p class="cover-tip">⌨️ D 切换暗色 · S 折叠侧栏 · ← → 翻页</p>'
    '</div></section>' % (group_total, sum(len(b['prompts']) for b in blocks if b['prompts']), quiz_q_total + 10)
)

end = (
    '<section class="slide end" data-unit="完成" data-title="🎉 完成">'
    '<div class="end-card">'
    '<div class="end-emoji">🎉</div>'
    '<h2>冲刺完成！</h2>'
    '<p>你已刷完所有翻译练习与闯关。坚持每天一组，语法底子会越来越稳。</p>'
    '<div class="score-badge-big"><span id="finalScore">0</span>/<span id="finalTotal">0</span></div>'
    '<button class="reveal-btn" type="button" onclick="launchConfetti()">🎊 撒花庆祝</button>'
    '</div></section>'
)

# group slides by unit for sidebar
def unit_key(b):
    return b['unit']

# ---------- Assemble ----------
all_slides = [cover] + ex_slides + [unit2_quiz, unit3_quiz, end]

CSS = """* { box-sizing: border-box; }
:root{
  --cream:#F4ECD8; --ink:#2E2A3B; --surface:#FFFFFF; --surface-2:#FBF6E9;
  --muted:#7a7466; --line:#2E2A3B;
  --pink:#FF5D8F; --blue:#4D7CFE; --yellow:#FFC83D; --green:#4FC46A; --purple:#9B6BF2;
  --ok:#2f9e44; --bad:#e03131;
  --shadow:4px 4px 0 var(--ink); --shadow-sm:2px 2px 0 var(--ink);
}
body.dark{
  --cream:#1a1726; --ink:#F4ECD8; --surface:#241f33; --surface-2:#2c2640;
  --muted:#a89fce; --line:#F4ECD8;
  --shadow:4px 4px 0 #000; --shadow-sm:2px 2px 0 #000;
}
html,body{margin:0;padding:0;background:var(--cream);color:var(--ink);
  font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
  transition:background .2s,color .2s;}
a{color:var(--blue);text-decoration:none}
.deck{display:flex;min-height:100vh}
/* Sidebar */
.sidebar{width:240px;flex-shrink:0;background:var(--surface-2);border-right:3px solid var(--line);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh;
  font-size:14px;transition:margin-left .25s,width .25s;}
body.sb-collapsed .sidebar{margin-left:-240px}
.sidebar-header{padding:16px 18px;border-bottom:3px solid var(--line);
  font-weight:900;letter-spacing:.5px;display:flex;align-items:center;justify-content:space-between}
.sb-logo{font-size:15px}
.sb-toggle{cursor:pointer;border:2px solid var(--line);background:var(--surface);padding:2px 8px;font-weight:800}
.sidebar-nav{flex:1;overflow-y:auto;padding:10px 8px}
.sb-group{margin-bottom:10px}
.sb-group-title{font-size:12px;font-weight:900;color:var(--muted);padding:6px 10px;text-transform:uppercase;letter-spacing:.5px}
.sb-link{display:block;padding:6px 12px;margin:2px 0;border-left:4px solid transparent;cursor:pointer;
  border-radius:0 6px 6px 0;line-height:1.35;color:var(--ink);transition:all .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-link:hover{background:var(--surface);border-left-color:var(--yellow)}
.sb-link.active{background:var(--surface);border-left-color:var(--pink);font-weight:700}
.sidebar-foot{padding:12px 14px;border-top:3px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.theme-toggle{cursor:pointer;border:2px solid var(--line);background:var(--surface);padding:4px 10px;font-weight:800}
/* Main */
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;
  padding:10px 18px;background:var(--surface);border-bottom:3px solid var(--line)}
.course-tag{font-weight:900;background:var(--pink);color:#fff;padding:3px 10px;border:2px solid var(--line);box-shadow:var(--shadow-sm)}
.slide-title{font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.score-badge{font-weight:900;font-family:"Courier New",monospace;font-size:16px;
  border:2px solid var(--line);padding:3px 10px;background:var(--surface-2);box-shadow:var(--shadow-sm)}
.streak-badge{font-weight:900;color:var(--bad);display:none}
.streak-badge.show{display:inline;animation:pop .3s}
@keyframes pop{0%{transform:scale(.6)}100%{transform:scale(1)}}
/* progress bar */
.pbar{height:8px;background:var(--surface-2);border-bottom:2px solid var(--line)}
.pbar-fill{height:100%;width:0;background:linear-gradient(90deg,var(--pink),var(--yellow),var(--green));transition:width .4s}
.content{flex:1;overflow-y:auto;padding:26px 30px 80px;scroll-behavior:smooth}
.slide{min-height:60vh;padding:8px 4px 40px;border-bottom:2px dashed var(--line)}
.slide.is-active{}
.slide-head{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.unit-tag{font-weight:900;font-size:13px;background:var(--blue);color:#fff;padding:3px 10px;border:2px solid var(--line);box-shadow:var(--shadow-sm)}
.slide-head h2{margin:0;font-size:24px}
.slide-note{color:var(--muted);margin:0 0 14px;font-size:15px}
/* teaching */
.teach{border:2px solid var(--line);background:var(--surface);box-shadow:var(--shadow-sm);margin-bottom:18px}
.teach>summary{cursor:pointer;font-weight:800;padding:10px 14px;background:var(--surface-2)}
.teach-body{padding:12px 16px;line-height:1.9;font-size:15px;color:var(--ink)}
/* exercise rows */
.ex-list{display:flex;flex-direction:column;gap:12px}
.ex-row{border:2px solid var(--line);background:var(--surface);box-shadow:var(--shadow-sm);padding:12px 14px}
.ex-cn{font-size:17px;font-weight:600;line-height:1.6;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
.ex-hint{cursor:pointer;border:2px solid var(--line);background:var(--surface-2);font-size:13px;padding:0 8px;border-radius:0}
.ex-hint-text{display:none;font-size:14px;color:var(--blue);font-weight:600}
.ex-hint-text.show{display:inline}
.ex-input{width:100%;font-family:inherit;font-size:16px;padding:9px 12px;border:2px solid var(--line);
  background:var(--surface-2);color:var(--ink);border-radius:0;resize:vertical;line-height:1.5}
.ex-input:focus{outline:none;border-color:var(--pink);background:#fff}
.ex-ans{display:none;margin-top:8px;padding:10px 12px;border:2px dashed var(--green);background:#f3fbf4}
body.dark .ex-ans{background:#1c2a1e}
.ex-stu{display:block;font-size:15px;color:var(--blue);margin-bottom:4px;white-space:pre-wrap}
.ex-stu:empty{display:none}
.ex-ref{display:block;font-size:15px;line-height:1.6}
.submit-group{margin-top:16px;font-family:inherit;font-weight:900;font-size:16px;cursor:pointer;
  background:var(--green);color:#08210f;border:2px solid var(--line);padding:10px 20px;box-shadow:var(--shadow-sm);transition:transform .12s}
.submit-group:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}
.submit-group:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.submit-group.done{background:var(--surface-2);color:var(--muted)}
/* quiz */
.quiz-card{border:2px solid var(--line);background:var(--surface);box-shadow:var(--shadow-sm);padding:16px 18px;margin-bottom:16px}
.quiz-q{font-size:18px;font-weight:700;margin-bottom:12px;line-height:1.6}
.quiz-opts{display:flex;flex-direction:column;gap:8px}
.quiz-opt{font-family:inherit;font-size:16px;text-align:left;cursor:pointer;border:2px solid var(--line);
  background:var(--surface-2);padding:9px 14px;transition:all .12s}
.quiz-opt:hover{border-color:var(--blue);background:#fff}
.quiz-opt.correct{background:var(--green);color:#08210f;border-color:var(--ok)}
.quiz-opt.wrong{background:#ffd6d6;color:var(--bad);border-color:var(--bad)}
body.dark .quiz-opt.correct{color:#08210f}
body.dark .quiz-opt.wrong{color:#fff}
.quiz-card.answered .quiz-opt{pointer-events:none}
.quiz-ans{display:none;margin-top:12px;padding:10px 14px;border:2px solid var(--green);background:#f3fbf4;
  font-size:15px;line-height:1.7}
body.dark .quiz-ans{background:#1c2a1e}
/* cover / end */
.cover,.end{display:flex;align-items:center;justify-content:center}
.cover-card,.end-card{max-width:680px;width:100%;border:3px solid var(--line);background:var(--surface);
  box-shadow:var(--shadow);padding:34px 38px;text-align:center}
.cover-top{font-weight:900;letter-spacing:2px;color:var(--muted);margin-bottom:10px}
.cover-card h1{font-size:34px;margin:0 0 12px}
.cover-sub{font-size:16px;color:var(--muted);line-height:1.7;margin:0 0 22px}
.cover-meta{display:flex;gap:14px;justify-content:center;margin-bottom:18px}
.cm{border:2px solid var(--line);background:var(--surface-2);box-shadow:var(--shadow-sm);padding:12px 18px;min-width:90px}
.cm-l{font-size:12px;color:var(--muted);font-weight:700}
.cm-v{font-size:26px;font-weight:900}
.cover-tip{font-size:13px;color:var(--muted);margin:0}
.end-emoji{font-size:64px;margin-bottom:10px}
.end-card h2{font-size:28px;margin:0 0 10px}
.end-card p{color:var(--muted);line-height:1.7;margin:0 0 18px}
.score-badge-big{font-family:"Courier New",monospace;font-size:40px;font-weight:900;margin-bottom:18px}
.reveal-btn{font-family:inherit;font-weight:900;font-size:18px;cursor:pointer;background:var(--yellow);
  color:#3a2c00;border:2px solid var(--line);padding:10px 26px;box-shadow:var(--shadow-sm)}
.reveal-btn:hover{transform:translate(-2px,-2px)}
/* toast */
.toast-wrap{position:fixed;top:18px;right:18px;z-index:100;display:flex;flex-direction:column;gap:8px}
.toast{padding:10px 18px;font-weight:800;border:2px solid var(--line);box-shadow:var(--shadow-sm);
  animation:tin .25s;font-size:15px}
.toast.success{background:var(--green);color:#08210f}
.toast.error{background:#ff6b6b;color:#fff}
.toast.info{background:var(--purple);color:#fff}
@keyframes tin{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
/* confetti */
.confetti{position:fixed;top:-10px;width:10px;height:14px;z-index:200;pointer-events:none}
@media(max-width:760px){
  .sidebar{position:fixed;z-index:50;box-shadow:var(--shadow)}
  .content{padding:18px 16px 70px}
  .slide-head h2{font-size:20px}
  .cover-card{padding:24px 20px}
}"""

JS = """var totalItems = TOTAL_PLACEHOLDER, doneItems = 0, scoreCorrect = 0, scoreTotal = 0, streak = 0, maxStreak = 0;
var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
function escAttr(s){return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ---- scoring ---- */
function updateScore(){
  document.getElementById('sbCorrect').textContent = scoreCorrect;
  document.getElementById('sbTotal').textContent = scoreTotal;
  var pct = totalItems? Math.round(doneItems/totalItems*100):0;
  document.getElementById('pbarFill').style.width = pct+'%';
  if(streak>=3){var sb=document.getElementById('streakBadge');sb.classList.add('show');document.getElementById('streakCount').textContent=streak;}
  else document.getElementById('streakBadge').classList.remove('show');
}
function recordAnswer(isCorrect){
  scoreTotal++; if(isCorrect){scoreCorrect++; streak++; if(streak>maxStreak)maxStreak=streak;}
  else streak=0;
  updateScore();
}
function showToast(msg,type){
  var w=document.getElementById('toastWrap');
  var t=document.createElement('div');t.className='toast '+(type||'info');t.textContent=msg;
  w.appendChild(t);setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove();},300);},2600);
}

/* ---- translation submit (submitTrans-style) ---- */
function toggleHint(btn){var s=btn.nextElementSibling;s.classList.toggle('show');}
function submitGroup(gid){
  var g=document.getElementById(gid); if(!g)return;
  var rows=g.querySelectorAll('.ex-row'); var n=0;
  rows.forEach(function(r){
    var inp=r.querySelector('.ex-input'); var stu=r.querySelector('.ex-stu'); var ans=r.querySelector('.ex-ans');
    if(inp && inp.value.trim()){stu.textContent='✏️ 你的：'+inp.value.trim();}
    if(ans)ans.style.display='block';
    n++;
  });
  doneItems++; updateScore();
  var btn=document.getElementById(gid).parentElement.querySelector('.submit-group');
  if(btn){btn.classList.add('done');btn.textContent='✓ 已提交（'+n+' 句）';}
  showToast('✓ 已提交 '+n+' 句，对照绿色参考答案','success');
}

/* ---- auto-scored MC ---- */
function checkQuiz(el){
  var card=el.closest('.quiz-card'); if(!card||card.classList.contains('answered'))return;
  var opts=card.querySelectorAll('.quiz-opt'); var ci=parseInt(card.dataset.correct,10);
  var clicked=Array.prototype.indexOf.call(opts,el);
  if(clicked===ci){el.classList.add('correct');showToast('✅ 正确！+1','success');recordAnswer(true);}
  else{el.classList.add('wrong');opts[ci].classList.add('correct');showToast('❌ 看正确选项','error');recordAnswer(false);}
  card.classList.add('answered');
  var ans=card.querySelector('.quiz-ans'); if(ans)ans.style.display='block';
}

/* ---- dark mode ---- */
function toggleDarkMode(){
  document.body.classList.toggle('dark');
  var on=document.body.classList.contains('dark');
  try{localStorage.setItem('grammarSprintDark',on?'1':'0');}catch(e){}
  document.getElementById('themeBtn').textContent = on?'☀️':'🌙';
}
function initDark(){try{if(localStorage.getItem('grammarSprintDark')==='1'){document.body.classList.add('dark');document.getElementById('themeBtn').textContent='☀️';}}catch(e){}}

/* ---- sidebar nav ---- */
function buildSidebar(){
  var nav=document.getElementById('sidebarNav'); var curGroup=''; var html='';
  slides.forEach(function(s,idx){
    var u=s.dataset.unit||'';
    if(u!==curGroup){curGroup=u;html+='<div class="sb-group"><div class="sb-group-title">'+escAttr(u)+'</div>';}
    html+='<a class="sb-link" data-idx="'+idx+'" onclick="goSlide('+idx+')">'+escAttr(s.dataset.title||('Slide '+(idx+1)))+'</a>';
  });
  nav.innerHTML=html;
}
function goSlide(idx){
  if(idx<0)idx=0; if(idx>=slides.length)idx=slides.length-1;
  slides[idx].scrollIntoView({behavior:'smooth',block:'start'});
}
function setActive(){
  var mid=window.innerHeight/2; var cur=0;
  slides.forEach(function(s,i){var r=s.getBoundingClientRect();if(r.top<=mid)cur=i;});
  document.querySelectorAll('.sb-link').forEach(function(a,i){a.classList.toggle('active',i===cur);});
  var t=slides[cur].dataset.title||''; document.getElementById('topTitle').textContent=t;
}
/* ---- sidebar collapse ---- */
function toggleSidebar(){document.body.classList.toggle('sb-collapsed');}

/* ---- keyboard ---- */
document.addEventListener('keydown',function(e){
  var tag=e.target.tagName; if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  if(e.key==='d'||e.key==='D'){toggleDarkMode();}
  else if(e.key==='s'||e.key==='S'){toggleSidebar();}
  else if(e.key==='ArrowRight'||e.key==='ArrowDown'){var c=curIdx();goSlide(c+1);}
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){var c=curIdx();goSlide(c-1);}
});
function curIdx(){var mid=window.innerHeight/2;var cur=0;slides.forEach(function(s,i){if(s.getBoundingClientRect().top<=mid)cur=i;});return cur;}

/* ---- confetti ---- */
function launchConfetti(){
  var colors=['#FF5D8F','#4D7CFE','#FFC83D','#4FC46A','#9B6BF2'];
  for(var i=0;i<80;i++){
    (function(){
      var c=document.createElement('div');c.className='confetti';
      c.style.left=(Math.random()*100)+'vw';
      c.style.background=colors[i%colors.length];
      c.style.transform='rotate('+(Math.random()*360)+'deg)';
      document.body.appendChild(c);
      var dur=2200+Math.random()*1500;
      c.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:'translateY(100vh) rotate(720deg)',opacity:.9}],{duration:dur,easing:'ease-in'}).onfinish=function(){c.remove();};
    })();
  }
  showToast('🎉 冲刺完成！','info');
}

window.addEventListener('scroll',function(){setActive();});
window.addEventListener('DOMContentLoaded',function(){
  initDark(); buildSidebar(); updateScore(); setActive();
  document.getElementById('finalTotal').textContent=totalItems;
  document.getElementById('finalScore').textContent=doneItems;
});
"""

JS = JS.replace('TOTAL_PLACEHOLDER', str(group_total + quiz_q_total + 10))

HTML = """<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>语法短期冲刺 · 讲练结合互动课件</title>
<style>%s</style>
</head><body>
<div class="deck">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header"><span class="sb-logo">⌨ 语法冲刺</span><span class="sb-toggle" onclick="toggleSidebar()">☰</span></div>
    <nav class="sidebar-nav" id="sidebarNav"></nav>
    <div class="sidebar-foot">
      <button class="theme-toggle" id="themeBtn" onclick="toggleDarkMode()" title="D 切换暗色">🌙</button>
      <span style="font-size:12px;color:var(--muted)">Dark</span>
    </div>
  </aside>
  <div class="main">
    <div class="topbar">
      <span class="course-tag">DSE 语法</span>
      <span class="slide-title" id="topTitle">封面 · 语法短期冲刺</span>
      <span class="streak-badge" id="streakBadge">🔥 <span id="streakCount">0</span></span>
      <span class="score-badge"><span id="sbCorrect">0</span>/<span id="sbTotal">0</span></span>
    </div>
    <div class="pbar"><div class="pbar-fill" id="pbarFill"></div></div>
    <div class="content">
      %s
    </div>
  </div>
</div>
<div class="toast-wrap" id="toastWrap"></div>
<script>%s</script>
<script src="../../assets/app.js"></script>
<script src="../../assets/courseware-progress.js"></script>
<script>window.__ZX__={kind:'grammar',unit:'grammar-sprint',weakKey:'general',mode:'score',selCorrect:'#sbCorrect',selTotal:'#sbTotal'};</script>
</body></html>""" % (CSS, '\n'.join(all_slides), JS)

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(HTML)

print('Slides:', len(all_slides))
print('Exercise groups:', group_total)
print('Quiz questions:', quiz_q_total + 10)
print('Total sentences:', sum(len(b['prompts']) for b in blocks if b['prompts']))
print('Output bytes:', len(HTML))
