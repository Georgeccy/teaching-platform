#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate index.html for 2017 DSE Paper 1 Reading courseware (v1).
Part 2: Part B1 (Q22-44, Texts 2-4) + Part B2 (Q45-60, Text 5) + data/perf/done + shell.
Run: python3 gen_2017.py  (imports helpers & Part A slides from gen_part1.py)
"""
from gen_part1 import (chip, mcq, sa, tfng_slide, cloze, para, flip_grid, sig,
                       slide, split, P, T2, T3, T4, T5, slides, _subtag)

# ================= 12. Part B1 divider =================
div_b1 = ('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">'
          '<div class="class-badge" style="font-size:20px;padding:14px 36px;margin-bottom:24px">Part B1</div>'
          '<div class="slide-h1" style="text-align:center">Easier Section</div>'
          '<div class="slide-h3" style="text-align:center;color:var(--text-2);margin-top:12px">Text 2&ndash;4 · Q22&ndash;Q44 · 43 marks</div>'
          '<p style="text-align:center;font-size:20px;margin-top:20px;color:var(--text-2);max-width:620px">'
          'Millennials 信息图（6 slides）+ 数据卡 + 《经济学人》特写 — 阅读重点：信息定位 · 图文互证 · '
          '短语真实含义（snug in the nest / prices out of the market）。</p></div>')
slides.append(slide("Part B1", "divider", "Part B1", div_b1))

# ================= 13. B1 Entry Test =================
b1_entry_cards = [
    ("millennial", "千禧一代（1980–2000 出生）"),
    ("coming of age", "成年；进入黄金期"),
    ("snug", "温暖舒适的"),
    ("milestone", "里程碑；人生大事"),
    ("sharing economy", "共享经济"),
    ("NEET", "尼特族（不升学不就业不受训）"),
    ("rack up (debts)", "累积（债务）"),
    ("yearn to", "渴望"),
    ("megacity", "特大城市"),
    ("biological clock", "生物钟（生育时限）"),
]
body = ('<div class="sec-label">Part B1 · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">核心词汇 Words — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 2–4 Millennials · 10 words · 每题 1 分</div>'
        + flip_grid(b1_entry_cards))
slides.append(slide("Part B1 Entry Test", "entry-test", "Part B1", body))

# ================= 14. Q22–Q26 · Text 2 slides 1–3 + Text 3 =================
def slide_ex(n, text):
    return ('<div class="passage-excerpt"><div class="para-num">' + n + '</div>' + text + '</div>\n')

left = ('<h4>Text 2: Millennials 信息图（Slide 1–3）+ Text 3 数据卡</h4>'
        + slide_ex("S1", T2["s1"]) + slide_ex("S2", T2["s2"]) + slide_ex("S3", T2["s3"])
        + '<div class="passage-excerpt"><div class="para-num">T3</div>' + T3 + '</div>\n')

q22 = sa("q22", "Q22 · Find a phrase · 1 mark", chip(36),
         "Find a phrase on slide 1 that shows Millennials are <strong>entering adulthood</strong>.",
         '<p><strong>coming of age // (about to) move into their / millennials&#39; prime (spending years)</strong></p>'
         '<p>S1 标题 <em>&quot;MILLENNIALS &mdash; Coming of age&quot;</em> 即「成年」；body 里 about to move into their '
         'prime spending years（即将进入消费黄金期）也可。35% 的考生找不到：短语要在 slide 上原样抄，别改写。</p>')

q23 = sa("q23", "Q23 · Short answer · 1 mark", chip(57),
         "What do companies hope to achieve by understanding Millennials' attitudes and lifestyle?",
         '<p><strong>to sell more to (the) millennials // to improve company sales // to help / make a (big) '
         'difference to their business</strong></p>'
         '<p>S1 &quot;their shopping habits will make a big difference to their business&quot; — 公司想理解千禧一代，'
         '最终目的是业绩。答 understand attitudes 不得分（那是手段不是目的）。</p>')

q24 = mcq("q24", "Q24 · MC · 1 mark", chip(30),
          "<strong>'Snug in the nest'</strong> (slide 2) means Millennials are…",
          [("A", "unable to buy a home.", False, "snug 没有买不起的意思。"),
           ("B", "happily living with parents.", True, ""),
           ("C", "unable to take care of themselves.", False, "无此意。"),
           ("D", "waiting to enter the housing market.", False, "那是 reluctant to enter the housing market。")],
          "&#128273; S2 &quot;Snug in the nest, a growing number of Millennials are choosing to live at home with "
          "their parents&quot; — snug（舒适的）+ nest（巢=家）→ 乐于与父母同住 → B。字面直译是最大陷阱（仅 30% 对）。")

q25 = sa("q25", "Q25 · Short answer · 1 mark", chip(44),
         "According to slide 2, why might Millennials change their attitude towards home ownership?",
         '<p><strong>(as they get older, millennials / they will have a) desire to settle down</strong></p>'
         '<p>S2 &quot;As they get older, they will likely have a <em>desire to settle down</em>, and this could lead '
         'to a surge in home sales&quot; — 关键短语 settle down（安定下来）。答 a surge in home sales 不得分：'
         '那是结果不是原因。</p>')

q26i = sa("q26i", "Q26(i) · Short answer · 1 mark", chip(17),
          "According to slide 3, why do Millennials prefer a sharing economy?",
          '<p><strong>(because it / a sharing economy) provides (access to) products without the burden of '
          'ownership // they want access to products without the burden of ownership</strong></p>'
          '<p>S3 &quot;services that provide access to products <em>without the burdens of ownership</em>, giving '
          'rise to what\'s being called a &#39;sharing economy&#39;&quot; — 仅 17% 对：多数考生漏掉 without the '
          'burden of ownership 这个核心对比（要使用权，不要所有权负担）。</p>')

q26ii = sa("q26ii", "Q26(ii) · Short answer · 1 mark", chip(46),
           "What product is used by the writer to show their future purchasing habits?",
           '<p><strong>(a / the) car(s) // car sharing</strong></p>'
           '<p>S3 引用 Jeremy Rifkin：&quot;25 years from now, <em>car sharing</em> will be the norm, and car '
           'ownership an anomaly&quot; — 用汽车举例说明未来消费习惯。别答 music / luxury goods（那是 reluctant '
           'to buy 的例子）。</p>')

right = q22 + q23 + q24 + q25 + q26i + q26ii
body = ('<div class="sec-label">Part B1 · Text 2 · Q22–Q26</div>'
        '<div class="slide-h3">Coming of Age — 从信息图找短语</div>'
        + split("Text 2 (Slide 1–3) + Text 3", left, right))
slides.append(slide("Q22–Q26 · Text 2 S1–3", "practice", "Part B1", body, "text2"))

# ================= 15. Q27–Q31 · Text 2 slides 4–6 =================
left = ('<h4>Text 2: Millennials 信息图（Slide 4–6）</h4>'
        + slide_ex("S4", T2["s4"]) + slide_ex("S5", T2["s5"]) + slide_ex("S6", T2["s6"]))

q27 = mcq("q27", "Q27 · MC · 1 mark", chip(60),
          "What does <strong>'milestones'</strong> on slide 4 mean in this context?",
          [("A", "purchases that bring happiness", False, "与消费无关。"),
           ("B", "records of the past", False, "不是历史记录。"),
           ("C", "major life events", True, ""),
           ("D", "fun activities", False, "不是娱乐活动。")],
          "&#128273; S4 &quot;putting off significant milestones like getting married and having children&quot; — "
          "举例已给出答案：结婚、生子 = 人生大事 → C。")

q28 = tfng_slide("q28", "Q28 · T / F / NG · 3 marks",
                 "According to slides 1&ndash;4, are the following statements True (T), False (F) or Not Given (NG)?",
                 [("(i)", "There are more Millennials than members of any other generation.", "T",
                   "S1 \"Millennials are the largest generation in history\" + T3 \"LARGEST "
                   "GENERATION YET\"。", 46),
                  ("(ii)", "Millennials tend to buy a lot of expensive goods.", "F",
                   "S3 说他们 reluctant to buy cars / luxury goods — 与题目相反。", 38),
                  ("(iii)", "Millennials are getting married later in life.", "T",
                   "S4 平均结婚年龄从 1970 年的 20 岁升到 2010 年的 30 岁。", 62)])

q29i = sa("q29i", "Q29(i) · Short answer · 1 mark", chip(61),
          "According to slide 5, how is technology changing the way Millennials shop?",
          '<p><strong>compare prices in the store / shop online // get / access product information / reviews / '
          'prices in the store / online</strong></p>'
          '<p>S5 &quot;With product information, reviews and price comparisons at their fingertips, they are able '
          'to <em>compare prices in the store or shop online</em>&quot; — 答具体行为（比价/网购），'
          '答 love for technology 不得分。</p>')

q29ii = mcq("q29ii", "Q29(ii) · MC · 1 mark", chip(48),
            "Which of the following tends to be the <strong>least</strong> important for Millennials when buying things?",
            [("A", "convenience", False, "S5 说他们要 maximum convenience。"),
             ("B", "reviews", False, "信息就在指尖，评价重要。"),
             ("C", "brand", True, ""),
             ("D", "price", False, "他们要 lowest price。")],
            "&#128273; S5 &quot;a strong brand isn&#39;t enough to lock in a sale&quot; — 品牌（brand）最不重要 → C。"
            "锁定证据句即可，无需推理。")

q30 = ('<div class="practice-mcq" id="q30-box"><div class="pmcq-label">Q30 · Summary cloze · 5 marks</div>'
       '<div class="pmcq-q">Based on the information given on slide 6, fill in the blanks. '
       'Write <strong>ONE word</strong> in each blank.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'Millennials are (i) ' + cloze("healthier / fitter") + chip(14)
       + ' than other generations. They do more (ii) ' + cloze("exercise(s)") + chip(70)
       + ', don&#39;t (iii) ' + cloze("smoke") + chip(65)
       + ' as much, and monitor their fitness with the help of (iv) ' + cloze("app(lications) // technology // data // internet // information") + chip(38)
       + '. This generation defines good health as more than simply not being (v) '
       + cloze("sick // ill // unhealthy") + chip(54) + '.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; (i) 是最大坑'
       '（14%）：S6 原文是 They&#39;re exercising more, eating smarter and smoking less than previous '
       'generations — 没有现成形容词，需由比较语境合成 healthier/fitter。(iv) 原文 apps to track training data，'
       '单数填 app 亦可。摘要填空 = 定位 + 合成，不是纯照抄。</span></div></div>')

q31 = ('<div class="practice-mcq" id="q31-box"><div class="pmcq-label">Q31 · Heading matching · 5 marks</div>'
       '<div class="pmcq-q">Match the following headings to each slide of Text 2. Choose from A&ndash;F. '
       '<strong>One heading is NOT used.</strong></div>'
       '<div class="word-pool" id="q31-pool" style="margin-bottom:10px">'
       '<div class="draggable" draggable="true" data-word="q31-a" data-cat="a">A. Clicking to buy</div>'
       '<div class="draggable" draggable="true" data-word="q31-b" data-cat="b">B. Love and marriage</div>'
       '<div class="draggable" draggable="true" data-word="q31-c" data-cat="c">C. Education</div>'
       '<div class="draggable" draggable="true" data-word="q31-d" data-cat="d">D. Diet and fitness</div>'
       '<div class="draggable" draggable="true" data-word="q31-e" data-cat="e">E. Access, not ownership</div>'
       '<div class="draggable" draggable="true" data-word="q31-f" data-cat="f">F. Housing</div></div>'
       '<div class="tb-wrap"><table class="match-grid"><tr><th>Slide</th><th style="width:190px">Heading (A–F)</th></tr>'
       '<tr><td><strong>Slide 1</strong> — Coming of age（已给）</td>'
       '<td style="color:var(--text-3)">given</td></tr>'
       '<tr><td><strong>Slide 2</strong> — Snug in the nest ' + chip(83) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="f"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Slide 3</strong> — sharing economy ' + chip(82) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="e"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Slide 4</strong> — average marrying age 20→30 ' + chip(72) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="b"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Slide 5</strong> — technology &amp; retail ' + chip(68) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="a"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>Slide 6</strong> — wellness as daily pursuit ' + chip(83) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="d"><div class="drop-content"></div></div></td></tr>'
       '</table></div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkMatch(\'q31\',5)">Check</button>'
       '<button class="reveal-btn" onclick="resetMatch(\'q31\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q31-ans\')" style="background:var(--fcc-blue-dark)">Show Answers</button></div>'
       '<div class="ans-reveal" id="q31-result"></div>'
       '<div class="ans-reveal" id="q31-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>S2 &rarr; F Housing</strong>（住父母家/购房意愿） · <strong>S3 &rarr; E Access, not '
       'ownership</strong>（共享经济） · <strong>S4 &rarr; B Love and marriage</strong>（结婚年龄） · '
       '<strong>S5 &rarr; A Clicking to buy</strong>（科技改变零售） · <strong>S6 &rarr; D Diet and '
       'fitness</strong>（健康追求） · <strong>C. Education 未使用</strong>（全文没有讲教育的 slide）。</p></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; 小标题匹配抓'
       '「主题词锚点」：nest/housing market → Housing；sharing economy + ownership → Access；marrying age → '
       'Love and marriage；retail/online → Clicking to buy；wellness/exercising → Diet and fitness。'
       '未用项（Education）往往全文无对应内容，先用排除法。</span></div></div>')

right = q27 + q28 + q29i + q29ii + q30 + q31
body = ('<div class="sec-label">Part B1 · Text 2 · Q27–Q31</div>'
        '<div class="slide-h3">Love, Shopping &amp; Wellness — 信息图后三屏</div>'
        + split("Text 2 (Slide 4–6)", left, right))
slides.append(slide("Q27–Q31 · Text 2 S4–6", "practice", "Part B1", body, "text2"))

# ================= 16. Q32–Q35 · Text 3 + Text 4 ¶1–3 =================
left = ('<h4>Text 4: Do Millennials Have It Better or Worse?（¶1–3）</h4>' + P(T4, [1, 2, 3])
        + '<div class="passage-excerpt"><div class="para-num">T3</div>' + T3 + '</div>\n')

q32 = sa("q32", "Q32 · Short answer · 1 mark", chip(34),
         "In what period were Millennials born?",
         '<p><strong>between 1980 and 2000 // 1980–2000 // 1980 to 2000</strong></p>'
         '<p>定位 Text 3 数据卡 &quot;BORN BETWEEN 1980 &mdash; 2000&quot; — 信息图旁的数据卡也是出题点，'
         '别只读正文。三成考生没看数据卡。</p>')

q33 = ('<div class="practice-mcq" id="q33-box"><div class="pmcq-label">Q33 · Matching · 3 marks</div>'
       '<div class="pmcq-q">How do young people have it better than the previous generations? Match the ideas in '
       'paragraph 2 with the examples on the right. Click each blank to check.</div>'
       '<div class="tb-wrap"><table class="quiz-table"><tr><th>Idea in ¶2</th><th>Example</th></tr>'
       '<tr><td><em>(e.g.) They are wealthier.</em></td><td>Millennials have more money to spend.</td></tr>'
       '<tr><td><strong>(i)</strong> ' + chip(54) + ' ' + cloze("(high speed) access to information (from around the world)")
       + '</td><td>Millennials are connected to the world via their smartphones.</td></tr>'
       '<tr><td><strong>(ii)</strong> ' + chip(52) + ' ' + cloze("live in more liberal / free / tolerant societies (than their predecessors could barely have imagined)")
       + '</td><td>If a Millennial is female or gay, he/she has more rights.</td></tr>'
       '<tr><td><strong>(iii)</strong> ' + chip(55) + ' ' + cloze("(more likely to) live longer (than any other generation)")
       + '</td><td>The average lifespan of Millennials could reach 90&ndash;95 years.</td></tr>'
       '</table></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; ¶2 原句：'
       'wealthier · more likely to live longer · more liberal societies · high speed access to information — '
       '例子与观点要一一对应：智能手机→信息获取；女性/同性恋权利→自由社会；寿命 90-95→更长寿。'
       '答 wealthier 对 (i) 不得分（已作为例子给出）。</span></div></div>')

q34 = sa("q34", "Q34 · Short answer · 1 mark", chip(44),
         "What factors have led to Millennials being more intelligent than previous generations?",
         '<p><strong>(better) nutrition and (mass) education</strong></p>'
         '<p>&#182;3 &quot;thanks to both better <em>nutrition</em> and mass <em>education</em>&quot; — 两个因素都要写。'
         '常见错误：答 intelligence test scores have been rising（那是结果不是原因）。</p>')

q35 = sa("q35", "Q35 · Short answer · 3 marks", "",
         "According to paragraphs 4&ndash;5, what are the <strong>three</strong> key challenges Millennials face?",
         '<p><strong>i)</strong> (not enough) employment opportunities // unemployment // difficulty finding a job <span style="color:var(--text-3)">'
         + chip(57) + '</span></p>'
         '<p><strong>ii)</strong> the cost of housing <span style="color:var(--text-3)">' + chip(55) + '</span></p>'
         '<p><strong>iii)</strong> the cost of education // education has become (so) expensive (that many students rack up heavy debts) '
         '<span style="color:var(--text-3)">' + chip(29) + '</span></p>'
         '<p>&#182;4 &quot;not enough employment opportunities&quot; · &#182;5 &quot;the cost of housing and '
         'education often prices millennials out of the market&quot; + &quot;many students rack up heavy '
         'debts&quot; — (iii) 最难（29%）：要自己归纳出 education cost，别照抄整句。</p>')

right = q32 + q33 + q34 + q35
body = ('<div class="sec-label">Part B1 · Text 3–4 · Q32–Q35</div>'
        '<div class="slide-h3">Better or Worse? — 数据卡与观点匹配</div>'
        + split("Text 3 + Text 4 (¶1–3)", left, right))
slides.append(slide("Q32–Q35 · Text 4 ¶1–3", "practice", "Part B1", body, "text4"))

# ================= 17. Q36–Q40 · ¶4–5 =================
left = '<h4>Text 4: Do Millennials Have It Better or Worse?（¶4–5）</h4>' + P(T4, [4, 5])

q36 = ('<div class="practice-mcq" id="q36-box"><div class="pmcq-label">Q36 · Cloze · 2 marks</div>'
       '<div class="pmcq-q">Fill in the blanks based on information given in paragraph 4. Click each blank to check.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'The young have a (i) ' + cloze("low(er) // less(er) // small(er) // (more) difficult // harder // worse // 50%") + chip(20)
       + ' chance of being employed compared to their elders. More than a quarter of those from (ii) '
       + cloze("middle-income") + chip(35) + ' countries are NEETs.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; (i) 原文是 '
       'twice as likely to be unemployed — 需反向转述为 low(er)/worse chance，照抄 twice 不得分（20% 对）。'
       '(ii) 25% 对应 middle-income nations，15% 才是 richer ones，数字张冠李戴最常见。</span></div></div>')

q37 = mcq("q37", "Q37 · MC · 1 mark", chip(56),
          "What does <strong>'prices millennials out of the market'</strong> (lines 29&ndash;30) mean?",
          [("A", "Millennials' jobs do not pay enough.", False, "是价格高，不是工资低。"),
           ("B", "It is too expensive for Millennials to afford.", True, ""),
           ("C", "There is too much competition for Millennials.", False, "与竞争无关。"),
           ("D", "Millennials are one of the factors affecting market price.", False, "把 price 当动词的意思弄反了。")],
          "&#128273; price sb out of the market = 价格太高把某人挤出市场（price 是动词）。"
          "&#182;5 语境：住房和学费太贵 → 千禧一代负担不起 → B。")

q38 = sa("q38", "Q38 · Tick · 1 mark", chip(13),
         "According to paragraph 5, what are some of the advantages that megacities offer young people? "
         "Tick (&#10003;) three boxes.",
         '<p><strong>&#9745; better employment opportunities</strong>（where the best jobs are）</p>'
         '<p><strong>&#9745; more chances of falling in love</strong>（a wide selection of other young people to '
         'date or marry）</p>'
         '<p><strong>&#9745; more fun things to do</strong>（they offer excitement）</p>'
         '<p>&#9744; more schools to choose from（未提） · &#9744; better apartments（未提，反而住不起）</p>'
         '<p>&#128273; 仅 13% 全对：excitement 要转述为 more fun things to do，higher pay 容易误选 '
         'better apartments。勾选题每个选项都要回原文验证。</p>')

q39 = sa("q39", "Q39 · Reference · 1 mark", chip(5),
         "What does <strong>'that'</strong> (line 39) refer to?",
         '<p><strong>(young people) moving to / living in (mega / global / better / international) cities</strong></p>'
         '<p>&#182;5 &quot;Young people yearn to move to such cities... Yet constraints on the supply of housing '
         'make <em>that</em> hard&quot; — that 指前面的整个打算（搬去大城市这件事），不是某个名词。'
         '全卷第二难（5%）：抽象指代要看上一句的动词短语，别只找最近的名词。</p>')

q40 = sa("q40", "Q40 · Short answer · 3 marks", "",
         "According to paragraphs 6 and 7, why are young people having children later in life? "
         "Give <strong>three</strong> reasons.",
         '<p><strong>i)</strong> to be / feel (more) financially secure <span style="color:var(--text-3)">'
         + chip(30) + '</span></p>'
         '<p><strong>ii)</strong> spending more time in school / study until their mid-20s '
         '<span style="color:var(--text-3)">' + chip(29) + '</span></p>'
         '<p><strong>iii)</strong> taking longer to become established in their careers '
         '<span style="color:var(--text-3)">' + chip(21) + '</span></p>'
         '<p>// also accepted: they want to form families later · fertility treatment allows later childbirth</p>'
         '<p>&#128273; &#182;6 &quot;the time it takes to feel financially secure&quot; · &quot;study until their '
         'mid-20s&quot; · &#182;7 &quot;taking them longer to become established in their careers&quot; — '
         '三个理由藏在两段里，漏答 (iii) 最多（21%）。注意排除干扰项：生物钟未重设是「后果」不是「原因」。</p>')

right = q36 + q37 + q38 + q39 + q40
body = ('<div class="sec-label">Part B1 · Text 4 · Q36–Q40</div>'
        '<div class="slide-h3">Priced Out — 大城市、就业与生育推迟</div>'
        + split("Text 4 (¶4–5)", left, right))
slides.append(slide("Q36–Q40 · Text 4 ¶4–5", "practice", "Part B1", body, "text4"))

# ================= 18. Q41–Q44 · ¶6–9 =================
left = '<h4>Text 4: Do Millennials Have It Better or Worse?（¶6–9）</h4>' + P(T4, [6, 7, 8, 9])

q41 = mcq("q41", "Q41 · MC · 1 mark", chip(25),
          "Which of the following can replace <strong>'Alas'</strong> (line 52)?",
          [("A", "Unfortunately", True, ""),
           ("B", "Surprisingly", False, "不是惊讶。"),
           ("C", "In fact", False, "不是补充说明。"),
           ("D", "Finally", False, "不是总结。")],
          "&#128273; &#182;7 &quot;Alas, despite improvements in fertility treatment, the biological clock has not "
          "been reset&quot; — Alas 表遗憾（生物钟没能重设）→ Unfortunately。语篇情感词题：看下文是好事还是坏事。")

q42 = mcq("q42", "Q42 · MC · 1 mark", chip(20),
          "What does <strong>'biological clock'</strong> (line 53) mean in this context?",
          [("A", "The time when a person works most effectively.", False, "工作节律义项，不符。"),
           ("B", "The time when a woman can no longer give birth.", True, ""),
           ("C", "The time when a person reaches the end of their life.", False, "不是寿命终点。"),
           ("D", "The time when a couple start to think about having a family.", False, "不是考虑成家的时刻。")],
          "&#128273; 语境：fertility treatment（生育治疗）+ have children until their late 30s — biological "
          "clock 此处指「生育时限」→ B。一词多义看上下文，别选生理节律的通用义。")

q43i = sa("q43i", "Q43(i) · Reference · 1 mark", chip(10),
          "Who/what does <strong>'they'</strong> (line 59) refer to?",
          '<p><strong>countries (around the world)</strong></p>'
          '<p>&#182;8 &quot;Guest urged <em>countries</em> around the world to work harder... If <em>they</em> do '
          'not, that would... be dangerous&quot; — they 回指 urged 的宾语 countries。'
          '90% 考生答 young people / millennials：被话题误导，没看语法结构（urge sb to do → if they do not）。</p>')

q43ii = sa("q43ii", "Q43(ii) · Short answer · 1 mark", chip(3),
           "What would be <strong>'immoral'</strong> (line 60)?",
           '<p><strong>(countries / governments) not working harder to give young people a fair shot in life // '
           'not giving the young / next generation a fair shot / opportunity</strong></p>'
           '<p>&#182;8&ndash;9 &quot;work harder to give the young a fair shot. If they do not, that would not '
           'only be immoral&quot; — immoral 的内容 = 「不这么做」，即不给孩子公平机会。'
           '全卷最难（3%）：需要把否定条件句还原成名词短语。</p>')

q44 = mcq("q44", "Q44 · MC · 1 mark", chip(44),
          "What message about Millennials does the writer want to send?",
          [("A", "Although their lives seem easy, they actually face many difficulties.", True, ""),
           ("B", "Although they live better lives, they are not as happy as their parents.", False, "没比较幸福感。"),
           ("C", "Although they face many obstacles, they are able to cope with the challenges.", False, "没说能应对。"),
           ("D", "Although they have more opportunities, they don't make the most of them.", False, "没说浪费机会。")],
          "&#128273; 主旨题：&#182;1 &quot;You might think that young people have it easy. But... millennials have "
          "it tougher than most people think&quot; — 表面轻松 vs 实际艰难 → A。首段的 But 是全文基调。")

right = q41 + q42 + q43i + q43ii + q44
body = ('<div class="sec-label">Part B1 · Text 4 · Q41–Q44</div>'
        '<div class="slide-h3">Alas, the Biological Clock — 结尾段的指代陷阱</div>'
        + split("Text 4 (¶6–9)", left, right))
slides.append(slide("Q41–Q44 · Text 4 ¶6–9", "practice", "Part B1", body, "text4"))

# ================= 19. B1 Close Reading =================
cr = ('<div class="sec-label">Part B1 · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>S1: Millennials... are about to move into their ' + sig("prime spending years", "消费黄金期")
      + ' — the largest generation ' + sig("in history", "有史以来") + '.</p>'
      '<p style="margin-top:14px">S2: ' + sig("Snug in the nest", "舒适地窝在家里（与父母同住）")
      + '... their ' + sig("reluctance to enter the housing market", "不愿进入房地产市场")
      + ' could change... lead to ' + sig("a surge in home sales", "购房潮") + '.</p>'
      '<p style="margin-top:14px">S3: services that provide access to products '
      + sig("without the burdens of ownership", "没有所有权负担") + '... '
      + sig("giving rise to", "催生；引起") + ' a &#39;sharing economy&#39;... The '
      + sig("must-haves", "必备品") + ' for previous generations...</p>'
      '<p style="margin-top:14px">S4: putting off significant ' + sig("milestones", "人生大事") + '.</p>'
      '<p style="margin-top:14px">S5: at their ' + sig("fingertips", "触手可及")
      + '... a strong brand isn&#39;t enough to ' + sig("lock in a sale", "锁定成交") + '.</p>'
      '<p style="margin-top:14px">S6: wellness is a ' + sig("daily, active pursuit", "日常的主动追求") + '.</p>'
      '<p style="margin-top:14px">&#182;4 (Text 4): Youngsters are ' + sig("twice as likely", "可能性是两倍")
      + ' as their elders to be unemployed... ' + sig("NEETs", "尼特族") + '.</p>'
      '<p style="margin-top:14px">&#182;5: the cost of housing and education often '
      + sig("prices millennials out of the market", "价格太高把千禧一代挤出市场") + '... many students '
      + sig("rack up heavy debts", "背上沉重债务") + '... Young people ' + sig("yearn to", "渴望")
      + ' move to such cities.</p>'
      '<p style="margin-top:14px">&#182;7: ' + sig("Alas", "遗憾的是")
      + ', the biological clock has not been ' + sig("reset", "重新设定") + '.</p>'
      '<p style="margin-top:14px">&#182;8: give the young ' + sig("a fair shot", "一个公平的机会") + '.</p></div>')
slides.append(slide("Part B1 · Close Reading", "close-reading", "Part B1", cr))

# ================= 20. B1 Exit Test =================
b1_exit_cards = [
    ("make a difference to", "对……产生重大影响"),
    ("be reluctant to", "不情愿做……"),
    ("settle down", "安定下来（成家置业）"),
    ("put off / postpone", "推迟"),
    ("turn to (services)", "转而求助于"),
    ("at one's fingertips", "触手可及"),
    ("rack up (debts)", "累积（债务）"),
    ("price sb out of the market", "价格太高令某人买不起"),
    ("a fair shot", "公平的机会"),
    ("have it easy / tough", "日子轻松 / 艰难"),
]
body = ('<div class="sec-label">Part B1 · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">动词短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 2–4 Millennials · 10 items · 每题 1 分</div>'
        + flip_grid(b1_exit_cards))
slides.append(slide("Part B1 Exit Test", "exit-test", "Part B1", body))

# ================= 21. B1 Recap =================
recap = ('<div class="sec-label">Part B1 · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part B1 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 2 = <strong>信息图（infographic slides）</strong>；Text 3 = <strong>数据卡（stats card）</strong>；'
         'Text 4 = <strong>新闻特写（magazine feature）</strong>。B1 拿分关键：图文互证 — 数据卡和 slide 标题都是出题点，'
         '不能只读正文。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>短语字面≠含义（snug in the nest / prices out of the market）；摘要填空要合成（Q30 healthier）；'
         '指代看语法不看话题（Q43 they = countries）；勾选题逐项验证（Q38）；三要素题防漏答（Q40）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128202; 2017 隐形数据 — 击碎砖块看 B1 最难题</h4>'
         '<p>Q43(ii) immoral ' + chip(3) + ' · Q39 that 指代 ' + chip(5) + ' · '
         'Q43(i) they 指代 ' + chip(10) + ' · Q38 勾选 ' + chip(13) + ' · '
         'Q26(i) sharing economy ' + chip(17) + ' · Q36(i) 反向转述 ' + chip(20) + ' — '
         '指代 + 转述 + 排除，是 B1 三大失分点。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128273; 金句</h4>'
         '<p>信息图题 = 眼睛题：先看标题和数据卡，再回正文；指代题 = 语法题：找动词结构，别被话题带跑。</p></div>')
slides.append(slide("Part B1 · Recap", "exit-test", "Part B1", recap))

# ================= 22. Part B2 divider =================
div_b2 = ('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">'
          '<div class="class-badge" style="font-size:20px;padding:14px 36px;margin-bottom:24px">Part B2</div>'
          '<div class="slide-h1" style="text-align:center">Harder Section</div>'
          '<div class="slide-h3" style="text-align:center;color:var(--text-2);margin-top:12px">Text 5 · Q45&ndash;Q60 · 43 marks</div>'
          '<p style="text-align:center;font-size:20px;margin-top:20px;color:var(--text-2);max-width:620px">'
          'Millennials &ndash; Themes In The Literature（学术文献综述）— 阅读重点：研究者观点对比 '
          '（Howe &amp; Strauss vs Twenge）· 引用与格式 · 隐喻（digital natives）· 段落结构匹配。</p></div>')
slides.append(slide("Part B2", "divider", "Part B2", div_b2))

# ================= 23. B2 Entry Test =================
b2_entry_cards = [
    ("coin (a term)", "创造（新词）"),
    ("landmark research", "里程碑式研究"),
    ("complementary", "互补的"),
    ("prosperity", "繁荣"),
    ("catalyst", "催化剂"),
    ("foist upon", "强加于"),
    ("flaunt", "蔑视；炫耀"),
    ("contend", "主张；断言"),
    ("exuberant", "洋溢的；旺盛的"),
    ("truism", "不言自明之理"),
]
body = ('<div class="sec-label">Part B2 · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">学术词汇 Academic Words — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 5 Literature Review · 10 words · 每题 1 分</div>'
        + flip_grid(b2_entry_cards))
slides.append(slide("Part B2 Entry Test", "entry-test", "Part B2", body))

# ================= 24. Q45–Q46 · ¶1–3 =================
left = '<h4>Text 5: Millennials &ndash; Themes In The Literature（¶1–3）</h4>' + P(T5, [1, 2, 3])

q45 = tfng_slide("q45", "Q45 · T / F / NG · 4 marks",
                 "According to paragraphs 1&ndash;2, are the following statements True (T), False (F) or Not Given (NG)?",
                 [("(i)", "Howe and Strauss were the first to use the term, 'Millennial Generation'.", "T",
                   "¶1 \"widely credited with <em>coining</em> the term\" — coin = 首创。", 48),
                  ("(ii)", "Research by Howe and Strauss has been influential.", "T",
                   "¶1 \"Since their <em>landmark</em> research... many authors have <em>built on</em> "
                   "Howe and Strauss' work\"。", 75),
                  ("(iii)", "Some themes on Millennials are in conflict with each other.", "T",
                   "¶1 \"even those <em>in conflict</em> with one another\"。", 72),
                  ("(iv)", "Experts agree that Millennials were born within the same time period.", "F",
                   "¶2 Twenge 把 1970 年代的也纳入 — 定义有分歧，并非一致。", 58)])

q46 = sa("q46", "Q46 · Short answer · 3 marks", "",
         "In paragraph 3, what three factors mentioned by the writer have characterised the Millennial generation?",
         '<p><strong>i)</strong> grown up in a child-centred society / adored from infancy '
         '<span style="color:var(--text-3)">' + chip(87) + '</span></p>'
         '<p><strong>ii)</strong> lived in an era of relative peace <span style="color:var(--text-3)">'
         + chip(84) + '</span></p>'
         '<p><strong>iii)</strong> lived in an era of relative prosperity <span style="color:var(--text-3)">'
         + chip(78) + '</span></p>'
         '<p>&#128273; &#182;3 三连结构：child-centred society · era of relative peace · era of relative '
         'prosperity。干扰项「Baby Boomers 的子女」是身份不是「characterised」的因素，不得分。</p>')

right = q45 + q46
body = ('<div class="sec-label">Part B2 · Text 5 · Q45–Q46</div>'
        '<div class="slide-h3">Defining the Generation — 文献综述怎么读</div>'
        + split("Text 5 (¶1–3)", left, right))
slides.append(slide("Q45–Q46 · Text 5 ¶1–3", "practice", "Part B2", body, "text5"))

# ================= 25. Q47–Q49 · ¶4–7 =================
left = '<h4>Text 5: Millennials &ndash; Themes In The Literature（¶4–7）</h4>' + P(T5, [4, 5, 6, 7])

q47 = mcq("q47", "Q47 · MC · 1 mark", chip(87),
          "Which of the following can be inferred from paragraph 3?",
          [("A", "Millennials are growing up quickly.", False, "与成长速度无关。"),
           ("B", "Millennials face an uncertain future.", False, "¶3 说相对和平繁荣，不是不确定。"),
           ("C", "Millennials see themselves as global citizens.", False, "无此表述。"),
           ("D", "Millennials have grown up in a sheltered environment.", True, "")],
          "&#128273; 推断题：被宠爱（adored from infancy）+ 相对和平 + 相对繁荣 + 对冲突知之甚少 → "
          "在受保护的环境中长大 → D。推断 = 原文细节的合理归纳，不是联想。")

def sub_sa(qid_sub, sub, stem, ans_html, pct=None):
    """Sub-question block: full stem + per-sub rate chip shown beside the stem,
    plus an independent answer reveal."""
    rate = chip(pct) if pct is not None else ""
    return ('<div style="margin:14px 0;padding:10px 14px;border-left:3px solid var(--fcc-purple);'
            'border-radius:0 10px 10px 0;background:rgba(var(--accent-rgb),.03)">'
            '<p style="font-size:20px;margin:0 0 10px"><strong>' + _subtag(sub) + '</strong> ' + stem + rate + '</p>'
            '<button class="reveal-btn" onclick="toggleRev(\'' + qid_sub + '-ans\')">Show Answer</button>'
            '<div class="ans-reveal" id="' + qid_sub + '-ans">'
            '<div class="ans-banner"><span class="tick">&#10003;</span><div><div class="at">Answer ('
            + sub + ')</div></div></div>' + ans_html + '</div></div>')

q48 = ('<div class="practice-mcq" id="q48-box"><div class="pmcq-label">Q48 · Short answer · 4 marks</div>'
       '<div class="pmcq-q">According to paragraph 5, answer the following questions.</div>'
       + sub_sa("q48i", "i",
                "Which generation was the first to adopt a child-centred approach to parenting?",
                '<p><strong>Baby Boomers</strong> // people born between 1946&ndash;1964 // parents in the 1960s '
                '/ (and) 1970s</p>'
                '<p>&#182;5 &quot;the emergence of the pro-child culture among <em>Baby Boomer adults</em>&quot; — '
                '亲儿童文化兴起的主体是婴儿潮一代成年人。常见错答 1940s &amp; 1950s（那是出生年代，不是世代名）。</p>',
                26)
       + sub_sa("q48ii", "ii",
                "Which generation had child bearing &#39;foisted upon them&#39;?",
                '<p><strong>parents of Baby Boomers</strong> // (the generation) before Baby Boomers // parents of '
                'children born between 1946&ndash;1964 // people born before the 1940s</p>'
                '<p>&#182;5 &quot;Parents became parents because they <em>wanted</em> children, not because '
                'childbearing was <em>foisted upon them</em>&quot; — 反推：被强加生育的是「之前那一代」= 婴儿潮'
                '一代的父母。全卷第三难。</p>', 6)
       + sub_sa("q48iii", "iii",
                "Find one factor that led to a pro-child culture. (1 mark)",
                '<p><strong>(the emergence of widespread use of) birth control // growing availability of '
                'abortion // people have a choice to have children // parents want children</strong></p>'
                '<p>只答 birth control 不够，要写出「避孕普及 → 少生非意愿婴儿」的因素属性。</p>', 47)
       + sub_sa("q48iv", "iv",
                "What were schools&#39; attitudes towards the pro-child movement? (1 mark)",
                '<p><strong>(they) joined / adopted / agreed / accepted / supported / followed / approved (it) // '
                'positive / supportive</strong></p>'
                '<p>&#182;5 &quot;Schools... <em>joined the bandwagon</em>&quot; — bandwagon（跟风）要转述成 '
                'joined/supported，照抄不得分。</p>', 56)
       + '</div>')

q49 = ('<div class="practice-mcq" id="q49-box"><div class="pmcq-label">Q49 · Comparison table · 6 marks</div>'
       '<div class="pmcq-q">Complete the table below by identifying how the researchers differ in their understanding of '
       'Millennials using information given in paragraphs 6-9. (6 marks) '
       '<span style="color:var(--text-3);font-weight:500;font-size:17px">点击空格查看答案。</span></div>'
       '<div class="tb-wrap"><table class="quiz-table">'
       '<tr><th style="width:30%"></th><th>Howe and Strauss&#39; interpretation</th><th>Twenge&#39;s interpretation</th></tr>'
       '<tr><td>Millennials&#39; belief that they are unique&hellip;</td>'
       '<td>has produced a generation which is <strong>(i)</strong> '
       + cloze("community-minded // (interested in / able to) serving / contributing to the community / society (and its structures)") + chip(62) + '</td>'
       '<td>has produced a generation which is <strong>(ii)</strong> '
       + cloze("individualistic / self-oriented / narcissistic / less likely to care about others' opinions") + chip(65) + '</td></tr>'
       '<tr><td>Millennials&#39; reaction to rules is to&hellip;</td>'
       '<td><strong>(iii)</strong> ' + cloze("(to) follow / believe / support / obey (the rules / society's conventions)") + chip(61) + '</td>'
       '<td><strong>(iv)</strong> '
       + cloze("(less likely to care about others' opinions and to) flaunt / break / not follow / ignore / reject / oppose / challenge (the rules / society's conventions)") + chip(59) + '</td></tr>'
       '<tr><td>The pressure on Millennials to succeed&hellip;</td>'
       '<td>will lead them to <strong>(v)</strong> '
       + cloze("believe that they will be (both financially and socially) successful // (have) confident expectations // be more confident // may (indeed) live up to their confident expectations") + chip(9) + '</td>'
       '<td>will lead them to <strong>(vi)</strong> '
       + cloze("unrealistic(ally high) expectations of themselves // (high levels of) depression / anxiety / loneliness / mental illness // be depressed / anxious / lonely") + chip(60) + '</td></tr>'
       '</table></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; B2 核心对比结构：'
       'Howe &amp; Strauss（乐观派：community-minded · follow rules · confident）vs Twenge（悲观派：'
       'Generation Me · individualistic · flaunt rules · depression）。(v) 是全卷最难之一（9%）：不能照抄 '
       '&#39;will be both financially and socially successful&#39; 的原句，要提炼成 believe they will be '
       'successful。对比表每格独立判分。<br>'
       '&#10007; 不得分答案提醒：ii) do not care // selfish // generation me；v) be both financially and socially '
       'successful // indeed live up to their confident expectations；vi) leave exuberant confidence behind '
       '(and suffer depression, anxiety and loneliness)。</span></div></div>')

right = q47 + q48 + q49
body = ('<div class="sec-label">Part B2 · Text 5 · Q47–Q49</div>'
        '<div class="slide-h3">Optimists vs Pessimists — Howe &amp; Strauss 对阵 Twenge</div>'
        + split("Text 5 (¶4–7)", left, right, "split-q49"))
slides.append(slide("Q47–Q49 · Text 5 ¶4–7", "practice", "Part B2", body, "text5"))

# ================= 26. Q50–Q52 · ¶8–12 =================
left = '<h4>Text 5: Millennials &ndash; Themes In The Literature（¶8–12）</h4>' + P(T5, [8, 9, 10, 11, 12])

q50 = mcq("q50", "Q50 · MC · 1 mark", chip(39),
          "Which word can replace <strong>'contend'</strong> (line 41)?",
          [("A", "hope", False, "不是希望。"),
           ("B", "argue", True, ""),
           ("C", "accept", False, "不是接受。"),
           ("D", "disagree", False, "contend 是主张，不是反对。")],
          "&#128273; &#182;8 &quot;they <em>contend</em> that this confident, achieving generation believes...&quot; — "
          "contend that = 主张/断言 → argue。学术动词：contend / claim / assert / maintain 都是「主张」。")

q51 = ('<div class="practice-mcq" id="q51-box"><div class="pmcq-label">Q51 · Flow chart · 3 marks</div>'
       '<div class="pmcq-q">Complete the diagram below, which illustrates the changes described in paragraph 11. '
       'Click each blank to check.</div>'
       '<div class="card" style="padding:16px 18px;font-size:20px;line-height:1.9">'
       '<strong>(i)</strong> ' + cloze("(the) changing makeup / structure of the (nuclear) family") + chip(50)
       + '<br>&#9660;<br>e.g. from two-parent to single-parent families<br>&#9660;<br>'
       'Children have more opportunities to <strong>(ii)</strong> '
       + cloze("take part / participate / join / be involved in family discussions and decisions") + chip(32)
       + '<br>&#9660;<br>Millennials see their parents and other adults as <strong>(iii)</strong> '
       + cloze("peers // their peer // equals // friends") + chip(37) + '</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; &#182;11 因果链条：'
       '家庭结构变化 → 孩子更多参与家庭讨论与决策 → 与长辈形成平辈关系（peer-to-peer）。(iii) 最大坑：'
       '答 a peer-to-peer relationship 不得分 — see... as 后要接名词 peers/equals，照抄原文形容词组会暴露'
       '「没读懂语法」。</span></div></div>')

q52 = ('<div class="practice-mcq" id="q52-box"><div class="pmcq-label">Q52 · Table cloze · 6 marks</div>'
       '<div class="pmcq-q">Complete the table using information given in paragraph 12. Click each blank to check.</div>'
       '<div class="tb-wrap"><table class="quiz-table">'
       '<tr><th>Aspect of Millennials&#39; lives</th><th>Example / concept</th><th>Researcher</th></tr>'
       '<tr><td>Expressing one&#39;s identity</td><td><strong>(i)</strong> '
       + cloze("(the explosion of) tattoos and piercings") + chip(57) + '</td>'
       '<td><strong>(ii)</strong> ' + cloze("Twenge") + chip(52) + '</td></tr>'
       '<tr><td><strong>(iii)</strong> ' + cloze("workplace // career // employment // paying dues // working up the corporate ladder // working with others") + chip(39) + '</td>'
       '<td><strong>(iv)</strong> ' + cloze("expect their views to be valued (from the beginning) // expect advancement to be rapid") + chip(30) + '</td>'
       '<td>Raines</td></tr>'
       '<tr><td><strong>(v)</strong> ' + cloze("education // expressing one's opinions / perspective / mind // growing up // asserting one's autonomy") + chip(38) + '</td>'
       '<td>Challenging authority</td>'
       '<td><strong>(vi)</strong> ' + cloze("Twenge") + chip(66) + '</td></tr>'
       '</table></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; &#182;12 三域结构：'
       'Culturally（tattoos &amp; piercings &mdash; Twenge）· In the workplace（views valued, rapid advancement '
       '&mdash; Raines）· In education（challenge professors &mdash; Twenge）。(vi) 66% 对但仍有考生答 Windham — '
       'Windham 只出现在句末 acceptance as equals，与 challenge professors 无关。括号引用 = 出题高发区。</span></div></div>')

right = q50 + q51 + q52
body = ('<div class="sec-label">Part B2 · Text 5 · Q50–Q52</div>'
        '<div class="slide-h3">Self-belief &amp; Relating to Others — 观点与研究者的连线</div>'
        + split("Text 5 (¶8–12)", left, right))
slides.append(slide("Q50–Q52 · Text 5 ¶8–12", "practice", "Part B2", body, "text5"))

# ================= 27. Q53–Q56 · ¶13–15 =================
left = '<h4>Text 5: Millennials &ndash; Themes In The Literature（¶13–15）</h4>' + P(T5, [13, 14, 15])

q53i = sa("q53i", "Q53(i) · Metaphor · 1 mark", chip(49),
          "Which metaphor does Prensky use to describe Millennials?",
          '<p><strong>(digital) native(s) (in a society that is dominated by modern technology)</strong></p>'
          '<p>&#182;14 &quot;Millennials are <em>natives</em> in a society that is dominated by modern technology&quot; '
          '— 千禧一代是「数字原住民」。答 digital immigrants 不得分：那是前几代人。</p>')

q53ii = sa("q53ii", "Q53(ii) · Explain metaphor · 1 mark", chip(13),
           "Explain the meaning of this metaphor.",
           '<p><strong>(they are) people who have grown up with / using technology // did not live through the '
           'emergence of technology as adults // been familiar with technology from an early age</strong></p>'
           '<p>&#182;13&ndash;14 &quot;the only ones who did not live through its emergence as adults&quot; — '
           '解释隐喻要落到「从小与科技一起长大」这个本质，答「比上一代更熟悉科技」不得分（比较级是引申不是释义）。</p>')

q53iii = sa("q53iii", "Q53(iii) · Metaphor · 1 mark", chip(19),
            "What does <strong>'the land they live in'</strong> (lines 75&ndash;76) refer to?",
            '<p><strong>the digital world // society / environment dominated by (modern) technology // the age of '
            'technology</strong></p>'
            '<p>&#182;14 &quot;natives in a society that is dominated by modern technology... think about '
            '<em>the land they live in</em>&quot; — 比喻延续：原住民居住的「土地」= 科技主导的世界。'
            '答 modern society / earth / the technology they use 都不够准。</p>')

q54 = sa("q54", "Q54 · Short answer · 2 marks", chip(11),
         "How have attitudes towards multi-tasking changed over time?",
         '<p><strong>multi-tasking is no longer considered negative / a distraction &mdash; what was once '
         'described as distractibility is now considered multi-tasking // attitudes have changed from negative to '
         'positive</strong></p>'
         '<p>&#182;14 &quot;What might once have been described as <em>distractibility</em>, is now considered '
         '<em>multi-tasking</em>&quot; — 时间对比：once（贬义：注意力涣散）→ now（中性/褒义：多任务处理）。'
         '仅 11% 对：方向写反（from positive to negative）或照抄两个词而不点明变化。</p>')

q55 = sa("q55", "Q55 · Short answer · 2 marks", chip(57),
         "Why should Millennials not be described as having short attention spans?",
         '<p><strong>(Prensky shows that) they can spend extended time in sharply focused activity when playing '
         '(high-tech) video games</strong></p>'
         '<p>&#182;14 &quot;denies the evidence that they can <em>spend extended time in sharply focused '
         'activity</em> when playing high-tech video games&quot; — 证据 = 能长时间高度专注。'
         '答 because they can multi-task 不得分：多任务与注意力持久是两回事。</p>')

q56 = sa("q56", "Q56 · Short answer · 2 marks", chip(18),
         "According to the conclusion, what should Millennials try to achieve?",
         '<p><strong>to strive for ambitious goals while learning to deal with / accept / work through disappointment '
         'and failure // balance ambitious goals with being prepared for failure // want to succeed but also be '
         'prepared for failure / provide themselves with safety nets for failure</strong></p>'
         '<p>&#182;15 &quot;they have believed the message... Millennials need to be encouraged to succeed and '
         'provided safety nets for failure as they learn to work through both of these experiences&quot; — '
         '答案要把「追求成功」与「学会承受失败」两面都写出。答 ambitious goals and unrealistic goals 不得分。</p>')

right = q53i + q53ii + q53iii + q54 + q55 + q56
body = ('<div class="sec-label">Part B2 · Text 5 · Q53–Q56</div>'
        '<div class="slide-h3">Digital Natives — 隐喻与时间对比</div>'
        + split("Text 5 (¶13–15)", left, right))
slides.append(slide("Q53–Q56 · Text 5 ¶13–15", "practice", "Part B2", body, "text5"))

# ================= 28. Q57–Q60 =================
left = ('<h4>Text 5: 全文结构（I&ndash;VII 对应段落）</h4>'
        '<div class="card" style="padding:14px 18px;font-size:18px;line-height:1.9">'
        '<p><strong>I. Introduction</strong>（¶1）— 已给出</p>'
        '<p><strong>II.</strong>（¶2&ndash;3）</p>'
        '<p><strong>III.</strong>（¶4&ndash;7）</p>'
        '<p><strong>IV.</strong>（¶8&ndash;9）</p>'
        '<p><strong>V.</strong>（¶10&ndash;12）</p>'
        '<p><strong>VI.</strong>（¶13&ndash;14）</p>'
        '<p><strong>VII. Conclusion</strong>（¶15）— 已给出</p>'
        '<p style="color:var(--text-2);font-size:16px;margin-top:10px">提纲 II&ndash;VI 的节标题已被隐去 — '
        '这正是 Q60 要完成的匹配任务。</p></div>')

q57 = mcq("q57", "Q57 · MC · 1 mark", chip(62),
          "The main purpose of this article is to…",
          [("A", "show what others have said about the topic.", True, ""),
           ("B", "identify key limitations in the research.", False, "没批判研究局限。"),
           ("C", "suggest new areas of research.", False, "没提新研究方向。"),
           ("D", "disprove earlier literature.", False, "是综述不是推翻。")],
          "&#128273; &#182;1 &quot;This article will <em>identify a number of general themes found in recent "
          "literature</em>&quot; — 文献综述（literature review）的目的 = 梳理别人说过什么 → A。"
          "文体意识：带大量括号引用的文章几乎都是综述。")

q58 = ('<div class="practice-mcq" id="q58-box"><div class="pmcq-label">Q58 · Tick all that apply · 1 mark '
       + chip(57) + '</div>'
       '<div class="pmcq-q">The writer uses citations to tell readers that certain materials came from another '
       'source. In the citations used in the text, which of the following information is included? '
       'Tick (&#10003;) all that apply, then press <strong>Check</strong>.</div>'
       '<div class="pmcq-options tick-group" id="q58-opts">'
       '<span class="pmcq-opt" data-correct="true" onclick="toggleTick(this)">'
       '<span class="pl">i</span>The surname of the author</span>'
       '<span class="pmcq-opt" data-correct="false" onclick="toggleTick(this)">'
       '<span class="pl">ii</span>Title of the author&#39;s work</span>'
       '<span class="pmcq-opt" data-correct="false" onclick="toggleTick(this)">'
       '<span class="pl">iii</span>The name of the publisher</span>'
       '<span class="pmcq-opt" data-correct="true" onclick="toggleTick(this)">'
       '<span class="pl">iv</span>The year of the publication</span>'
       '<span class="pmcq-opt" data-correct="false" onclick="toggleTick(this)">'
       '<span class="pl">v</span>The page numbers of the material used</span>'
       '</div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkTicks(\'q58\')">Check</button>'
       '<button class="reveal-btn" onclick="resetTicks(\'q58\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q58-ans\')" style="background:var(--fcc-blue-dark)">'
       'Show Answers</button></div>'
       '<div class="ans-reveal" id="q58-result"></div>'
       '<div class="ans-reveal" id="q58-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>&#9745; i)</strong> The surname of the author（如 Howe &amp; Strauss, 2003；Twenge, 2006） · '
       '<strong>&#9745; iv)</strong> The year of the publication（括号里的年份）</p>'
       '<p>&#9744; ii) Title of the work · &#9744; iii) Publisher · &#9744; v) Page numbers — 均未出现</p>'
       '<p>&#128273; 引用格式题：文中所有括号引用都只有「姓氏 + 年份」→ i + iv。考的是观察力：'
       '回原文看一个括号即可作答。</p></div></div>')

q59 = ('<div class="practice-mcq" id="q59-box"><div class="pmcq-label">Q59 · Voice matching · 2 marks</div>'
       '<div class="pmcq-q">Read the following comments by readers of the article. Which researcher(s) are they '
       'referring to? Write the name(s) in the line next to each comment.</div>'
       + sub_sa("q59i", "i",
                "&quot;I&#39;m a young entrepreneur and I agree with the research that says Millennials are "
                "high-achieving and want to make a difference in society.&quot;",
                '<p><strong>(Neil) Howe and / &amp; (William) Strauss</strong></p>'
                '<p>high-achieving + make a difference in society = 乐观派观点（community-minded, contributing '
                'to society）。</p>', 57)
       + sub_sa("q59ii", "ii",
                "&quot;As a Millennial, I find her view of young people negative and destructive.&quot;",
                '<p><strong>Twenge</strong></p>'
                '<p>her（女性代词）+ negative（Generation Me / depression）= 悲观派 Twenge。'
                '语言印记：her 锁定唯一女性研究者。</p>', 65)
       + '</div>')

q60 = ('<div class="practice-mcq" id="q60-box"><div class="pmcq-label">Q60 · Outline matching · 5 marks</div>'
       '<div class="pmcq-q">Match the headings to the outline for Text 5. Choose A&ndash;F and drag into each box. '
       '<strong>I and VII have been given. One heading is NOT used.</strong></div>'
       '<div class="word-pool" id="q60-pool" style="margin-bottom:10px">'
       '<div class="draggable" draggable="true" data-word="q60-a" data-cat="a">A. Relating to others</div>'
       '<div class="draggable" draggable="true" data-word="q60-b" data-cat="b">B. Defining the generation</div>'
       '<div class="draggable" draggable="true" data-word="q60-c" data-cat="c">C. Childhood years</div>'
       '<div class="draggable" draggable="true" data-word="q60-d" data-cat="d">D. Technology</div>'
       '<div class="draggable" draggable="true" data-word="q60-e" data-cat="e">E. Self-belief</div>'
       '<div class="draggable" draggable="true" data-word="q60-f" data-cat="f">F. Special status</div></div>'
       '<div class="tb-wrap"><table class="match-grid"><tr><th>Outline</th><th style="width:190px">Heading (A–F)</th></tr>'
       '<tr><td><strong>I.</strong> Introduction</td><td style="color:var(--text-3)">given</td></tr>'
       '<tr><td><strong>II.</strong>（¶2&ndash;3） ' + chip(80) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="b"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>III.</strong>（¶4&ndash;7） ' + chip(44) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="f"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>IV.</strong>（¶8&ndash;9） ' + chip(67) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="e"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>V.</strong>（¶10&ndash;12） ' + chip(62) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="a"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>VI.</strong>（¶13&ndash;14） ' + chip(89) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="d"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>VII.</strong> Conclusion</td><td style="color:var(--text-3)">given</td></tr>'
       '</table></div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkMatch(\'q60\',5)">Check</button>'
       '<button class="reveal-btn" onclick="resetMatch(\'q60\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q60-ans\')" style="background:var(--fcc-blue-dark)">Show Answers</button></div>'
       '<div class="ans-reveal" id="q60-result"></div>'
       '<div class="ans-reveal" id="q60-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>II &rarr; B Defining the generation</strong> · <strong>III &rarr; F Special status</strong> · '
       '<strong>IV &rarr; E Self-belief</strong> · <strong>V &rarr; A Relating to others</strong> · '
       '<strong>VI &rarr; D Technology</strong> · <strong>C. Childhood years 未使用</strong>。</p></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">&#128273; 提纲匹配看「节标题'
       ' vs 小标题」的同义转换：Defining = 出生年代界定；Special status = unique &amp; special；Self-belief = '
       'belief in ability to succeed；Relating to others = relationships with elders；Technology = digital '
       'natives。III 最难（44%）：不要被 Childhood years 迷惑 — ¶4–7 讲的是「特殊地位」而非童年生活。</span></div></div>')

right = q57 + q58 + q59 + q60
body = ('<div class="sec-label">Part B2 · Text 5 · Q57–Q60</div>'
        '<div class="slide-h3">Final Boss — 目的题、引用格式与提纲匹配</div>'
        + split("Text 5 全文结构", left, right))
slides.append(slide("Q57–Q60 · Text 5 全文", "practice", "Part B2", body, "text5"))

# ================= 29. B2 Close Reading =================
cr = ('<div class="sec-label">Part B2 · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;1: Authors... are ' + sig("widely credited with", "被普遍认为（有……功劳）")
      + ' coining the term... many authors have ' + sig("built on", "在……基础上发展") + ' their work... '
      + sig("common foundations", "共同基础") + '.</p>'
      '<p style="margin-top:14px">&#182;3: ' + sig("By and large", "总体而言")
      + ', the Millennials are considered the children of the Baby Boomers... '
      + sig("adored from infancy", "从婴儿期就被宠爱") + '.</p>'
      '<p style="margin-top:14px">&#182;5: the ' + sig("catalyst for", "……的催化剂")
      + ' this characteristic... childbearing was ' + sig("foisted upon them", "被强加给他们")
      + '... Schools ' + sig("joined the bandwagon", "跟风加入") + '.</p>'
      '<p style="margin-top:14px">&#182;6: they have ' + sig("translated their special status into", "把特殊地位转化为")
      + ' an ability to contribute... ' + sig("community-minded", "有社区意识的") + ' citizens.</p>'
      '<p style="margin-top:14px">&#182;7: ' + sig("on the other hand", "另一方面")
      + '... more likely to ' + sig("flaunt", "蔑视；公然违反") + ' society&#39;s conventions.</p>'
      '<p style="margin-top:14px">&#182;9: ' + sig("unrealistically high expectations", "不切实际的高期望")
      + '... producing high levels of ' + sig("depression, anxiety and loneliness", "抑郁、焦虑与孤独") + '.</p>'
      '<p style="margin-top:14px">&#182;12: the idea of ' + sig("paying dues", "论资排辈；先吃苦")
      + ', and ' + sig("working up the corporate ladder", "沿公司阶梯逐级晋升") + ' is foreign.</p>'
      '<p style="margin-top:14px">&#182;14: previous generations are ' + sig("digital immigrants", "数字移民")
      + '... what might once have been described as ' + sig("distractibility", "注意力涣散")
      + ' is now considered ' + sig("multi-tasking", "多任务处理") + '... '
      + sig("short attention spans", "注意力持续时间短") + '.</p>'
      '<p style="margin-top:14px">&#182;15: this belief will likely translate into... '
      + sig("crushing disappointment", "令人崩溃的失望") + '... provided '
      + sig("safety nets for failure", "失败时的安全网") + '.</p></div>')
slides.append(slide("Part B2 · Close Reading", "close-reading", "Part B2", cr))

# ================= 30. B2 Exit Test =================
b2_exit_cards = [
    ("be credited with", "被认为有……功劳"),
    ("build on (work)", "在……基础上发展"),
    ("to a degree", "在一定程度上"),
    ("give rise to", "催生；引起"),
    ("foist upon", "强加于"),
    ("contend that", "主张……"),
    ("live up to (expectations)", "不辜负（期望）"),
    ("clash with", "与……冲突"),
    ("yearn to", "渴望"),
    ("a fair shot", "公平的机会"),
]
body = ('<div class="sec-label">Part B2 · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">学术短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 5 Literature Review · 10 items · 每题 1 分</div>'
        + flip_grid(b2_exit_cards))
slides.append(slide("Part B2 Exit Test", "exit-test", "Part B2", body))

# ================= 31. B2 Recap =================
recap = ('<div class="sec-label">Part B2 · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part B2 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 5 = <strong>学术文献综述（literature review）</strong>：术语界定 → 各主题（研究者观点对比）→ 结论。'
         '读懂「谁主张什么」比读懂单词更重要 — Howe &amp; Strauss（乐观）vs Twenge（悲观）贯穿全文。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>隐喻三连问（Q53 native/land）；时间对比题要写明方向（Q54 once→now）；对比表每格独立判分（Q49）；'
         '引用格式靠观察（Q58）；提纲匹配防干扰项（Q60 的 Childhood years）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128202; 2017 隐形数据 — 击碎砖块看 B2 最难题</h4>'
         '<p>Q48(ii) foisted upon ' + chip(6) + ' · Q49(v) 对比表 ' + chip(9) + ' · '
         'Q54 multi-tasking 态度 ' + chip(11) + ' · Q53(ii) 隐喻释义 ' + chip(13) + ' · '
         'Q56 结论目标 ' + chip(18) + ' · Q53(iii) the land ' + chip(19) + ' — '
         '改写、释义、对比方向，全是 B2 的扣分重灾区。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128273; 金句</h4>'
         '<p>综述文的答案藏在「人名 + 动词 + 观点」结构里：先圈研究者，再读 contend / perceive / cite。</p></div>')
slides.append(slide("Part B2 · Recap", "exit-test", "Part B2", recap))

# ================= 32. 全卷数据榜 =================
def drow(n, q, pct, content):
    return (f'<tr><td>{n}</td><td>{q}</td><td>{chip(pct)}</td><td>{content}</td></tr>')

datab = ('<div class="sec-label">Data Reveal · 全卷数据榜</div>'
         '<div class="slide-h2" style="margin-bottom:10px">&#128202; 2017 全卷正确率榜 — 先猜再击碎砖块</div>'
         '<div style="font-size:17px;color:var(--text-2);margin-bottom:14px">每块砖后藏着一个正确率 — '
         '猜猜哪题最难，再点击两次揭晓。</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128293; 最难 10 题</h4>'
         '<table class="quiz-table"><tr><th>#</th><th>题号</th><th>正确率</th><th>考查内容</th></tr>'
         + drow(1, "Q43(ii)", 3, "简答（immoral 指什么）")
         + drow(2, "Q39", 5, "指代理解（that = 搬去大城市）")
         + drow(3, "Q48(ii)", 6, "简答（foisted upon 的一代）")
         + drow(4, "Q11(i)", 9, "简答（政客为何支持零废弃）")
         + drow(5, "Q49(v)", 9, "对比表（H&S: will be successful）")
         + drow(6, "Q43(i)", 10, "指代理解（they = countries）")
         + drow(7, "Q54", 11, "简答（multi-tasking 态度变化）")
         + drow(8, "Q53(ii)", 13, "隐喻释义（digital natives）")
         + drow(9, "Q38", 13, "勾选题（megacity 三大优势）")
         + drow(10, "Q26(i)", 17, "简答（sharing economy 原因）")
         + '</table></div>'
         '<div class="card"><h4>&#10003; 最易 10 题</h4>'
         '<table class="quiz-table"><tr><th>#</th><th>题号</th><th>正确率</th><th>考查内容</th></tr>'
         + drow(1, "Q60(vi)", 89, "提纲匹配（VI → D Technology）")
         + drow(2, "Q46(i)", 87, "简答（child-centred society）")
         + drow(3, "Q3(i)", 87, "简答（1996 年作者观点）")
         + drow(4, "Q47", 87, "选择题（sheltered environment）")
         + drow(5, "Q2", 86, "简答（回收的两大好处）")
         + drow(6, "Q46(ii)", 84, "简答（era of relative peace）")
         + drow(7, "Q14(ii)", 84, "勾选题（food waste → None）")
         + drow(8, "Q13(ii)", 83, "表格填空（25% 目标）")
         + drow(9, "Q31", 83, "小标题匹配（Housing / Diet）")
         + drow(10, "Q1", 80, "勾选题（E-WASTE 未提及）")
         + '</table></div>')
slides.append(slide("全卷数据榜", "exit-test", "收尾", datab))

# ================= 33. 考生表现分析 =================
perf = ('<div class="sec-label">Candidates\' Performance · 考生表现分析</div>'
        '<div class="slide-h2" style="margin-bottom:14px">2017 真题难度画像 — 知己知彼</div>'
        '<div class="card" style="margin-bottom:14px"><h4>&#128202; 试卷概况</h4>'
        '<p>全卷 <strong>60 题</strong> · Part A 必做（Q1&ndash;Q21，41 分）· Part B1 较易（Q22&ndash;Q44，43 分）· '
        'Part B2 较难（Q45&ndash;Q60，43 分）。选考 A+B2 可获全部等级（Level 1&ndash;5<strong>**</strong>）；'
        '选考 A+B1 最高只能获 Level 4。以下平均正确率按各题难度指数（facility index）计算，'
        '非官方得分率统计。</p>'
        '<table class="quiz-table"><tr><th>部分</th><th>题数</th><th>满分</th><th>题目平均正确率</th></tr>'
        '<tr><td>Part A（必考）</td><td>Q1–Q21</td><td>41</td><td>约 53%</td></tr>'
        '<tr><td>Part B1（较易）</td><td>Q22–Q44</td><td>43</td><td>约 46%</td></tr>'
        '<tr><td>Part B2（较难）</td><td>Q45–Q60</td><td>43</td><td>约 52%</td></tr></table></div>'
        '<div class="card" style="margin-bottom:14px"><h4>&#127919; 2017 难度特征 → 备考建议</h4>'
        '<p><strong>① B1 反而更难（46% &lt; 52%）</strong>：信息图看似友好，但考短语真实含义（snug in the '
        'nest / prices out of the market）与指代，别轻敌。</p>'
        '<p><strong>② 指代题是重灾区</strong>：Q39（that）/ Q43（they）正确率仅 5%–10% — 找动词结构回指，'
        '别被话题词带跑。</p>'
        '<p><strong>③ 转述能力定成败</strong>：最难 10 题几乎都要求 paraphrase（immoral / foisted upon / '
        'multi-tasking 态度）— 照抄原文 ≠ 得分。</p>'
        '<p><strong>④ 综述文体要练</strong>：B2 的研究者观点对比表（Q49/Q52）和提纲匹配（Q60）是 Level 5 '
        '分水岭，平时精读学术类文章。</p></div>')
slides.append(slide("考生表现分析", "exit-test", "收尾", perf))

# ================= 34. Well Done =================
done = ('<section class="slide" data-title="Well Done!" data-section="done" data-part="">'
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%">'
        '<div style="font-size:72px;margin-bottom:24px">&#127881;</div>'
        '<h2 class="slide-h2">Well Done!</h2>'
        '<p style="font-size:20px;color:var(--text-2);max-width:600px;line-height:1.8;margin-bottom:28px">'
        'You completed <strong>2017 DSE Paper 1 Reading</strong> — Part A (the myth of recycling) + Part B1 '
        '(millennials infographic &amp; better or worse) + Part B2 (themes in the literature)。</p>'
        '<div class="score-badge" style="font-size:18px;padding:10px 24px;margin-bottom:14px">'
        '<span class="sb-correct" id="finalScore">0</span><span class="sb-divider">/</span>'
        '<span class="sb-total" id="finalTotal">0</span></div>'
        '<p style="font-size:17px;color:var(--text-2);margin-bottom:20px">Questions answered: '
        '<b style="color:var(--fcc-purple-dark)"><span id="finalProgress">0/0</span></b></p>'
        '<button class="reveal-btn" onclick="launchConfetti()" style="font-size:22px;padding:12px 32px">'
        '&#127882; Celebrate!</button>'
        '<p style="margin-top:22px;color:var(--text-2);font-size:16px">&#128274; 试试 Hard Mode：点击顶栏 '
        '&#128274; Easy — 切换为全文显示 (&#182;编号)，挑战自己不靠定位难题。</p></div></section>\n\n')
slides.append(done)

# ================= SHELL =================
HEAD = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2017 DSE Paper 1 阅读卷 · 网页课件 v1</title>
  <link rel="stylesheet" href="css/main.css">
</head>

<body>
  <!-- Palette panel (body-level, JS-positioned, fullscreen-proof) -->
  <div class="palette-panel" id="palettePanel">
    <div class="pp-title">Theme Color</div>
    <div class="palette-grid" id="paletteGrid"></div>
    <div class="pp-note">saved locally</div>
  </div>

<div class="deck">

  <!-- ===== Sidebar ===== -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">&lt;/&gt; DSE 2017</div>
      <button class="sidebar-toggle" onclick="toggleSidebar()" title="Toggle sidebar">☰</button>
    </div>
    <div class="sidebar-nav" id="sidebarNav"></div>
    <div class="sidebar-score">
      <div class="score-ring">
        <svg viewBox="0 0 36 36">
          <circle class="ring-bg" cx="18" cy="18" r="14"/>
          <circle class="ring-fg" cx="18" cy="18" r="14" stroke-dasharray="87.96" stroke-dashoffset="87.96"/>
        </svg>
        <div class="ring-text">0%</div>
      </div>
      <div class="score-detail">
        <div class="sd-label">Score</div>
        <div class="sd-val">0/0</div>
      </div>
    </div>
    <div class="sidebar-footer">
      <button class="theme-toggle" onclick="toggleDarkMode()" title="Toggle dark mode (D)">☽</button>
      <span class="theme-label">Dark Mode</span>
    </div>
  </aside>

  <button class="sb-edge-tab" onclick="toggleSidebar()" title="展开侧边栏 (S)">☰</button>

  <!-- ===== Main Area ===== -->
  <div class="main-area">

    <!-- ===== Topbar ===== -->
    <div class="topbar">
      <span class="course-tag">2017 DSE · Paper 1</span>
      <span class="slide-title mono" id="topbarTitle"></span>
      <span class="page-counter page-counter-top" id="pageCounter">
        <span class="pc-cur" id="pcCur" onclick="editPageCounter()">1</span>
        <span class="pc-total" id="pcTotal"></span>
      </span>
      <span class="score-badge">
        <span class="sb-correct">0</span><span class="sb-divider">/</span><span class="sb-total">0</span>
      </span>
      <span class="streak-badge" style="display:none">
        <span class="streak-fire">&#128293;</span><span class="streak-count">0</span>
      </span>
      <span class="zoom-controls">
        <button class="zoom-btn" id="zoomOutBtn" onclick="zoomOut()">&#8722;</button>
        <span class="zoom-level" id="zoomLevelLabel" onclick="resetZoom()">100%</span>
        <button class="zoom-btn" id="zoomInBtn" onclick="zoomIn()">+</button>
      </span>
      <span class="timer-wrap">
        <span class="timer-input-wrap" id="timerWrap" oncontextmenu="event.preventDefault();cycleDuration()" title="Right-click to cycle presets (1/2/3/5/10 min)">
          <input class="t-min" id="timerMin" type="number" min="0" max="99" value="5">
          <span class="t-colon">:</span>
          <input class="t-sec" id="timerSec" type="number" min="0" max="59" value="00">
          <span class="timer-done-label">TIME UP</span>
        </span>
        <button class="timer-play" id="timerPlayBtn" onclick="toggleTimer()">&#9654;</button>
        <button class="timer-reset" onclick="resetTimer()">Reset</button>
      </span>
      <button class="toc-btn" id="randBtn" onclick="toggleRandPanel(event)" title="Random number picker — 随机点名">&#127922;</button>
      <button class="tb-more-btn" id="tbMoreBtn" onclick="toggleTBMore(event)" title="更多工具 More tools">⋯</button>
      <span class="tb-extra" id="tbExtra">
        <button class="hint-toggle-btn" id="hintToggleBtn" onclick="showAllData()" title="Toggle: shatter ALL brick covers to reveal rates / restore all covers (H)">&#128202; Show Data</button>
        <button class="hardmode-btn" id="hardmodeBtn" onclick="toggleHardMode()" title="Toggle hard mode: show full passage">&#128274; Easy</button>
        <button class="clear-hl-btn" id="notesBtn" onclick="openNotes()" title="Lesson notes — 按页笔记">&#128221; Notes</button>
        <button class="clear-hl-btn" onclick="clearAllHighlights()" title="Clear all highlights">&#128465; Clear</button>
        <button class="clear-hl-btn" onclick="resetProgress()" title="Reset all saved answers &amp; progress">&#8634; Reset</button>
        <span class="palette-wrap">
          <button class="clear-hl-btn" id="paletteBtn" onclick="togglePalettePanel(event)" title="Change theme color">&#127912; Theme</button>
        </span>
      </span>
    </div>

    <!-- Random picker overlay -->
    <div class="rand-overlay" id="randOverlay" onclick="if(event.target===this)toggleRandPanel()">
      <div class="rand-card">
        <div class="rand-head">
          <span class="rand-title">&#127922; 随机点名</span>
          <span class="rand-range-wrap">1 – <input class="rand-max" id="randMax" type="number" min="2" max="999" value="40"></span>
        </div>
        <div class="rand-num" id="randNum">?</div>
        <div class="rand-btns">
          <button class="rand-go" onclick="drawRandom()">开始点名！</button>
          <button class="rand-close" onclick="toggleRandPanel()">关闭</button>
        </div>
        <div class="rand-history" id="randHistory"></div>
      </div>
    </div>

<!-- Notes panel (unified 2026-09-02, ref 2015DSE-Paper1_v1) -->
<div class="notes-overlay" id="notesOverlay" onclick="closeNotes()"></div>
<div class="notes-panel" id="notesPanel">
  <div class="notes-header">
    <span class="notes-title" id="npPage">笔记</span>
    <button class="notes-close" onclick="closeNotes()">✕</button>
  </div>
  <textarea class="notes-ta" id="npTa" placeholder="在这一页记笔记……（自动保存到本地）"></textarea>
</div>

    <div class="progress-bar" id="progressBar"></div>

    <!-- ===== Slides ===== -->
    <div class="slides-container" id="slidesContainer">

'''

TAIL = '''
    </div><!-- /slides-container -->

  </div><!-- /main-area -->

</div><!-- /deck -->

<script src="js/main.js"></script>
</body>
</html>
'''

html_out = HEAD + "".join(slides) + TAIL
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_out)

print("Slides:", len(slides))
print("rate-cover count:", html_out.count('class="rate-cover"'))
print("rate-chip count:", html_out.count('class="rate-chip'))
print("cloze count:", html_out.count('class="cloze"'))
print("practice-mcq count:", html_out.count('class="practice-mcq"'))
print("tfng-group count:", html_out.count('class="tfng-group"'))
print("Written index.html:", len(html_out), "bytes")
