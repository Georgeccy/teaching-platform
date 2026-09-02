#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate index.html for 2015 DSE Paper 1 Reading courseware (v1).
Design system: copied from 2017DSE-Paper1_v2 (fCC x Khan style).
Features: pixel-brick rate covers (2-click shatter) + Show Data toggle button.
Part 1: helpers, passages (Text 1 / Text 2 / Text 5) + Part A slides (Q1-31).
Source: 2015_DSE_English_Paper1_完整整理.md
Scope: Part A + Part B2 only (Part B1 Q32-55 NOT included per user request).
"""

def esc(s):
    """Escape for double-quoted HTML attribute values.
    & < > and " must be escaped; the single quote ' is legal inside
    double-quoted attributes and is kept verbatim."""
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def tier(p):
    return "&#10003;" if p >= 70 else ("&#9888;" if p >= 40 else "&#128293;")

def tcls(p):
    return "" if p >= 70 else (" mid" if p >= 40 else " hard")

def chip(pcts):
    """pcts: int, or list of (sublabel, pct). Returns wrapped chip + brick cover."""
    if isinstance(pcts, int):
        pcts = [("", pcts)]
    ps = [p for _, p in pcts]
    lo = min(ps)
    if len(pcts) == 1:
        txt = f'{tier(lo)} {ps[0]}%'
    else:
        txt = tier(lo) + " " + " / ".join(f"{l} {p}%" for l, p in pcts)
    return ('<span class="rate-cover-wrap"><span class="rate-chip{c}">{t}</span>'
            '<span class="rate-cover" onclick="hitCover(this)" '
            'title="\U0001F9F1 点击 2 次击碎砖块，查看正确率"></span></span>'
            ).format(c=tcls(lo), t=txt)

def mcq(qid, label, chips, q, opts, note=None):
    o = ""
    for L, t, c, e in opts:
        ex = f' data-explain="{esc(e)}"' if e else ""
        o += (f'<span class="pmcq-opt" data-correct="{str(c).lower()}"{ex} '
              f'onclick="checkMCAuto(this)"><span class="pl">{L}</span>{t}</span>')
    n = (f'<div class="method-wrap" style="display:none"><span class="method-badge">{note}</span></div>'
         if note else "")
    return (f'<div class="practice-mcq" id="{qid}-box"><div class="pmcq-label">{label} {chips}</div>'
            f'<div class="pmcq-q">{q}</div><div class="pmcq-options" id="{qid}-opts">{o}</div>{n}</div>')

def sa(qid, label, chips, q, ans):
    return (f'<div class="practice-mcq" id="{qid}-box"><div class="pmcq-label">{label} {chips}</div>'
            f'<div class="pmcq-q">{q}</div>'
            f'<div style="margin:10px 0"><span style="color:var(--text-3);font-size:20px">________</span></div>'
            f'<button class="reveal-btn" onclick="toggleRev(\'{qid}-ans\')">Show Answer</button>'
            f'<div class="ans-reveal" id="{qid}-ans">'
            f'<div class="ans-banner"><span class="tick">&#10003;</span><div><div class="at">Answer</div></div></div>'
            f'{ans}</div></div>')

def _subtag(sub):
    """Normalize a sub-question tag so it renders as exactly one pair of
    parentheses: 'i' -> '(i)', '(i)' -> '(i)', '((i))' -> '(i)', '(i))' -> '(i)'."""
    s = str(sub).strip()
    while s.startswith('('):
        s = s[1:]
    while s.endswith(')') and s:
        s = s[:-1]
    return '(' + s + ')'

def sub_sa(qid_sub, sub, stem, ans_html, pct=None):
    """Sub-question block: full stem + per-sub rate chip shown beside the stem,
    plus an independent answer reveal."""
    rate = chip(pct) if pct is not None else ""
    return ('<div style="margin:14px 0;padding:10px 14px;border-left:3px solid var(--fcc-purple);'
            'border-radius:0 10px 10px 0;background:rgba(var(--accent-rgb),.03)">'
            '<p style="font-size:20px;margin:0 0 10px"><strong>' + _subtag(sub) + '</strong> ' + stem + rate + '</p>'
            '<button class="reveal-btn" onclick="toggleRev(\'' + qid_sub + '-ans\')">Show Answer</button>'
            '<div class="ans-reveal" id="' + qid_sub + '-ans">'
            '<div class="ans-banner"><span class="tick">&#10003;</span><div><div class="at">Answer</div></div></div>'
            + ans_html + '</div></div>')

def tfng_item(sub, stmt, ans, expl, pct):
    b = ""
    for v in ("T", "F", "NG"):
        b += f'<span class="tfng-btn" onclick="checkTFNG(this,\'{v}\')"><b>{v}</b></span>'
    return (f'<p style="font-size:20px;margin-bottom:8px"><strong>{_subtag(sub)}</strong> {stmt} {chip(pct)}</p>'
            f'<div class="tfng-group" data-answer="{ans}" data-explain="{esc(expl)}">{b}</div>')

def tfng_slide(qid, label, intro, items):
    inner = ""
    for sub, stmt, ans, expl, pct in items:
        inner += tfng_item(sub, stmt, ans, expl, pct)
    return (f'<div class="practice-mcq" id="{qid}-box"><div class="pmcq-label">{label}</div>'
            f'<div class="pmcq-q">{intro}</div>{inner}</div>')

def cloze(ans):
    return (f'<span class="cloze" data-answer="{esc(ans)}" '
            f'onclick="revealCloze(this)">____________________</span>')

def para(n, text):
    return f'<div class="passage-excerpt"><div class="para-num">&#182;{n}</div>{text}</div>\n'

def flip(en, zh):
    return ('<div class="flip-card" onclick="this.classList.toggle(\'flipped\')">'
            '<div class="flip-card-inner">'
            f'<div class="flip-face flip-front"><div class="flip-q">{en}</div><div class="flip-hint">tap</div></div>'
            f'<div class="flip-face flip-back"><div class="flip-ans">{zh}</div></div>'
            '</div></div>')

def flip_grid(cards):
    return '<div class="flip-grid g5">' + "".join(flip(e, z) for e, z in cards) + "</div>"

def sig(pair, zh):
    return f'<span class="sigword pending" data-pair="{esc(pair)}" data-zh=" {zh}">{pair}</span>'

def slide(title, section, part, body, hard_group=None):
    hg = f' data-hard-group="{hard_group}"' if hard_group else ""
    return (f'<section class="slide" data-title="{title}" data-section="{section}" '
            f'data-part="{part}"{hg}>{body}</section>\n\n')

def split(left_title, paras, right, cls=''):
    return (f'<div class="split-view {cls}"><div class="split-left" oncontextmenu="handleHighlight(event, this)">'
            f'<h4>{left_title}</h4>{paras}</div><div class="split-right">{right}</div></div>')

# ---------- passages ----------
T1 = {
1: "Ten years ago, Oxford University graduate Daniel Tudor moved to Seoul, preferring the warmth of Korean society to &quot;cold&quot; Britain. The 31-year-old has since authored two books on his adopted home and has several other volumes in the pipeline. He speaks to <strong>Charmaine Chan</strong> about his latest title, <em>A Geek in Korea</em>, due out in June 2014.",
2: "When I joined <em>The Economist</em> [2010&ndash;2013] I thought, &quot;Eventually I&#39;d like to write a book about Korea because nobody else is really doing it.&quot;",
3: "Korea is a bit off the radar for most people in Western countries. In the 1980s Japan was the big story and people pay attention to China now because of its huge population and market. Korea has fallen in between these two countries.",
4: "A lot of Koreans say <em>jeong</em> &mdash; the warmth between people and mutual sacrifice &mdash; is uniquely Korean, as is <em>han</em>. It&#39;s nonsense, but Korea has words to describe these things, which shows they are important. <em>Han</em> is a burden, oppression or an injustice you can&#39;t correct. Its cause never goes away but you can temporarily forget about it by pursuing all-out, manic fun. This is where <em>heung</em> comes in. <em>Heung</em> is pure joy. The word isn&#39;t as famous as <em>han</em>, but I think that it should be. Even traditional Korean funerals used to feature extreme alcohol consumption, raucous singing, and the like.",
5: "Often when Westerners think of East Asians, the stereotypes of stoicism and self-control &mdash; the so-called &quot;inscrutable oriental&quot; &mdash; come to mind. But Koreans in fact tend to be very expressive and open with their feelings. Somehow, sadness and happiness both seem to be magnified in Korea.",
6: "It&#39;s still about South Korea, but it&#39;s aimed at a younger audience. Consider it a gateway for those who like K-pop or TV shows from Korea, but don&#39;t know anything about the country.",
7: "Generally K-pop is for teenagers. I&#39;m not saying it&#39;s wrong. It&#39;s a good business. But I like music played by people who mean what they&#39;re writing. Some people think all Korean music is K-pop, but there&#39;s really good music in Korea that&#39;s not superficial or played on the radio or on TV and doesn&#39;t go outside of Korea. One of my favourite bands is 3rd Line Butterfly: these guys are not rich and famous; they&#39;re ordinary guys you can be friends with. I am friends with them. There&#39;s an interview with [<em>Gangnam Style</em> singer] Psy [in <em>Geek</em>]. He&#39;s funny and cheeky, in a Robbie Williams kind of way, and making fun of Gangnam [an affluent district of Seoul], which is superficial and flashy.",
8: "I don&#39;t like the drama stuff. They&#39;re trying to play with your emotions with Cinderella stories: beautiful girl from poor family marries rich guy. Korea&#39;s probably not the best country in which to be a woman. If you&#39;re a young woman in Korea, what&#39;s the best way to become wealthy or to achieve status? Sadly, it&#39;s to marry somebody.",
9: "You find these mothers in Gangnam and they&#39;re scary. When I taught English I&#39;d meet kids who, materially, led awesome lives and they&#39;d show up in these big Mercedes with bags as big as they were. But if they didn&#39;t get an A grade in something, their parents would get mad and the next time you saw them they&#39;d be crying. Wealthy families are obsessed with education. It&#39;s a status thing: preserve your status and show the rest of the world that you&#39;re preserving your status and your kids are doing well.",
10: "This <em>jeong</em> stuff &mdash; that&#39;s the thing that keeps me in Korea. Korea made me a better friend to my friends. England&#39;s a cold society and, growing up, I suppose I always wanted this feeling of being connected to people. I thought English people were a bit too cynical and cold. Korea is a place where you say, &quot;I like you. I love you. This is great.&quot; I really like that.",
}

T2 = {
1: "Daniel Tudor is one of the most influential foreign correspondents in South Korea &mdash; and one of the least known. As the reporter for the <em>Economist</em>, which doesn&#39;t use bylines, most of his work is published anonymously. But Mr. Tudor&#39;s profile is about to take a sharp rise with the publication of his new book, &quot;Korea: The Impossible Country&quot;.",
2: "It&#39;s the first English-language book to cover the whole waterfront of South Korean society &mdash; historical, cultural, economic, social, political &mdash; since one by another influential British expat, Michael Breen, with &quot;The Koreans,&quot; which was originally published in 1998 and revised in 2004. [Mr. Breen provided a recommendation on Mr. Tudor&#39;s book jacket.] &quot;Korea: The Impossible Country&quot; is also likely to get added to the list of must-read books for anyone from outside of South Korea who wants to do business or live in the country.",
3: "That&#39;s a small canon, unfortunately. In addition to Mr. Breen&#39;s book, the other indispensables are &quot;Diamond Dilemma&quot; by Tariq Hussain, &quot;Korean Dynasty&quot; by Donald Kirk, Tom Coyner&#39;s guide to doing business in Korea and Robert Koehler&#39;s <em>Seoul Selection</em> guidebooks for places and sightseeing. Indeed, the list of must-read books about North Korea is far longer.",
4: "Mr. Tudor pushes into new social and economic territory with his book, including the rising role of immigrants, multicultural families and even gay people in South Korea. He lays out some of the contradictory behavior one finds in South Korea, such as the unending desire for new and trendy gadgets and fashion and yet the tunnel-like view of what constitutes a successful life. At the end, he asks the question that nearly every visitor has after spending some time in South Korea: why aren&#39;t people happier with what they&#39;ve done?",
}

T5 = {
1: "It happens every semester. A student triumphantly points out that Jean-Jacques Rousseau is undermining himself when he claims &quot;the man who reflects is a depraved animal,&quot; or that Ralph Waldo Emerson&#39;s call for self-reliance is in effect a call for reliance on Emerson himself. Trying not to sound too weary, I ask the student to imagine that the authors had already considered these issues.",
2: "Instead of trying to find mistakes in the texts, I suggest we take the point of view that our authors created these apparent &quot;contradictions&quot; in order to get readers like us to ponder more interesting questions. How do we think about inequality and learning, for example, or how can we stand on our own feet while being open to inspiration from the world around us? Yes, there&#39;s a certain satisfaction in being critical of our authors, but isn&#39;t it more interesting to put ourselves in a frame of mind to find inspiration in them?",
3: "Our best college students are very good at being critical. In fact being smart, for many, means being critical. Having strong critical skills shows that you will not be easily fooled. It is a sign of sophistication, especially when coupled with an acknowledgment of one&#39;s own &quot;privilege&quot;.",
4: "The combination of resistance to influence and deflection of responsibility by confessing to one&#39;s advantages is a sure sign of one&#39;s ability to negotiate the politics of learning on campus. But this ability will not take you very far beyond the university. Taking things apart, or taking people down, can provide the satisfactions of cynicism. But this is thin gruel.",
5: "The skill at unmasking error, or simple intellectual one-upmanship, is not totally without value, but we should be wary of creating a class of self-satisfied debunkers &mdash; or, to use a currently fashionable word on campus, people who like to &quot;trouble&quot; ideas. In overdeveloping the capacity to show how texts, institutions or people fail to accomplish what they set out to do, we may be depriving students of the chance to learn as much as possible from what they study.",
6: "In campus cultures where being smart means being a critical unmasker, students may become too good at showing how things can&#39;t possibly make sense. They may close themselves off from their potential to find or create meaning and direction from the books, music and experiments they encounter in the classroom.",
7: "Once outside the university, these students may try to score points by displaying the critical prowess for which they were rewarded in school, but those points often come at their own expense. As debunkers, they contribute to a cultural climate that has little tolerance for finding or making meaning &mdash; a culture whose intellectuals and cultural commentators get &quot;liked&quot; by showing that somebody else just can&#39;t be believed. But this cynicism is no achievement.",
8: "Liberal education in America has long been characterized by the intertwining of two traditions: of critical inquiry in pursuit of truth and exuberant performance in pursuit of excellence. In the last half-century, though, emphasis on inquiry has become dominant, and it has often been reduced to the ability to expose error and undermine belief. The inquirer has taken the guise of the sophisticated (often ironic) spectator, rather than the messy participant in continuing experiments or even the reverent beholder of great cultural achievements.",
9: "Of course critical reflection is fundamental to teaching and scholarship, but fetishizing disbelief as a sign of intelligence has contributed to depleting our cultural resources. Creative work, in whatever field, depends upon commitment, the energy of participation and the ability to become absorbed in works of literature, art and science. That type of absorption is becoming an endangered species of cultural life, as our nonstop, increasingly fractured technological existence wears down our receptive capacities.",
10: "In my film and philosophy class, for example, I have to insist that students put their devices away while watching movies that don&#39;t immediately engage their senses with explosions, sex or gag lines. At first they see this as some old guy&#39;s failure to grasp their skill at multitasking, but eventually most relearn how to give themselves to an emotional and intellectual experience, one that is deeply engaging partly because it does not pander to their most superficial habits of attention. I usually watch the movies with them (though I&#39;ve seen them more than a dozen times), and together we share an experience that becomes the subject of reflection, interpretation and analysis. We even forget our phones and tablets when we encounter these unexpected sources of inspiration.",
11: "Liberal learning depends on absorption in compelling work. It is a way to open ourselves to the various forms of life in which we might actively participate. When we learn to read or look or listen intensively, we are, at least temporarily, overcoming our own blindness by trying to understand an experience from another&#39;s point of view. We are not just developing techniques of problem solving; we are learning to activate potential, and often to instigate new possibilities.",
12: "Yes, hard-nosed critical thinking is a useful tool, but it also may become a defense against the risky insight that absorption can offer. As students and as teachers we sometimes crave that protection; without it we risk changing who we are. We risk seeing a different way of living not as something alien, but as a possibility we might be able to explore, and even embrace.",
13: "Liberal education must not limit itself to critical thinking and problem solving; it must also foster openness, participation and opportunity. It should be designed to take us beyond the campus to a life of ongoing, pragmatic learning that finds inspiration in unexpected sources, and increases our capacity to understand and contribute to the world &mdash; and reshape it, and ourselves, in the process.",
}

COMMENTS = ("<strong>Tom</strong> (6/5/2014): Are you serious? $60,000 taken out in student loans for tuition, "
            "room and board and no prospect for a job. Better to stick to any STEM program in college "
            "(science, technology, engineering, math). You can get the type of education discussed in the "
            "article, and even more, from your local library, with maybe $1.50 in late fines when you are "
            "finished, if you really want to explore what it means to be human. PUH-LEEZE. Clearly this "
            "article was written for the American higher education &quot;rip-off machine&quot;.<br><br>"
            "<strong>Laura</strong> (6/5/2014): It takes months or years to design and build a structure, "
            "and most are incapable of doing this; however, it takes hours and less skill to wreck it.")

def P(d, keys):
    return "".join(para(k, d[k]) for k in keys)

slides = []

# ================= 1. COVER =================
cover = '''<div class="s1-card-wrapper">
    <div class="xdf-header-bar">
      <div class="xdf-logo-text">DSE READING <span>// 2015 真题</span></div>
      <div class="xdf-sub-text">Paper 1 · Reading</div>
    </div>
    <div style="padding:28px 32px">
      <div class="slide-h1" style="text-align:center;margin-bottom:6px">2015 HKDSE 英语 Paper 1</div>
      <div class="slide-h2" style="text-align:center;color:var(--fcc-purple-dark);margin-bottom:24px">Warm-hearted Koreans · Young Minds in Critical Condition</div>
      <div style="display:flex;justify-content:center;margin-bottom:24px">
        <div class="teacher-badge">
          <div class="tb-avatar">成</div>
          <div class="tb-name">成雨老师</div>
          <div class="tb-tag">TEACHER</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:20px">
        <div class="class-badge">真题精讲 · 2015 阅读卷 · Part A + Part B2</div>
      </div>
      <div class="s1-meta-grid">
        <div class="s1-meta-card"><div class="sm-label">Part A 必做</div><div class="sm-value">Q1–Q31</div><div class="sm-sub">Text 1 采访 + Text 2 书评</div></div>
        <div class="s1-meta-card"><div class="sm-label">Part B1 较易</div><div class="sm-value">Q32–Q55</div><div class="sm-sub">本课件不涉及（跳过）</div></div>
        <div class="s1-meta-card"><div class="sm-label">Part B2 困难</div><div class="sm-value">Q56–Q77</div><div class="sm-sub">Young Minds in Critical Condition</div></div>
      </div>
      <div class="timeline-row">
        <div class="tl-seg c1"><div class="seg-ph">Part A</div><div class="seg-name">Text 1+2</div><div class="sm-sub">韩国采访 + Q1–31</div></div>
        <div class="tl-seg c2"><div class="seg-ph">Part B1</div><div class="seg-name">跳过</div><div class="sm-sub">Q32–55 不涉及</div></div>
        <div class="tl-seg c3"><div class="seg-ph">Part B2</div><div class="seg-name">Text 5</div><div class="sm-sub">批判性思维 + Q56–77</div></div>
        <div class="tl-seg c4"><div class="seg-ph">收尾</div><div class="seg-name">Done</div><div class="sm-sub">数据榜 + 复盘</div></div>
      </div>
    </div>
    <div class="xdf-grid-pattern"><span>USE ARROW KEYS // SWIPE TO NAVIGATE</span></div>
  </div>'''
slides.append(slide("封面", "cover", "开场", cover))

# ================= 2. Part A Entry Test =================
a_entry_cards = [
    ("expatriate", "旅居国外者"),
    ("correspondent", "（驻外）记者"),
    ("byline", "（作者）署名"),
    ("in the pipeline", "在筹备中；即将推出"),
    ("off the radar", "不受关注的；鲜为人知的"),
    ("superficial", "肤浅的"),
    ("flashy", "浮华的"),
    ("raucous", "喧闹刺耳的"),
    ("stoicism", "坚忍；淡泊"),
    ("cynical", "愤世嫉俗的"),
]
body = ('<div class="sec-label">Part A · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">核心词汇 Words — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 1–2 Korea · 10 words · 每题 1 分</div>'
        + flip_grid(a_entry_cards))
slides.append(slide("Part A Entry Test", "entry-test", "Part A", body))

# ================= 3. Q1–Q5 · Text 1 ¶1–3 =================
left = '<h4>Text 1: In from the cold among warm-hearted Koreans（¶1–3）</h4>' + P(T1, [1, 2, 3])

q1 = sa("q1", "Q1 · Short answer · 1 mark", chip(52),
        "Who is <strong>Charmaine Chan</strong>?",
        '<p><strong>writer of this article // journalist // reporter // interviewer // the person who asks '
        'the questions</strong></p>'
        '<p>&#182;1 &quot;He speaks to <em>Charmaine Chan</em>&quot; — 采访者提问，Tudor 回答。'
        '&#10007; 只答 <em>writer</em> 不得分：Tudor 才是书的作者，Chan 是采访记者。</p>')

q2 = sa("q2", "Q2 · Short answer · 1 mark", chip(9),
        "How many more books is Daniel planning to write?",
        '<p><strong>several // some more (books)</strong></p>'
        '<p>&#182;1 &quot;has several other volumes <em>in the pipeline</em>&quot; — 全卷第二大坑（9%）：'
        '多数考生被「two books」带跑答 2 或 1，但 <em>has authored</em> 是已完成，'
        '<em>several other volumes in the pipeline</em> 才是「计划中」。注意时态与 referent。</p>')

q3 = ('<div class="practice-mcq" id="q3-box"><div class="pmcq-label">Q3 · Ordering · 1 mark ' + chip(64) + '</div>'
      '<div class="pmcq-q">Order the following events in Daniel&#39;s life. Number the events (1&ndash;4). '
      'The first has been done for you.</div>'
      '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2.1">'
      'Started working for <em>The Economist</em> &rarr; '
      + cloze("3") + '<br>'
      'Wrote his first book about Korea &rarr; ' + cloze("4") + '<br>'
      'Became an English teacher &rarr; ' + cloze("2") + '<br>'
      'Studied at Oxford University &rarr; <strong>1</strong>（已给）</div>'
      '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; 时间线锚点：'
      'Oxford 毕业（最早已给 1）&rarr; 刚到首尔教英文（Ten years ago）&rarr; 2010&ndash;2013 加入 '
      'Economist &rarr; 写第一本书（The Impossible Country, 2012）&rarr; 新书 A Geek in Korea（2014）。'
      '排序题先抓年份再排序。</span></div></div>')

q4 = sa("q4", "Q4 · Reference · 1 mark", chip(41),
        "Who does <strong>&quot;they&quot;</strong> refer to in line 9?",
        '<p><strong>(other) westerners (in Korea) // the west / westerners // people (living) in western / '
        'other countries // (other) journalists // (other) writers</strong></p>'
        '<p>&#182;1 &quot;You started, <em>like so many other Westerners in Korea</em>, teaching English.&quot; '
        '— they 回指 other Westerners in Korea。&#10007; (most) people (in general)、&#10007; Koreans。</p>')

q5 = mcq("q5", "Q5 · MC · 1 mark", chip(75),
         "What does Daniel mean by <strong>&quot;off the radar&quot;</strong> (line 10)?",
         [("A", "famous", False, "与文意相反。"),
          ("B", "disliked", False, "原文没说被讨厌。"),
          ("C", "exciting", False, "无此含义。"),
          ("D", "unknown", True, "")],
         "&#128273; &#182;3 &quot;Korea is a bit <em>off the radar</em> for most people in Western "
         "countries&quot; — 不在大众视野内 = unknown。下句 Japan was the big story / China 受关注 "
         "反向印证 Korea 被忽视。")

right = q1 + q2 + q3 + q4 + q5
body = ('<div class="sec-label">Part A · Text 1 · Q1–Q5</div>'
        '<div class="slide-h3">In from the Cold — 采访开头与时间线</div>'
        + split("Text 1 (¶1–3)", left, right))
slides.append(slide("Q1–Q5 · Text 1 ¶1–3", "practice", "Part A", body, "text1"))

# ================= 4. Q6–Q10 · Text 1 ¶3–5 =================
left = '<h4>Text 1: jeong / han / heung（¶3–5）</h4>' + P(T1, [3, 4, 5])

q6 = sa("q6", "Q6 · Short answer · 1 mark", chip(45),
        "Which country does the writer suggest is currently the <strong>&quot;big story&quot;</strong> (line 10)?",
        '<p><strong>China</strong></p>'
        '<p>&#182;3 &quot;people pay attention to <em>China</em> now because of its huge population and '
        'market&quot; — 注意时态对比：1980s Japan &rarr; now China &rarr; Korea 被夹在中间被忽视。</p>')

q7 = sa("q7", "Q7 · Short answer · 1 mark", chip(57),
        "Why is <em>jeong</em> referred to as <strong>&quot;the invisible hug&quot;</strong> (line 13)?",
        '<p><strong>it is the warmth between people and mutual sacrifice</strong></p>'
        '<p>&#182;4 <em>jeong</em> = the warmth between people and mutual sacrifice — 拥抱是「温暖」的意象，'
        '「无形」是因为它是人与人之间的情感联结，不是肢体动作。</p>')

q8 = sa("q8", "Q8 · Short answer · 1 mark", chip(25),
        "What does Daniel think is <strong>&quot;nonsense&quot;</strong> (line 15)?",
        '<p><strong>jeong / han are uniquely Korean / exclusive concepts to Korea</strong></p>'
        '<p>&#182;4 &quot;A lot of Koreans say jeong... is <em>uniquely Korean</em>... <em>It&#39;s nonsense'
        '</em>&quot; — nonsense 指的是「只有韩国才有」这个说法。&#10007; 照抄 Korea has words to describe '
        'these things（那是 Daniel 认可的部分，不是 nonsense 的内容）。仅 25% 对。</p>')

q9 = sa("q9", "Q9 · Short answer · 1 mark", chip(22),
        "Why did Koreans drink a lot and sing raucously at traditional funerals?",
        '<p><strong>to overcome / forget their sadness / sorrow / burden / oppression</strong></p>'
        '<p>&#182;4 <em>han</em>（can&#39;t correct 的负担）&rarr; pursue all-out, manic fun 暂时忘却 &rarr; '
        'funerals 上的 extreme alcohol consumption and raucous singing 就是为了忘掉悲伤。</p>')

q10i = sub_sa("q10i", "i",
              "Name one <strong>difference</strong> between Koreans and Westerners, as seen by Daniel.",
              '<p><strong>Sadness and happiness both seem to be magnified in Korea // Koreans are / tend to be '
              'more emotional / show more feelings</strong></p>'
              '<p>&#182;5 &quot;sadness and happiness both seem to be <em>magnified</em> in Korea&quot; — '
              '&#10007; show a lot of stoicism / self-control（那是西方人的刻板印象，不是差异）。</p>', 17)
q10ii = sub_sa("q10ii", "ii",
               "Name one <strong>similarity</strong> between Koreans and Westerners, as seen by Daniel.",
               '<p><strong>Koreans are very expressive and open with their feelings</strong></p>'
               '<p>&#182;5 &quot;But Koreans in fact tend to be <em>very expressive and open</em> with their '
               'feelings&quot; — 与「inscrutable oriental」刻板印象相反，这一点上与西方人有情感表达的共通。</p>', 48)

right = q6 + q7 + q8 + q9 + '<div class="practice-mcq" id="q10-box"><div class="pmcq-label">Q10 · Short answer · 2 marks</div><div class="pmcq-q">According to paragraph 5, name one difference and one similarity between Koreans and Westerners, as seen by Daniel.</div>' + q10i + q10ii + '</div>'
body = ('<div class="sec-label">Part A · Text 1 · Q6–Q10</div>'
        '<div class="slide-h3">Jeong · Han · Heung — 韩式情感三词</div>'
        + split("Text 1 (¶3–5)", left, right))
slides.append(slide("Q6–Q10 · Text 1 ¶3–5", "practice", "Part A", body, "text1"))

# ================= 5. Q11–Q14 · Text 1 ¶6–7 =================
left = '<h4>Text 1: K-pop 与 3rd Line Butterfly（¶6–7）</h4>' + P(T1, [6, 7])

q11 = sa("q11", "Q11 · Short answer · 1 mark", chip(53),
         "Why doesn&#39;t Daniel like K-pop?",
         '<p><strong>its superficial // it&#39;s not meaningful</strong></p>'
         '<p>&#182;7 &quot;there&#39;s really good music in Korea that&#39;s not <em>superficial</em>&quot; '
         '— 反向推理：Daniel 嫌 K-pop 肤浅。&#10007; it&#39;s for teenagers（那是客观描述，不是不喜欢的理由）。</p>')

q12 = sa("q12", "Q12 · Short answer · 1 mark", chip(82),
         "Who or what does the word <strong>&quot;them&quot;</strong> (line 31) refer to?",
         '<p><strong>(members of) 3rd Line Butterfly</strong></p>'
         '<p>&#182;7 &quot;these guys are not rich and famous; they&#39;re ordinary guys you can be friends '
         'with. I am friends with <em>them</em>&quot; — them 回指 3rd Line Butterfly（乐队成员）。'
         '&#10007; a band / Korean music / culture。</p>')

q13 = sa("q13", "Q13 · Short answer · 1 mark", chip(11),
         "What opinion do both Daniel and Psy share?",
         '<p><strong>Gangnam is superficial / flashy</strong></p>'
         '<p>&#182;7 Psy &quot;making fun of Gangnam... which is <em>superficial and flashy</em>&quot; — '
         'Daniel 借 Psy 的玩笑点出同一看法。全卷 Part A 最难之一（11%）：要从「笑着调侃」里读出共同观点。</p>')

q14 = tfng_slide("q14", "Q14 · T / F / NG · 3 marks",
                 "Based on the information given in paragraph 7, decide if the following statements are True, False or Not Given.",
                 [("(i)", "Daniel is a friend of Psy.", "NG",
                   "¶7 只说他采访了 Psy（There's an interview with Psy），没说两人是朋友 — Not Given。", 72),
                  ("(ii)", "3rd Line Butterfly is a K-pop group.", "F",
                   "¶7 \"all Korean music is <em>K-pop</em>, but there's really good music... not "
                   "superficial\" + 3rd Line Butterfly 是 Daniel 喜欢的非 K-pop 乐队 — 与「是 K-pop 组合」相反。", 68),
                  ("(iii)", "Daniel thinks some good Korean music isn&#39;t well known internationally.", "T",
                   "¶7 \"doesn't go <em>outside of Korea</em>\" — 好音乐没走出韩国 = 国际上不知名。", 82)])

right = q11 + q12 + q13 + q14
body = ('<div class="sec-label">Part A · Text 1 · Q11–Q14</div>'
        '<div class="slide-h3">K-pop、Psy 与真正的韩国音乐</div>'
        + split("Text 1 (¶6–7)", left, right))
slides.append(slide("Q11–Q14 · Text 1 ¶6–7", "practice", "Part A", body, "text1"))

# ================= 6. Q15–Q17 · Text 1 ¶8 =================
left = '<h4>Text 1: Korean soaps 与 Cinderella stories（¶8）</h4>' + P(T1, [8])

q15 = sa("q15", "Q15 · Short answer · 1 mark", chip(83),
         "What are <strong>&quot;soaps&quot;</strong> (line 34)?",
         '<p><strong>(Korean) drama(s) // (romantic) TV series / programme // soap opera(s)</strong></p>'
         '<p>&#182;8 &quot;How about Korean <em>soaps</em>?&quot; &rarr; &quot;I don&#39;t like the '
         '<em>drama</em> stuff&quot; — soap (opera) = 肥皂剧 = 韩剧。&#10007; Korean soaps（同义反复）、'
         '&#10007; Cinderella stories（那是剧情内容，不是 soaps 的指代）。</p>')

q16 = sa("q16", "Q16 · Short answer · 1 mark", chip(62),
         "Why does Daniel think &quot;Korea&#39;s probably not the best country in which to be a woman&quot; (lines 36-37)?",
         '<p><strong>the best way to become wealthy / achieve status / to become successful is to marry</strong></p>'
         '<p>&#182;8 &quot;If you&#39;re a young woman in Korea, what&#39;s the best way to become wealthy or '
         'to achieve status? Sadly, it&#39;s to <em>marry</em> somebody.&quot; — 女性实现阶层跃升只能靠婚姻。</p>')

q17 = ('<div class="practice-mcq" id="q17-box"><div class="pmcq-label">Q17 · Summary cloze · 5 marks</div>'
       '<div class="pmcq-q">Complete the summary of paragraph 8 by writing ONE word to fill in each blank. '
       'Click each blank to check.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">Daniel doesn&#39;t like '
       'Korean (i) ' + cloze("drama(s) // soaps") + chip(90)
       + ' because he thinks the stories are too emotional. The stories are often the same, with a (ii) '
       + cloze("wealthy // rich") + chip(91)
       + ' man meeting a (iii) ' + cloze("beautiful // young") + chip(88)
       + ' lady who comes from a (iv) ' + cloze("poor") + chip(78)
       + ' background and in the end they (v) ' + cloze("marry") + chip(44) + '.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; 摘要填空 = 回原文'
       '&quot;beautiful girl from <em>poor</em> family marries <em>rich</em> guy&quot; 换词性/换角色复述。'
       '(ii) &#10007; affluent（原文没有这个词，考试要求从原文取词）。(v) marry 最抽象（44%）：'
       'in the end they marry = 女孩嫁入豪门。</span></div></div>')

right = q15 + q16 + q17
body = ('<div class="sec-label">Part A · Text 1 · Q15–Q17</div>'
        '<div class="slide-h3">Cinderella Stories — 韩剧批判</div>'
        + split("Text 1 (¶8)", left, right))
slides.append(slide("Q15–Q17 · Text 1 ¶8", "practice", "Part A", body, "text1"))

# ================= 7. Q18–Q21 · Text 1 ¶9–10 =================
left = '<h4>Text 1: Gangnam mothers 与 jeong（¶9–10）</h4>' + P(T1, [9, 10])

q18 = sa("q18", "Q18 · Short answer · 1 mark", chip(64),
         "Why does Daniel think that Gangnam mothers are <strong>&quot;scary&quot;</strong> in line 40?",
         '<p><strong>they make children cry // they get mad at bad results // make them work hard // '
         'obsessed with education</strong></p>'
         '<p>&#182;9 &quot;if they didn&#39;t get an A grade... their parents would <em>get mad</em> and '
         'the next time you saw them they&#39;d be <em>crying</em>&quot; — 成绩不好就发怒，孩子被逼哭。</p>')

q19 = sa("q19", "Q19 · Short answer · 1 mark", chip(21),
         "What does Daniel mean by <strong>&quot;materially&quot;</strong> in line 41?",
         '<p><strong>(they have many) things / possessions / goods / money / wealth</strong></p>'
         '<p>&#182;9 &quot;kids who, materially, led awesome lives... big Mercedes with bags as big as they '
         'were&quot; — materially = 物质上（豪车、名包）。仅 21% 对：要答出「物质/财产」的释义而非照抄。</p>')

q20 = sa("q20", "Q20 · Short answer · 1 mark", chip(74),
         "Why are wealthy Koreans obsessed with education?",
         '<p><strong>(they want) to keep / preserve their status / position in society // to show (the world) '
         'their children are doing well</strong></p>'
         '<p>&#182;9 &quot;It&#39;s a <em>status thing</em>: preserve your status and show the rest of the '
         'world...&quot; — 教育是维护社会地位、向外展示的工具。</p>')

q21 = sa("q21", "Q21 · Short answer · 1 mark", chip(60),
         "According to paragraph 10, how has Daniel changed since he arrived in Korea?",
         '<p><strong>he is a better friend // more connected to people // more warm / friendly // less cynical</strong></p>'
         '<p>&#182;10 &quot;Korea made me a <em>better friend</em> to my friends&quot; — 从冷峻愤世的英国人变得'
         '更温暖、与人相连。</p>')

right = q18 + q19 + q20 + q21
body = ('<div class="sec-label">Part A · Text 1 · Q18–Q21</div>'
        '<div class="slide-h3">Gangnam Mothers — 教育焦虑与身份</div>'
        + split("Text 1 (¶9–10)", left, right))
slides.append(slide("Q18–Q21 · Text 1 ¶9–10", "practice", "Part A", body, "text1"))

# ================= 8. Q22–Q24 · Text 1 ¶10 + title =================
left = '<h4>Text 1: 标题解读（¶10 + title）</h4>' + P(T1, [10]) + \
       '<div class="passage-excerpt"><div class="para-num">TITLE</div>In from the cold among ' \
       'warm-hearted Koreans</div>'

q22 = sa("q22", "Q22 · Short answer · 1 mark", chip(47),
         "Overall, what does Daniel feel is <strong>most attractive</strong> about Korea?",
         '<p><strong>jeong // the warmth between people // the people are warm</strong></p>'
         '<p>&#182;10 &quot;This <em>jeong</em> stuff &mdash; that&#39;s the thing that <em>keeps me in '
         'Korea</em>&quot; — 最吸引他的是 jeong（人与人之间的温暖）。</p>')

q23 = sa("q23", "Q23 · Short answer · 1 mark", chip(58),
         "What does <strong>&quot;In from the cold&quot;</strong> in the title suggest about Britain?",
         '<p><strong>(Cold) refers to the cold culture / society (in Britain) // British are cold and cynical</strong></p>'
         '<p>&#182;10 &quot;England&#39;s a <em>cold</em> society... English people were a bit too '
         '<em>cynical and cold</em>&quot; — 标题的 cold 一语双关：从英国的「冷漠文化」走进韩国的「温暖」。</p>')

q24 = sa("q24", "Q24 · Short answer · 1 mark", chip(19),
         "Who or what does <strong>&quot;Geek&quot;</strong> in the title of Daniel&#39;s book refer to?",
         '<p><strong>Daniel (Tudor) // the writer himself</strong></p>'
         '<p>&#182;1 书名 <em>A Geek in Korea</em> — Geek 指的是作者 Daniel Tudor 本人'
         '（Oxford 毕业沉迷韩国文化的书呆子式研究者）。仅 19% 对。</p>')

right = q22 + q23 + q24
body = ('<div class="sec-label">Part A · Text 1 · Q22–Q24</div>'
        '<div class="slide-h3">In from the Cold — 标题双关收尾</div>'
        + split("Text 1 (¶10 + Title)", left, right))
slides.append(slide("Q22–Q24 · Text 1 收尾", "practice", "Part A", body, "text1"))

# ================= 9. Q25–Q28 · Text 2 ¶1–3 =================
left = '<h4>Text 2: Tudor&#39;s Book Covers Implausible, Impossible Korea（¶1–3）</h4>' + P(T2, [1, 2, 3])

q25 = sa("q25", "Q25 · Short answer · 1 mark", chip(28),
         "What is the irony in paragraph 1?",
         '<p><strong>Daniel (Tudor) is one of the most / is a very influential foreign correspondents (in '
         'South Korea) but also one of the least known</strong></p>'
         '<p>&#182;1 &quot;one of the most <em>influential</em>... and one of the <em>least known</em>&quot; '
         '— 反讽：影响力最大却最没名气（Economist 不署名 → 匿名发表）。仅 28% 对：要把「最有影响力」与'
         '「最不为人知」的对比都写出来。</p>')

q26 = sa("q26", "Q26 · Short answer · 1 mark", chip(63),
         "Other than Daniel, which writer mentioned in Text 2 has definitely lived in Korea?",
         '<p><strong>(Mr) Michael // Breen</strong></p>'
         '<p>&#182;2 &quot;another influential British <em>expat</em>, Michael Breen&quot; — expat（旅居'
         '海外者）= 一定在韩国生活过。其他被提到的作者（Hussain / Kirk / Coyner / Koehler）文中没说是 expat。</p>')

q27 = sa("q27", "Q27 · Short answer · 1 mark", chip(4),
         "What is the meaning of a <strong>&quot;canon&quot;</strong> (line 11)?",
         '<p><strong>(a list of) must-read books / indispensable / important books // books that should be read</strong></p>'
         '<p>&#182;3 &quot;That&#39;s a small <em>canon</em>&quot; — 全卷最难（4%）！三条上下文线索：'
         '① that 回指上段「must-read books 清单」；② <em>the other indispensables</em> 引出书单；'
         '③ 段尾 <em>the list of must-read books</em> 再现。macro-focus（跨段上下文）比 micro-focus 更重要。</p>')

q28 = sa("q28", "Q28 · Short answer · 1 mark", chip(7),
         "What does Evan Ramstad&#39;s comment about North Korea in lines 13-14 imply?",
         '<p><strong>(there is a) greater interest in reading about North Korea (than South Korea) // '
         'North Korea is more interesting / popular / attractive (than South Korea) // there are more '
         '(must-read) books published about North Korea (than South Korea)</strong></p>'
         '<p>&#182;3 &quot;the list of must-read books about North Korea is <em>far longer</em>&quot; — '
         '推理：书单更长 = 关于朝鲜的书更受关注/更多。仅 7% 对：照抄原句不得分，要说出 implication。</p>')

right = q25 + q26 + q27 + q28
body = ('<div class="sec-label">Part A · Text 2 · Q25–Q28</div>'
        '<div class="slide-h3">The Impossible Country — 书评推断</div>'
        + split("Text 2 (¶1–3)", left, right))
slides.append(slide("Q25–Q28 · Text 2 ¶1–3", "practice", "Part A", body, "text2"))

# ================= 10. Q29–Q31 · Text 2 ¶4 =================
left = '<h4>Text 2: 书评收尾（¶4）</h4>' + P(T2, [4])

q29 = sa("q29", "Q29 · Short answer · 1 mark", chip(31),
         "How does the content of Daniel Tudor&#39;s book differ from Michael Breen&#39;s?",
         '<p><strong>(Daniel&#39;s book pushes into) new social and economic territory // (including the) '
         'rising role of immigrants, multicultural families / (and even) gay people (in Korea)</strong></p>'
         '<p>&#182;4 &quot;pushes into <em>new social and economic territory</em>... the rising role of '
         '<em>immigrants, multicultural families and even gay people</em>&quot; — Breen 没覆盖的新领域。</p>')

q30i = sub_sa("q30i", "i",
              "State the contradiction: the desire for gadgets and fashion.",
              '<p><strong>unending desire for (new and trendy) gadgets and fashion</strong></p>'
              '<p>&#182;4 &quot;the <em>unending desire</em> for new and trendy gadgets and fashion&quot; — '
              '一面是追逐新潮。</p>', 43)
q30ii = sub_sa("q30ii", "ii",
               "State the contradiction: the view of a successful life.",
               '<p><strong>the tunnel-like / narrow-minded / unchanging view of what constitutes a successful life</strong></p>'
               '<p>&#182;4 &quot;yet the <em>tunnel-like view</em> of what constitutes a successful life&quot; — '
               '另一面却是视野狭窄、对「成功人生」的定义一成不变。2 marks 各占 1 分。</p>', 34)

q31i = sub_sa("q31i", "i",
              "What does the question suggest about Koreans&#39; achievements?",
              '<p><strong>Koreans have achieved a great deal // although they have many achievements / are successful</strong></p>'
              '<p>&#182;4 &quot;why aren&#39;t people happier with <em>what they&#39;ve done</em>&quot; — '
              '暗示韩国人成就已经很多。</p>', 33)
q31ii = sub_sa("q31ii", "ii",
               "What does the question suggest about how Koreans feel?",
               '<p><strong>but they aren&#39;t content with their success / achievements // they are not happy / '
               'satisfied // they are too hard on themselves</strong></p>'
               '<p>&#182;4 &quot;why aren&#39;t people <em>happier</em>&quot; — 对成就不满足、对自己太苛刻。'
               '2 marks 各占 1 分。</p>', 22)

right = q29 + \
        '<div class="practice-mcq" id="q30-box"><div class="pmcq-label">Q30 · Short answer · 2 marks</div><div class="pmcq-q">What is the contradiction between how Koreans see success and their love of trendy gadgets and fashion?</div>' + q30i + q30ii + '</div>' + \
        '<div class="practice-mcq" id="q31-box"><div class="pmcq-label">Q31 · Short answer · 2 marks</div><div class="pmcq-q">What does the question Daniel poses at the end of his book suggest about his view of Koreans and their achievements?</div>' + q31i + q31ii + '</div>'
body = ('<div class="sec-label">Part A · Text 2 · Q29–Q31</div>'
        '<div class="slide-h3">Contradictions — 新潮与狭窄的成功观</div>'
        + split("Text 2 (¶4)", left, right))
slides.append(slide("Q29–Q31 · Text 2 ¶4", "practice", "Part A", body, "text2"))

# ================= 11. Part A Close Reading =================
cr = ('<div class="sec-label">Part A · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;1: ...has several other volumes ' + sig("in the pipeline", "在筹备中（Q2 的关键）") + '.</p>'
      '<p style="margin-top:14px">&#182;3: Korea is a bit ' + sig("off the radar", "不在大众视野内")
      + ' for most people... Japan was ' + sig("the big story", "大热门") + '. Korea has '
      + sig("fallen in between", "夹在中间被忽视") + '.</p>'
      '<p style="margin-top:14px">&#182;4: <em>jeong</em> &mdash; the warmth between people and '
      + sig("mutual sacrifice", "相互牺牲") + '... ' + sig("manic fun", "疯狂的玩乐")
      + '... ' + sig("raucous singing", "喧闹的歌声") + '.</p>'
      '<p style="margin-top:14px">&#182;5: the stereotypes of ' + sig("stoicism and self-control", "坚忍与自制（刻板印象）")
      + '... the so-called ' + sig("inscrutable oriental", "高深莫测的东方人") + '... both seem to be '
      + sig("magnified", "被放大") + '.</p>'
      '<p style="margin-top:14px">&#182;7: music that&#39;s not ' + sig("superficial", "肤浅的")
      + '... Psy is ' + sig("cheeky", "俏皮的") + ', making fun of Gangnam, which is '
      + sig("flashy", "浮华的") + '.</p>'
      '<p style="margin-top:14px">&#182;8: ' + sig("Cinderella stories", "灰姑娘式剧情")
      + ': beautiful girl from poor family marries rich guy.</p>'
      '<p style="margin-top:14px">&#182;9: It&#39;s a ' + sig("status thing", "身份地位的事")
      + ': ' + sig("preserve your status", "保住你的地位") + '.</p>'
      '<p style="margin-top:14px">&#182;10: I thought English people were a bit too '
      + sig("cynical and cold", "愤世嫉俗而冷漠") + '.</p>'
      '<p style="margin-top:14px">Text 2 &#182;1: one of the most influential... and one of the '
      + sig("least known", "最不为人知") + '... published ' + sig("anonymously", "匿名地") + '.</p>'
      '<p style="margin-top:14px">Text 2 &#182;3: That&#39;s a small ' + sig("canon", "必读书单（Q27 全卷最难）")
      + '... the other ' + sig("indispensables", "必读之作") + '.</p>'
      '<p style="margin-top:14px">Text 2 &#182;4: the ' + sig("tunnel-like view", "隧道式狭窄视野")
      + ' of what constitutes a successful life.</p></div>')
slides.append(slide("Part A · Close Reading", "close-reading", "Part A", cr))
