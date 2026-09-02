#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate index.html for 2017 DSE Paper 1 Reading courseware (v1).
Design system: copied from 2018DSE-Paper1_v1 (fCC x Khan style).
Features: pixel-brick rate covers (2-click shatter) + Show Data toggle button.
Part 1: helpers, passages, Part A slides (Q1-21, Text 1 The Myth of Recycling).
Source: 2017_DSE_英语阅读卷_题目答案与正确率.md
"""
def esc(s):
    """Escape for double-quoted HTML attribute values.
    & < > and " must be escaped; the single quote ' is legal inside
    double-quoted attributes and is kept verbatim (html.escape with
    quote=True would needlessly turn it into &#x27;)."""
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
    parentheses. Handles bare tags, already-wrapped tags, double/nested
    wrapping, and unbalanced parens by stripping every leading '(' and every
    trailing ')' before wrapping exactly once:
        'i' -> '(i)'   '(i)' -> '(i)'   '((i))' -> '(i)'
        '(i))' -> '(i)'   '(i' -> '(i)'   ' v ' -> '(v)'
    This prevents the double-paren bug where a caller passes '(i)' into a
    template that wraps with parentheses again (producing '((i))')."""
    s = str(sub).strip()
    while s.startswith('('):
        s = s[1:]
    while s.endswith(')') and s:
        s = s[:-1]
    return '(' + s + ')'

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
1: "If you live in the United States, you probably do some form of recycling. It's likely that you separate paper from plastic and glass and metal. You rinse bottles and cans, and you might put food scraps in a container destined for a composting facility. As you sort everything into the right bins, you probably assume that recycling is helping your community and protecting the environment. But is it? Are you in fact wasting your time?",
2: "In 1996, I wrote an article arguing that the recycling process as we carried it out was wasteful. I presented plenty of evidence that recycling was costly and ineffectual, but its defenders said that it was unfair to rush to judgment. Noting that the modern recycling movement had really just begun a few years earlier, they predicted it would flourish as the industry matured and the public learned how to recycle properly.",
3: "So, what's happened since then? While it's true that the recycling message has reached more people than ever, when it comes to the bottom line, both economically and environmentally, not much has changed at all.",
4: "Despite decades of initiatives, it's still typically more expensive for local governments to recycle household waste than to send it to a landfill. Most recycled materials are exported, and the prices for these materials have plummeted because of lower oil prices and reduced demand for them overseas. The slump has forced some recycling companies to shut plants and cancel plans for new technologies.",
5: "The future for recycling looks even worse. As cities move beyond recycling paper and metals, and into glass, food scraps and assorted plastics, the costs rise sharply while the environmental benefits decline and sometimes vanish. &quot;If you believe recycling is good for the planet and that we need to do more of it, then there's a crisis to confront,&quot; says David Steiner, the CEO of Waste Management, the largest recycler of household trash in the United States. &quot;Trying to turn garbage into gold costs a lot more than expected. We need to ask ourselves: What is the goal here?&quot;",
6: "Recycling has been relentlessly promoted as a goal in and of itself: a public and private virtue that is indoctrinated in students from kindergarten through university. As a result, otherwise well-informed and educated people have no idea of the relative costs and benefits.",
7: "They probably assume, for instance, that recycling plastic must be helping the planet. They've been encouraged by the Environmental Protection Agency (E.P.A.), which assures the public that this results in fewer carbon emissions being released into the atmosphere. But how much difference does it make? Here's some perspective: To offset the carbon impact of one passenger's round-trip flight between New York and London, you'd have to recycle roughly 40,000 plastic bottles, assuming you fly economy. If you sit in business- or first-class, it could be more like 100,000.",
8: "Even those statistics might be misleading. Residents are instructed to rinse bottles before putting them in recycling bins, but the E.P.A.'s life-cycle calculation doesn't take that water into account. That single omission can make a big difference, according to author Chris Goodall. He calculates that if you wash plastic in water that was heated by coal-derived electricity, then the net effect of your recycling could be more carbon in the atmosphere.",
9: "To many public officials, recycling is a question of morality, not cost-benefit analysis. The Mayor of New York, Bill de Blasio, declared that by 2030 the city would no longer send any garbage to landfills. &quot;This is the way of the future if we're going to save our earth,&quot; he explained while announcing that New York would join other cities in moving toward a &quot;zero waste&quot; policy, which would require an unprecedented level of recycling.",
10: "But while politicians set higher goals, the national rate of recycling has stagnated in recent years. Yes, it's popular in affluent neighborhoods, but residents of low income areas don't have the same fervor for sorting garbage in their spare time.",
11: "The national rate of recycling rose during the 1990s to 25 percent, the goal set by an E.P.A. official, Winston Porter. He advised state officials that no more than 35 percent of the nation's trash was worth recycling, but some ignored him and set goals of 50 percent and higher. Most of those goals were never met and the national rate has been stuck around 34 percent in recent years.",
12: "&quot;It's practical to recycle cardboard and some paper, as well as selected metals and plastics,&quot; he says. &quot;But other materials don't make sense, including food waste and other compostables. The zero-waste goal makes no sense at all &mdash; it's very expensive with almost no real environmental benefit.&quot;",
13: "With the economic rationale gone, advocates for recycling have switched to environmental arguments. Researchers calculate that there are indeed such benefits to recycling, but not in the way that many people imagine.",
14: "Most of these benefits do not come from reducing the need for landfills and incinerators. Unlike earlier ones, a modern well-lined landfill in a rural area can have relatively little environmental impact. Decomposing garbage releases methane, a potent greenhouse gas, but landfill operators have started capturing it and using it to generate electricity. Modern incinerators, while politically unpopular in the United States, release so few pollutants that they've been widely accepted in the eco-conscious countries of Northern Europe and Japan for generating clean energy.",
15: "Moreover, recycling operations have their own environmental costs, like extra trucks on the road and pollution from recycling operations. Composting facilities around the country have inspired complaints about nauseating odors, swarming rats and defecating seagulls.",
16: "The environmental benefits of recycling come chiefly from reducing the need to manufacture new products &mdash; less mining, drilling and logging. But that's not so appealing to the workers in those industries that have accepted the environmental trade-offs that come with those jobs. Nearly everyone, though, approves of one potential gain from recycling: reduced emissions of greenhouse gases.",
17: "However, according to the E.P.A.'s estimates, virtually all the greenhouse benefits &mdash; more than 90 percent &mdash; come from just a few materials: paper, cardboard and aluminum in soda cans. Once you exclude these materials, the total annual savings in the United States from recycling everything else &mdash; plastics, glass, food, yard trimmings, textiles, rubber, leather &mdash; is only two-tenths of 1 percent of America's carbon footprint.",
}

T2 = {
"s1": "<strong>MILLENNIALS &mdash; Coming of age</strong><br><br>Millennials are the largest generation in history and are about to move into their prime spending years.<br><br>Companies want to understand the attitudes and lifestyle of Millennials because their shopping habits will make a big difference to their business.",
"s2": "<strong>Snug in the nest</strong><br><br>Snug in the nest, a growing number of Millennials are choosing to live at home with their parents.<br><br>Many Millennials don't want to own a home but their reluctance to enter the housing market could change.<br><br>As they get older, they will likely have a desire to settle down, and this could lead to a surge in home sales.",
"s3": "<strong>Access, not ownership</strong><br><br>It's not just homes: Millennials have been reluctant to buy items such as cars, music and luxury goods.<br><br>Instead, they're turning to a new set of services that provide access to products without the burdens of ownership, giving rise to what's being called a &quot;sharing economy&quot;.<br><br>The must-haves for previous generations aren't as important for Millennials. They're postponing major purchases &mdash; or avoiding them entirely.<br><br><em>&quot;25 years from now, car sharing will be the norm, and car ownership an anomaly.&quot; &mdash; Jeremy Rifkin, Author and Economist</em>",
"s4": "<strong>Love and marriage</strong><br><br>Millennials have been putting off significant milestones like getting married and having children. But that doesn't mean they want to stay single forever.<br><br>The average age of couples getting married in 1970 was 20. By 2010, it had risen to 30.",
"s5": "<strong>Clicking to buy</strong><br><br>Millennials' love for technology is changing the retail industry. With product information, reviews and price comparisons at their fingertips, they are able to compare prices in the store or shop online.<br><br>Millennials want maximum convenience at the lowest price. So when marketing to this generation, a strong brand isn't enough to lock in a sale.",
"s6": "<strong>Diet and fitness</strong><br><br>For Millennials, wellness is a daily, active pursuit. They're exercising more, eating smarter and smoking less than previous generations.<br><br>They're using apps to track training data, and online information to find the healthiest foods.<br><br>And this is one space in retail where they're willing to spend money on as 'healthy' doesn't just mean 'not sick'. It's a daily commitment to eating right and exercising.",
}

T3 = ("<strong>WHO ARE MILLENNIALS?</strong><br><br>"
      "&#8226; <strong>BORN BETWEEN 1980 &mdash; 2000</strong><br>"
      "&#8226; <strong>80 MILLION IN THE U.S.</strong><br>"
      "&#8226; <strong>2.5 BILLION WORLDWIDE</strong><br>"
      "&#8226; <strong>LARGEST GENERATION YET</strong><br>"
      "&#8226; <strong>MOST ETHNICALLY &amp; RACIALLY DIVERSE</strong>")

T4 = {
1: "You might think that young people have it easy. But in a special report, the editor of <em>The Economist</em>, Robert Guest, argues that millennials have it tougher than most people think.",
2: "'In some respects the young have never had it so good,' Guest writes. 'They are wealthier and are more likely to live longer than any other generation. They live in more liberal societies than their predecessors could barely have imagined, and have high speed access to information from around the world.'",
3: "'They are also brainier than any previous generation before them. Average scores on intelligence tests have been rising for decades in many countries, thanks to both better nutrition and mass education.'",
4: "However, the report says, the talent and intelligence of millennials is often wasted, with not enough employment opportunities. Youngsters are twice as likely as their elders to be unemployed, while over 25% of young people in middle-income nations &mdash; and 15% in richer ones &mdash; are NEETs (not in education, employment or training).",
5: "Furthermore, the cost of housing and education often prices millennials out of the market. 'Education has become so expensive that many students rack up heavy debts. Housing has grown costlier, too, especially in the globally connected megacities where the best jobs are. Young people yearn to move to such cities: besides higher pay, they offer excitement and a wide selection of other young people to date or marry. Yet constraints on the supply of housing make that hard.'",
6: "Guest also wrote that the time it takes to feel financially secure means people leave having children until later. 'For both sexes, the path to adulthood&mdash;from school to work, marriage and children&mdash;has become longer and more complicated. Mostly, this is a good thing. Many young people now study until their mid-20s and put off having children until their late 30s.",
7: "'They form families later partly because they want to and partly because it is taking them longer to become established in their careers. Alas, despite improvements in fertility treatment, the biological clock has not been reset to accommodate modern working lives.'",
8: "At the end of the fascinating report, Guest urged countries around the world to 'work harder to give the young a fair shot'.",
9: "'If they do not, that would not only be immoral; it would also be dangerous.'",
}

T5 = {
1: "Authors Neil Howe and William Strauss are widely credited with coining the term 'Millennial Generation', a reference to children graduating from secondary school in the year 2000. Since their landmark research on generational types, many authors have built on Howe and Strauss' work. This article will identify a number of general themes found in recent literature regarding the Millennial generation. Many of these themes, though originating from different sources and perspectives, are complementary, and even those in conflict with one another find they have common foundations.",
2: "This article will refer to Millennials as those born from approximately 1980 through 2000 (Howe &amp; Strauss, 2003; Sutherland &amp; Thompson, 2001). The most significant variation on this definition comes from Twenge, who includes all those born in the 1970s as well (Twenge, 2006).",
3: "By and large, the Millennials are considered the children of the Baby Boomers. They have grown up in a child-centred society, adored from infancy by their parents and other adults (Sutherland &amp; Thompson, 2001). They have lived in an era of relative peace, knowing little of worldwide conflict until the recent emergence of global terrorism. They have also lived in an era of relative prosperity, in which economic boom periods have been high, and downturns have been slight (Howe &amp; Strauss, 2003).",
4: "The most common and most significant theme found in literature about the Millennial Generation is that they have been told since birth that they are each unique and special, and that they embrace this specialness wholeheartedly.",
5: "Howe and Strauss emphasize the emergence of the pro-child culture among Baby Boomer adults as the catalyst for this characteristic, and Twenge supports this idea, to a degree. With the emergence of widespread use of birth control, and the growing availability of abortion through the 60s and 70s, Americans entered an era in which fewer and fewer 'unwanted' babies were born (Sutherland &amp; Thompson, 2001). Parents became parents because they wanted children, not because childbearing was foisted upon them. This era saw cultural adoption of the pro-child ethic in movies, books and the ubiquitous 'Baby On Board' car bumper stickers. Schools across the nation joined the bandwagon as well with the adoption of official self-esteem curricula (Twenge, 2006).",
6: "Where researchers and authors seem to disagree on Millennials is in the effect of their 'specialness'. Howe and Strauss believe that Millennials have translated their special status into an ability to contribute to society and its structures. They are community-minded citizens who believe in, and tend to follow, societal conventions because they believe in the rules that brought them through their happy childhoods.",
7: "Twenge, on the other hand, perceives less optimistic outcomes for the Millennials, which she calls 'Generation Me'. She expresses concern that the overt emphasis on individual 'specialness' has resulted in a generation for whom the individual is of ultimate importance. Twenge's research, in contrast to Howe and Strauss, has revealed a generation that is more individualistic and more self-oriented than any that have gone before. As a result, this generation is less likely to care about others' opinions, and more likely to flaunt society's conventions.",
8: "Twenge clashes again with Howe and Strauss when describing Millennials' belief in their ability to succeed. Though Howe and Strauss admit that the Millennials feel pressure to succeed, they contend that this confident, achieving generation believes that they will be both financially and socially successful. Howe and Strauss also cite achievements in high school academics and extra-curricular activities as evidence that these Millennials may indeed live up to their confident expectations.",
9: "Twenge, however, cites research that seems to indicate that Millennials are leaving their exuberant confidence behind as they leave childhood. The encouragement that so many young Millennials heard, that you can be or do anything, as long as you try hard enough and follow your dreams, has created unrealistically high expectations of themselves, producing high levels of depression, anxiety and loneliness among Millennials today.",
10: "Whether in school, work, or at home, Millennials must interact every day with members of the generations that preceded them. As they move through their teens and twenties, into adulthood, the nature of the Millennials' relationships with their elders is another theme found in recent literature.",
11: "Sutherland and Thompson describe how the changing structure of the nuclear family has, in many cases, led to a dynamic in which children are included in family discussions and decisions to a greater degree than previous generations. Howe and Strauss echo this sentiment. As this dynamic blends with the message of special importance that Millennial kids have heard all their lives, the result is often a young adult who views his or her relationship with older adults as a peer-to-peer relationship.",
12: "This emphasis on equality has implications in a variety of areas. Culturally, Millennials believe that their identity is just as valid as anyone else's. Consequently, enthusiastic self-expression has flourished, and Twenge cites the explosion of tattoos and piercings as an example of this trend. In the workplace, the idea of paying dues, and working up the corporate ladder is foreign. Millennials expect their views to be valued from the beginning, and advancement to be rapid (Raines, 2002). In education, Millennials are more than willing to challenge professors on everything from opinions to the very facts themselves, with no conception that the instructor's perspective is any more valid than their own (Twenge, 2006). Generally speaking, what Millennials seem to be seeking from other generations is acceptance as equals (Windham, 2005).",
13: "While more of a cultural reality than generational characteristic, technology has so affected and defined the Millennial generation that it regularly emerges as a theme in literature on the subject. While all generations alive today have experienced the development of technology, and adapted to the changes it has brought to society, the Millennials are the only ones who did not live through its emergence as adults.",
14: "Prensky (2001) describes the situation with the analogy that Millennials are natives in a society that is dominated by modern technology, whereas previous generations are 'digital immigrants'. There are significant implications for the differences in the ways that the natives and the immigrants think about the land they live in. What might have once been described as distractibility, is now considered multi-tasking: the practice of doing multiple things simultaneously. To describe Millennials as having short attention spans denies the evidence that they can spend extended time in sharply focused activity when playing high-tech video games (Prensky, 2001).",
15: "The clearest truism with regard to the Millennial generation is that they have been told throughout their childhood that they are each unique and special, and that as they become adults, it is clear that they have believed the message. For some, this belief will likely translate into ambitious goals, and great achievement. For others, it is likely that this belief will translate into unrealistic goals, and crushing disappointment. Millennials need to be encouraged to succeed and provided safety nets for failure as they learn to work through both of these experiences as adults.",
}

def P(d, keys):
    return "".join(para(k, d[k]) for k in keys)

slides = []

# ================= 1. COVER =================
cover = '''<div class="s1-card-wrapper">
    <div class="xdf-header-bar">
      <div class="xdf-logo-text">DSE READING <span>// 2017 真题</span></div>
      <div class="xdf-sub-text">Paper 1 · Reading</div>
    </div>
    <div style="padding:28px 32px">
      <div class="slide-h1" style="text-align:center;margin-bottom:6px">2017 HKDSE 英语 Paper 1</div>
      <div class="slide-h2" style="text-align:center;color:var(--fcc-purple-dark);margin-bottom:24px">Recycling · Millennials · Themes in the Literature</div>
      <div style="display:flex;justify-content:center;margin-bottom:24px">
        <div class="teacher-badge">
          <div class="tb-avatar">成</div>
          <div class="tb-name">成雨老师</div>
          <div class="tb-tag">TEACHER</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:20px">
        <div class="class-badge">真题精讲 · 2017 阅读卷 · 全 60 题</div>
      </div>
      <div class="s1-meta-grid">
        <div class="s1-meta-card"><div class="sm-label">Part A 必做</div><div class="sm-value">Q1–Q21</div><div class="sm-sub">The Myth of Recycling 回收神话</div></div>
        <div class="s1-meta-card"><div class="sm-label">Part B1 较易</div><div class="sm-value">Q22–Q44</div><div class="sm-sub">千禧一代信息图 + Better or Worse</div></div>
        <div class="s1-meta-card"><div class="sm-label">Part B2 困难</div><div class="sm-value">Q45–Q60</div><div class="sm-sub">Themes in the Literature 学术文献</div></div>
      </div>
      <div class="timeline-row">
        <div class="tl-seg c1"><div class="seg-ph">Part A</div><div class="seg-name">Text 1</div><div class="sm-sub">回收 + Q1–21</div></div>
        <div class="tl-seg c2"><div class="seg-ph">Part B1</div><div class="seg-name">Text 2–4</div><div class="sm-sub">千禧一代 + Q22–44</div></div>
        <div class="tl-seg c3"><div class="seg-ph">Part B2</div><div class="seg-name">Text 5</div><div class="sm-sub">文献主题 + Q45–60</div></div>
        <div class="tl-seg c4"><div class="seg-ph">收尾</div><div class="seg-name">Done</div><div class="sm-sub">数据榜 + 复盘</div></div>
      </div>
    </div>
    <div class="xdf-grid-pattern"><span>USE ARROW KEYS // SWIPE TO NAVIGATE</span></div>
  </div>'''
slides.append(slide("封面", "cover", "开场", cover))

# ================= 2. Part A Entry Test =================
a_entry_cards = [
    ("recyclable", "可回收物"),
    ("rinse", "冲洗"),
    ("compost (v.)", "堆肥"),
    ("landfill", "垃圾填埋场"),
    ("plummet", "暴跌"),
    ("stagnate", "停滞不前"),
    ("indoctrinate", "灌输"),
    ("emission", "排放"),
    ("incinerator", "焚烧炉"),
    ("methane", "甲烷"),
]
body = ('<div class="sec-label">Part A · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">核心词汇 Words — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 1 Recycling · 10 words · 每题 1 分</div>'
        + flip_grid(a_entry_cards))
slides.append(slide("Part A Entry Test", "entry-test", "Part A", body))

# ================= 3. Q1–Q5 · Text 1 ¶1–4 =================
left = '<h4>Text 1: The Myth of Recycling (¶1–4)</h4>' + P(T1, [1, 2, 3, 4])

q1 = mcq("q1", "Q1 · Tick · 1 mark", chip(80),
         "Which of the following recyclables is <strong>NOT mentioned</strong> in paragraph 1? "
         "Put a tick (&#10003;) in the box.",
         [("GLASS", "", False, "¶1 提到 separate paper from plastic and glass and metal。"),
          ("METAL", "", False, "¶1 提到 metal。"),
          ("E-WASTE", "", True, ""),
          ("ORGANIC", "", False, "¶1 的 food scraps（食物残渣）= organic（有机垃圾）。"),
          ("PAPER", "", False, "¶1 提到 paper。"),
          ("PLASTIC", "", False, "¶1 提到 plastic。")],
         "&#128273; &#182;1 &quot;food scraps&quot; 即有机垃圾（ORGANIC）—— 需要同义转换；E-WASTE 全段未提。")

q2 = sa("q2", "Q2 · Short answer · 1 mark", chip(86),
        "According to paragraph 1, what benefits are supposedly gained from recycling?",
        '<p><strong>helping the community and protecting the environment</strong></p>'
        '<p>&#182;1 "you probably assume that recycling is <em>helping your community and protecting the '
        'environment</em>" — 注意题干 supposedly（据称）暗示下文将质疑。</p>')

q3i = sa("q3i", "Q3(i) · Short answer · 1 mark", chip(87),
         "What was the writer's view on recycling in 1996?",
         '<p><strong>recycling is / was costly / ineffectual / wasteful</strong></p>'
         '<p>&#182;2 "I presented plenty of evidence that recycling was <em>costly and ineffectual</em>" + '
         '"the recycling process... was <em>wasteful</em>" — 任写一个即可。</p>')

q3ii = sa("q3ii", "Q3(ii) · Short answer · 1 mark", chip(22),
          "Why did his opponents disagree with him?",
          '<p><strong>it was unfair to rush to judgment &mdash; the modern recycling movement had only just '
          'begun / it would flourish as the industry matured / the public had not yet learned to recycle '
          'properly</strong>（任一理由）</p>'
          '<p>&#182;2 "its defenders said that it was unfair to rush to judgment. Noting that the modern recycling '
          'movement had really just begun a few years earlier, they predicted..." — 需要点出「运动刚起步、下结论为时过早」'
          '这一逻辑。仅 22% 正确：多数考生照抄整段。</p>')

q4 = tfng_slide("q4", "Q4 · T / F / NG · 4 marks",
                "According to paragraphs 2&ndash;4, are the following statements True (T), False (F) or Not Given (NG)?",
                [("(i)", "The writer is more optimistic about the recycling industry than he was in 1996.", "F",
                  "¶3 \"not much has changed at all\" + ¶4 \"still typically more expensive\" — 观点未变乐观。", 57),
                 ("(ii)", "Supporters of recycling are disappointed that the industry hasn't matured.", "NG",
                  "原文没提支持者失望与否。", 66),
                 ("(iii)", "Sending household waste to landfills is typically more costly than recycling it.", "F",
                  "¶4 原文是 recycle 比 landfill 更贵 — 与题目相反。", 68),
                 ("(iv)", "The business of some recycling companies has suffered.", "T",
                  "¶4 \"The slump has forced some recycling companies to shut plants...\"", 69)])

q5 = sa("q5", "Q5 · Short answer · 1 mark", chip(56),
        "According to paragraph 4, what is in less demand overseas?",
        '<p><strong>recyclable materials // recycled waste</strong></p>'
        '<p>&#182;4 "the prices for these materials have plummeted because of lower oil prices and '
        '<em>reduced demand for them overseas</em>" — them = recyclable materials。'
        '常见错误：照抄 lower oil prices 或 prices（问的是「什么」需求减少，不是原因）。</p>')

right = q1 + q2 + q3i + q3ii + q4 + q5
body = ('<div class="sec-label">Part A · Text 1 · Q1–Q5</div>'
        '<div class="slide-h3">The Myth of Recycling — 是环保还是浪费时间？</div>'
        + split("Text 1 (¶1–4)", left, right))
slides.append(slide("Q1–Q5 · Text 1 ¶1–4", "practice", "Part A", body, "text1"))

# ================= 4. Q6–Q10 · ¶4–8 =================
left = '<h4>Text 1: The Myth of Recycling (¶4–8)</h4>' + P(T1, [4, 5, 6, 7, 8])

q6 = mcq("q6", "Q6 · MC · 1 mark", chip(42),
         "Which definition of <strong>'crisis'</strong> is closest to the meaning used in line 22?",
         [("A", "a time when a difficult or important decision must be made", True, ""),
          ("B", "a sudden change in the course of a serious illness, for better or worse", False,
            "这是 crisis 的医学义项，非此处含义。"),
          ("C", "an emotionally stressful event or personal tragedy", False, "个人悲剧义项，不符。"),
          ("D", "the point, as in a play, at which conflict reaches its highest tension", False, "戏剧术语义项，不符。")],
         "&#128273; &#182;5 &quot;there's a crisis to confront... We need to ask ourselves: What is the goal here?&quot; — "
         "语境是要做决定（是否继续回收），选 A。一词多义看语境。")

q7 = sa("q7", "Q7 · Short answer · 2 marks", chip(14),
        "According to paragraph 6, why are people ill-informed about recycling?",
        '<p><strong>recycling has been promoted as a goal in and of itself / indoctrinated in students '
        '(from kindergarten through university); as a result, people have no idea of the relative costs and '
        'benefits</strong></p>'
        '<p>&#182;6 前后两半都是得分点：① 回收被当作目标本身灌输给学生 ② 因此人们对成本收益一无所知。'
        '仅 14% 正确：只答一半或照抄 ill-informed 不得分。</p>')

q8 = ('<div class="practice-mcq" id="q8-box"><div class="pmcq-label">Q8 · Summary cloze · 5 marks</div>'
      '<div class="pmcq-q">Complete the following summary using ideas given in paragraphs 7 and 8. '
      'Write <strong>ONE word</strong> for each blank. Answers must be grammatically correct.</div>'
      '<div class="card" style="padding:14px 18px;font-size:19px;line-height:2">'
      'Recycling does not always lead to a reduction in (i) ' + cloze("carbon emission(s)") + chip(57)
      + '. Although the E.P.A. encourages people to (ii) ' + cloze("recycle plastic(s)") + chip(57)
      + ', it does not necessarily make much of a (iii) ' + cloze("difference") + chip(48)
      + '. The matter becomes worse if people rinse their recyclables using (iv) '
      + cloze("hot / heated water") + chip(24) + ', and the electricity used to produce that heat comes from a (v) '
      + cloze("coal(-derived)") + chip(64) + '-burning power station.</div>'
      '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; (i) 考名词：'
      'carbon emissions 而非 carbon；(iv) 是最大坑（24%）：原文 rinse/recyclables/water 需合成 "hot/heated water"；'
      '(v) 前有不定冠词 a 且后接 -burning，须填 coal。词性 + 搭配双查。</span></div></div>')

q9 = mcq("q9", "Q9 · MC · 1 mark", chip(63),
         "The writer uses the example of flying to show that recycling…",
         [("A", "has some benefits.", False, "例子不是说回收有好处。"),
          ("B", "is not very effective.", True, ""),
          ("C", "is as bad for the environment as flying.", False, "夸张了，例子只讲抵消之难。"),
          ("D", "can be effective, depending on which class of airfare.", False, "舱位只是数字差异的细节。")],
         "&#128273; &#182;7 要抵消一趟往返航班的碳排需回收约 4 万个塑料瓶（经济舱）→ 说明回收塑料的环保作用其实很小 → B。")

q10 = mcq("q10", "Q10 · MC · 1 mark", chip(58),
          "According to paragraph 8, the statistics mentioned in paragraph 7 can be misleading because…",
          [("A", "some statistics have been overestimated.", False, "不是高估的问题。"),
           ("B", "people are not actually doing what is reported.", False, "与实际行为无关。"),
           ("C", "the statistics haven't taken into account other facts.", True, ""),
           ("D", "there is not enough evidence to draw any conclusions.", False, "不是证据不足。")],
          "&#128273; &#182;8 &quot;the E.P.A.'s life-cycle calculation doesn't take that water into account&quot; — "
          "统计漏算了冲洗用水这一因素 → C。")

right = q6 + q7 + q8 + q9 + q10
body = ('<div class="sec-label">Part A · Text 1 · Q6–Q10</div>'
        '<div class="slide-h3">Crunching the Numbers — 数字背后的真相</div>'
        + split("Text 1 (¶4–8)", left, right))
slides.append(slide("Q6–Q10 · ¶4–8", "practice", "Part A", body, "text1"))

# ================= 5. Q11–Q14 · ¶9–13 =================
left = '<h4>Text 1: The Myth of Recycling (¶9–13)</h4>' + P(T1, [9, 10, 11, 12, 13])

q11i = sa("q11i", "Q11(i) · Short answer · 2 marks", chip(9),
          "What does the writer think is the reason politicians support a &quot;zero waste&quot; policy (line 44)?",
          '<p><strong>politicians think / believe they are doing something good / saving the earth / '
          'recycling is a question of morality</strong></p>'
          '<p>&#182;9 "To many public officials, recycling is a question of <em>morality</em>, not '
          'cost-benefit analysis" + de Blasio "This is the way of the future if we\'re going to save our earth" — '
          '要点：政客把回收当道德问题/自认在拯救地球。仅 9% 正确：注意问的是 writer thinks 政客的想法，'
          '而非政客表面言论。</p>')

q11ii = mcq("q11ii", "Q11(ii) · MC · 1 mark", chip(57),
            "To achieve a &quot;zero waste&quot; policy, the levels of recycling would need to be…",
            [("A", "reduced to zero.", False, "零废弃要增加回收，不是减到零。"),
             ("B", "modestly reduced.", False, "方向反了。"),
             ("C", "slightly increased.", False, "幅度远不止 slight。"),
             ("D", "increased significantly.", True, "")],
            "&#128273; &#182;9 &quot;a 'zero waste' policy, which would require an unprecedented level of recycling&quot; — "
            "unprecedented（前所未有的）→ 大幅提升 → D。")

q12 = mcq("q12", "Q12 · MC · 1 mark", chip(52),
          "According to paragraph 10, who recycles more?",
          [("A", "the rich", True, ""),
           ("B", "the poor", False, "低收入地区居民热情不高。"),
           ("C", "people who live in cities", False, "与城市无关。"),
           ("D", "people who have more free time", False, "文中没说空闲多就回收多。")],
          "&#128273; &#182;10 &quot;it's popular in affluent neighborhoods&quot;（富裕社区）→ the rich → A。")

q13 = ('<div class="practice-mcq" id="q13-box"><div class="pmcq-label">Q13 · Table cloze · 4 marks</div>'
       '<div class="pmcq-q">Using the information given in paragraph 11, complete the table with the missing '
       'percentages.</div>'
       '<table class="quiz-table"><tr><th colspan="2">U.S. Recycling Rates &amp; Targets</th></tr>'
       '<tr><td><strong>(i)</strong> ' + chip(73) + ' Current rate of recycling in the U.S.</td><td>'
       + cloze("(around) 34%") + '</td></tr>'
       '<tr><td><strong>(ii)</strong> ' + chip(83) + ' Recycling target set by the E.P.A. (Winston Porter)</td><td>'
       + cloze("25%") + '</td></tr>'
       '<tr><td><strong>(iii)</strong> ' + chip(63) + ' Recycling target set by some state officials</td><td>'
       + cloze("(> / ≥) 50% (and higher)") + '</td></tr>'
       '<tr><td><strong>(iv)</strong> ' + chip(50) + ' Maximum percentage of trash useful to recycle (Porter\'s advice)</td><td>'
       + cloze("35%") + '</td></tr></table>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; &#182;11 四个数字'
       '的定位：rose during the 1990s to <em>25 percent</em>（E.P.A. 目标）· no more than <em>35 percent</em> '
       '（值得回收上限）· goals of <em>50 percent and higher</em>（州官员目标）· stuck around <em>34 percent</em>'
       '（当前实际值）。数字题最忌张冠李戴。</span></div></div>')

q14a = mcq("q14i", "Q14(i) · Tick · 1 mark", chip(75),
           "According to paragraph 12, is <strong>metal</strong> practical to recycle? Tick 'All', 'Some' or 'None'.",
           [("All", "", False, "¶12 说 selected metals — 只是部分。"),
            ("Some", "", True, ""),
            ("None", "", False, "¶12 说 selected metals and plastics 可行。")])
q14b = mcq("q14ii", "Q14(ii) · Tick · 1 mark", chip(84),
           "Is <strong>food waste</strong> practical to recycle? Tick 'All', 'Some' or 'None'.",
           [("All", "", False, "food waste 属于 don't make sense。"),
            ("Some", "", False, "原文归入不可行一类。"),
            ("None", "", True, "")])
q14c = mcq("q14iii", "Q14(iii) · Tick · 1 mark", chip(79),
           "Is <strong>cardboard</strong> practical to recycle? Tick 'All', 'Some' or 'None'.",
           [("All", "", True, ""),
            ("Some", "", False, "¶12 说 It's practical to recycle cardboard — 未加限定词。"),
            ("None", "", False, "与原文相反。")],
           "&#128273; &#182;12 &quot;It's practical to recycle <em>cardboard and some paper</em>, as well as "
           "<em>selected</em> metals and plastics&quot; — cardboard 无限定词 → All；paper/metal/plastics 有 some/selected → Some；"
           "food waste and other compostables → None。限定词决定答案。")

right = q11i + q11ii + q12 + q13 + q14a + q14b + q14c
body = ('<div class="sec-label">Part A · Text 1 · Q11–Q14</div>'
        '<div class="slide-h3">Morality vs Numbers — 道德口号与现实的落差</div>'
        + split("Text 1 (¶9–13)", left, right))
slides.append(slide("Q11–Q14 · ¶9–13", "practice", "Part A", body, "text1"))

# ================= 6. Q15–Q18 · ¶14–17 =================
left = '<h4>Text 1: The Myth of Recycling (¶14–17)</h4>' + P(T1, [14, 15, 16, 17])

q15 = ('<div class="practice-mcq" id="q15-box"><div class="pmcq-label">Q15 · Table cloze · 4 marks</div>'
       '<div class="pmcq-q">What are the two alternatives to recycling mentioned in paragraph 14? '
       'Give one advantage of using each.</div>'
       '<table class="quiz-table"><tr><th></th><th>Alternative</th><th>One advantage</th></tr>'
       '<tr><td><strong>1</strong></td><td>(i) ' + chip(47) + ' ' + cloze("modern / well lined landfills")
       + '</td><td>(ii) ' + chip(30) + ' ' + cloze("capture methane to generate electricity // relatively little environmental impact and can generate electricity")
       + '</td></tr>'
       '<tr><td><strong>2</strong></td><td>(iii) ' + chip(51) + ' ' + cloze("modern incinerators")
       + '</td><td>(iv) ' + chip(57) + ' ' + cloze("release few(er) pollutants // generating clean energy")
       + '</td></tr></table>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; &#182;14 两大替代方案'
       '来自对比结构：modern well-lined landfill（优点：收集甲烷发电/环境影响小）vs modern incinerator'
       '（优点：污染物排放极少/清洁能源）。填表题每格独立判分，别漏答优点。</span></div></div>')

q16 = sa("q16", "Q16 · Irony · 2 marks", chip(19),
         "What is ironic about the outcome described in paragraph 15? Use your own words to explain.",
         '<p><strong>While recycling is supposed to protect the environment / reduce pollution, '
         'recycling operations have their own environmental costs &mdash; extra trucks on the road / '
         'composting facilities have inspired complaints about nauseating odors, swarming rats and '
         'defecating seagulls</strong>（任一例）</p>'
         '<p>&#182;15 反讽点：本该保护环境的回收，自己却制造污染。答题公式：'
         '「本应……（supposed to）」+「实际却……（actually/in fact）」。用 own words 转述，照抄原文扣分。</p>')

q17 = sa("q17", "Q17 · Short answer · 2 marks", chip(31),
         "According to paragraph 16, why might some people be opposed to an increase in recycling?",
         '<p><strong>people / workers (in mining industries) may / will lose their jobs // recycling (may / will) '
         'affect / reduce (workers&#39;) jobs / income / job opportunities / cause / increase unemployment // '
         'recycling (may / will) lead to a reduction in the need to manufacture new products (less mining, '
         'drilling and logging)</strong></p>'
         '<p>&#182;16 "that\'s not so appealing to the workers in those industries" — 环保效益 = 减少采矿钻探伐木 '
         '→ 相关行业工人失业。因果链条要完整：回收增加 → 制造需求减少 → 工人丢饭碗。</p>')

q18 = sa("q18", "Q18 · Short answer · 1 mark", chip(41),
         "According to paragraph 17, what is worth recycling?",
         '<p><strong>paper, cardboard (and) aluminum (in soda cans)</strong></p>'
         '<p>&#182;17 "virtually all the greenhouse benefits &mdash; more than 90 percent &mdash; come from '
         'just a few materials: <em>paper, cardboard and aluminum in soda cans</em>" — 三样都要写全才稳。</p>')

right = q15 + q16 + q17 + q18
body = ('<div class="sec-label">Part A · Text 1 · Q15–Q18</div>'
        '<div class="slide-h3">Alternatives &amp; Irony — 换个角度看回收</div>'
        + split("Text 1 (¶14–17)", left, right))
slides.append(slide("Q15–Q18 · ¶14–17", "practice", "Part A", body, "text1"))

# ================= 7. Q19 · Quotes matching =================
left = ('<h4>Text 1: 人物与观点（¶5–12）</h4>'
        '<div class="passage-excerpt"><div class="para-num">&#182;5</div>' + T1[5] + '</div>\n'
        '<div class="passage-excerpt"><div class="para-num">&#182;8</div>' + T1[8] + '</div>\n'
        '<div class="passage-excerpt"><div class="para-num">&#182;9</div>' + T1[9] + '</div>\n'
        '<div class="passage-excerpt"><div class="para-num">&#182;11</div>' + T1[11] + '</div>\n'
        '<div class="passage-excerpt"><div class="para-num">&#182;12</div>' + T1[12] + '</div>\n')

q19 = ('<div class="practice-mcq" id="q19-box"><div class="pmcq-label">Q19 · Matching quotes · 4 marks</div>'
       '<div class="pmcq-q">Using information from paragraphs 5&ndash;12, match each person with one of the quotes '
       'below. Choose from A&ndash;F. <strong>Two of the quotes will NOT be used.</strong></div>'
       '<div class="word-pool" id="q19-pool" style="margin-bottom:10px">'
       '<div class="draggable" draggable="true" data-word="q19-a" data-cat="a">A. "There is a limit to effective recycling."</div>'
       '<div class="draggable" draggable="true" data-word="q19-b" data-cat="b">B. "Cities need to recycle all waste to safeguard the planet\'s future."</div>'
       '<div class="draggable" draggable="true" data-word="q19-c" data-cat="c">C. "Recycling has a negative impact on the economy."</div>'
       '<div class="draggable" draggable="true" data-word="q19-d" data-cat="d">D. "Recycling can cause more pollution."</div>'
       '<div class="draggable" draggable="true" data-word="q19-e" data-cat="e">E. "The recycling movement needs more subsidies."</div>'
       '<div class="draggable" draggable="true" data-word="q19-f" data-cat="f">F. "It\'s more difficult to make money from recycling than people might think."</div></div>'
       '<div class="tb-wrap"><table class="match-grid"><tr><th>Person</th><th style="width:150px">Quote (A–F)</th></tr>'
       '<tr><td><strong>David Steiner</strong> (CEO, Waste Management) ' + chip(34) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="f"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Chris Goodall</strong> (author) ' + chip(62) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="d"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Bill de Blasio</strong> (NYC Mayor) ' + chip(66) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="b"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Winston Porter</strong> (E.P.A. official) ' + chip(53) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="a"><div class="drop-content"></div></div></td></tr>'
       '</table></div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkMatch(\'q19\',4)">Check</button>'
       '<button class="reveal-btn" onclick="resetMatch(\'q19\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q19-ans\')" style="background:var(--fcc-blue-dark)">Show Answers</button></div>'
       '<div class="ans-reveal" id="q19-result"></div>'
       '<div class="ans-reveal" id="q19-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>Steiner &rarr; F</strong> — &#182;5 "Trying to turn garbage into gold costs a lot more than expected"'
       '（赚钱比想象难） · <strong>Goodall &rarr; D</strong> — &#182;8 用燃煤热水洗塑料可能排出更多碳'
       '（回收反而更污染） · <strong>de Blasio &rarr; B</strong> — &#182;9 "zero waste... if we\'re going to save '
       'our earth"（回收所有垃圾救地球） · <strong>Porter &rarr; A</strong> — &#182;11 "no more than 35 percent '
       'was worth recycling"（有效回收有上限） · <strong>C、E 未使用</strong> — C 干扰项（原文说贵，'
       '没说拖累整体经济）；E 全文未提补贴。</p></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; 观点匹配题抓语言印记：'
       '数字与生意 → Steiner；carbon in the atmosphere → Goodall；save our earth / zero waste → de Blasio；'
       '百分比上限 → Porter。先划出各人物的核心名词再匹配。</span></div></div>')

right = q19
body = ('<div class="sec-label">Part A · Text 1 · Q19</div>'
        '<div class="slide-h3">Who Said What? — 人物观点匹配</div>'
        + split("Text 1 关键段落", left, right))
slides.append(slide("Q19 · Quote Matching", "practice", "Part A", body, "text1"))

# ================= 8. Q20–Q21 · Open question + title =================
left = ('<h4>Text 1: The Myth of Recycling（全文脉络）</h4>'
        + P(T1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]))

q20 = sa("q20", "Q20 · Open response · 3 marks", chip(19),
         "Do you think recycling is a waste of time? Provide evidence from the text to support your answer.",
         '<p><strong>任一立场均可得分</strong>（No / Yes / It depends），关键 = 立场 + 文中证据：</p>'
         '<p><strong>&#10003; No, because…</strong> &mdash; it\'s practical to recycle cardboard, some paper, '
         'selected metals and plastics (¶12) · more than 90% of greenhouse benefits come from these few '
         'materials (¶17) · it reduces the need to manufacture new products (¶16) · reduced emissions of '
         'greenhouse gases (¶16) · we have a moral obligation to reduce rubbish (¶9)</p>'
         '<p><strong>// Yes, because…</strong> &mdash; it\'s typically more expensive than landfill (¶4) · '
         'trying to turn garbage into gold costs a lot more than expected (¶5) · one flight = 40,000 bottles '
         '(¶7) · the zero-waste goal is very expensive with almost no real environmental benefit (¶12) · '
         'recycling operations have their own environmental costs (¶15)</p>'
         '<p><strong>// It depends…</strong> — 各取 Yes/No 一条证据。</p>'
         '<p>&#128273; 开放题评分三要素：明确立场 + 原文证据（可引用行号）+ 简要解释。'
         '证据与立场不匹配是最常见失分原因。</p>')

q21 = mcq("q21", "Q21 · MC · 1 mark", chip(36),
          "Choose the best alternative title for this article.",
          [("A", "In defence of recycling", False, "文章是质疑回收，不是辩护。"),
           ("B", "The pros and cons of recycling", False, "文章几乎一面倒地质疑，不是平衡的利弊文。"),
           ("C", "Recycling is more rubbish than you think", True, ""),
           ("D", "Why cities are recycling less of their rubbish", False, "文章重点不是城市回收量下降。")],
          "&#128273; 标题题抓全文基调：作者反复论证回收效果被高估（rubbish 双关 = 垃圾/废话）→ C。"
          "B 陷阱最大（36% 正确率）：pros and cons 要求正反并重，本文以质疑为主。")

right = q20 + q21
body = ('<div class="sec-label">Part A · Text 1 · Q20–Q21</div>'
        '<div class="slide-h3">Your Verdict + Best Title — 观点表达与标题题</div>'
        + split("Text 1 (full text)", left, right))
slides.append(slide("Q20–Q21 · Title", "practice", "Part A", body, "text1"))

# ================= 9. Part A Close Reading =================
cr = ('<div class="sec-label">Part A · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;1: As you sort everything into the right bins, you ' + sig("probably assume", "大概以为（作者即将质疑）")
      + ' that recycling is helping your community... ' + sig("But is it?", "但果真如此吗？（转折设问）") + '</p>'
      '<p style="margin-top:14px">&#182;2: its defenders said that it was unfair to '
      + sig("rush to judgment", "仓促下结论") + '.</p>'
      '<p style="margin-top:14px">&#182;3: ' + sig("when it comes to the bottom line", "说到实际成效") +
      ', both economically and environmentally, not much has changed at all.</p>'
      '<p style="margin-top:14px">&#182;4: the prices for these materials have '
      + sig("plummeted", "暴跌") + '. The ' + sig("slump", "萧条；暴跌") + ' has forced some recycling companies to '
      + sig("shut plants", "关闭工厂") + '.</p>'
      '<p style="margin-top:14px">&#182;6: Recycling has been '
      + sig("relentlessly promoted", "被不遗余力地宣扬") + ' as a goal '
      + sig("in and of itself", "其本身（而非手段）") + '... ' + sig("indoctrinated", "被灌输") + ' in students.</p>'
      '<p style="margin-top:14px">&#182;8: ' + sig("Even those statistics might be misleading", "连这些数字也可能误导")
      + '... doesn\'t ' + sig("take that water into account", "把那部分用水算进去") + '.</p>'
      '<p style="margin-top:14px">&#182;10: But while politicians set higher goals, the national rate of '
      'recycling has ' + sig("stagnated", "停滞不前") + '.</p>'
      '<p style="margin-top:14px">&#182;12: The zero-waste goal '
      + sig("makes no sense at all", "完全没有道理") + '.</p>'
      '<p style="margin-top:14px">&#182;17: ' + sig("Once you exclude these materials", "一旦排除这些材料")
      + ', the total annual savings... is only ' + sig("two-tenths of 1 percent", "千分之二") + '.</p></div>')
slides.append(slide("Part A · Close Reading", "close-reading", "Part A", cr))

# ================= 10. Part A Exit Test =================
a_exit_cards = [
    ("carry out (a process)", "执行；进行"),
    ("rush to judgment", "仓促下结论"),
    ("when it comes to...", "说到；涉及……"),
    ("in and of itself", "其本身"),
    ("take ... into account", "把……考虑在内"),
    ("translate ... into ...", "把……转化为……"),
    ("make no sense", "毫无道理"),
    ("be stuck around (34%)", "卡在（34%）左右"),
    ("give rise to", "引起；催生"),
    ("to date or marry", "约会或结婚"),
]
body = ('<div class="sec-label">Part A · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">动词短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 1 Recycling · 10 items · 每题 1 分</div>'
        + flip_grid(a_exit_cards))
slides.append(slide("Part A Exit Test", "exit-test", "Part A", body))

# ================= 11. Part A Recap =================
recap = ('<div class="sec-label">Part A · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part A 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 1 = <strong>观点评论文章（opinion essay）</strong>：作者用 1996 年旧文引入 → 现状检验 → '
         '逐层拆解回收的经济与环保神话。信号词（But is it? / not much has changed）是追踪作者立场的路标。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>一词多义看语境（Q6 crisis）；指代题问「为什么」要答原因链（Q17）；反讽题用「本应…实际却…」'
         '公式（Q16）；开放题立场+证据缺一不可（Q20）；标题题抓全文基调而非局部（Q21）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128202; 2017 隐形数据 — 击碎砖块看 Part A 最难题</h4>'
         '<p>Q11(i) 政客动机 ' + chip(9) + ' · Q7 为何一无所知 ' + chip(14) + ' · '
         'Q16 反讽 ' + chip(19) + ' · Q20 开放题 ' + chip(19) + ' · '
         'Q3(ii) 反方理由 ' + chip(22) + ' — 全是「理解+转述」双要求的题。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128273; 金句</h4>'
         '<p>照抄原文 ≠ 得分：简答题先问自己「这格考的是原因、结果还是例子？」</p></div>')
slides.append(slide("Part A · Recap", "exit-test", "Part A", recap))
