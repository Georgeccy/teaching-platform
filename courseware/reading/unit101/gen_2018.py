#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Part 2: B1/B2 slides + shell assembly. Run gen_2018.py (imports part1)."""
from gen_part1 import (chip, mcq, sa, tfng_slide, cloze, flip_grid, sig, slide, split,
                       P, T2, T3, T4, T5, T6, slides)

# ================= 12. Part B1 divider =================
div_b1 = ('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">'
          '<div class="class-badge" style="font-size:20px;padding:14px 36px;margin-bottom:24px">Part B1</div>'
          '<div class="slide-h1" style="text-align:center">Easier Section</div>'
          '<div class="slide-h3" style="text-align:center;color:var(--text-2);margin-top:12px">Text 3–4 · Q23–Q45 · 42 marks</div>'
          '<p style="text-align:center;font-size:20px;margin-top:20px;color:var(--text-2);max-width:600px">'
          'A Guide to Bee Stings + HK\'s First Urban Beekeeper — 阅读重点：信息定位 · 判断题 T/F/NG · '
          '流程图/表格填空。2018 年 B1 平均得分率约 47.9%（选考人数 43.9%）。</p></div>')
slides.append(slide("Part B1", "divider", "Part B1", div_b1))

# ================= 13. B1 Entry Test =================
b1_entry_cards = [
    ("hive", "蜂巢；蜂箱"),
    ("sting (n.)", "螫刺；毒针"),
    ("venom / poison", "毒液"),
    ("swelling", "肿胀"),
    ("tweezers", "镊子"),
    ("compress", "敷布；冷敷"),
    ("pharmacist", "药剂师"),
    ("allergy / allergic", "过敏"),
    ("urban", "城市的"),
    ("awareness", "意识；认知"),
]
body = ('<div class="sec-label">Part B1 · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">核心名词 Nouns — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 3–4 Bees · 10 words · 每题 1 分</div>'
        + flip_grid(b1_entry_cards))
slides.append(slide("Part B1 Entry Test", "entry-test", "Part B1", body))

# ================= 14. Q23–Q26 · Text 3 ¶1–4 =================
left = ('<h4>Text 3: A Guide to Bee Stings (¶1–4)</h4>'
        '<div class="passage-excerpt"><div class="para-num">Title</div>Have you ever been stung by a bee? '
        'Don\'t panic! Here\'s what to do.</div>\n' + P(T3, [1, 2, 3, 4]))

q23 = sa("q23", "Q23 · Fill in the blank · 1 mark", chip(69),
         "Complete the following sentence using the information in paragraph 1:<br>"
         "Bees are useful because they help with ______.",
         '<p><strong>producing honey // (and) pollinating flowers (to produce fruit) // pollination // producing fruit</strong></p>'
         '<p>&#182;1 首句 "Bees are known for their role in producing honey and pollinating flowers to produce fruit."</p>')

q24 = mcq("q24", "Q24 · MC · 1 mark", chip(93),
          "According to paragraph 1, which type of bee is <strong>NOT</strong> found in Hong Kong?",
          [("A", "Honey bee", False, "&#182;1 提到香港有 honey bees。"),
           ("B", "Carpenter bee", False, "&#182;1 提到香港有 carpenter bees。"),
           ("C", "Africanised honey bee", True, "")],
          "🔑 &#182;1 结尾 \"Fortunately they haven't been spotted in Hong Kong yet\" — they = Africanised honey bees。")

q25 = tfng_slide("q25", "Q25 · T / F / NG · 4 marks",
                 "According to paragraph 1, are the following statements True (T), False (F) or Not Given (NG)?",
                 [("(i)", "Honey bees in Hong Kong are unlikely to sting.", "T",
                   "&#182;1 seldom sting unless they are provoked。", 55),
                  ("(ii)", "Bees are more dangerous than wasps.", "F",
                   "&#182;1 Bees are considered less dangerous than wasps — 反了。", 80),
                  ("(iii)", "Bees prefer to build hives near people's homes.", "NG",
                   "原文只说 bees become a threat when they build hives near homes，没说它们偏好如此。", 49),
                  ("(iv)", "Africanised honey bees are more likely than other bees to attack humans.", "T",
                   "aggressive species... will sting humans。", 69)])

q26 = ('<div class="practice-mcq" id="q26-box"><div class="pmcq-label">Q26 · Table cloze · 5 marks '
       + chip([("(i)", 52), ("(ii)", 64), ("(iii)", 68), ("(iv)", 52), ("(v)", 40)]) + '</div>'
       '<div class="pmcq-q">Complete the table comparing insect stings and bites (paragraphs 2–4). '
       'Use <strong>ONE word</strong> for each blank.</div>'
       '<table class="quiz-table"><tr><th></th><th>an insect STING</th><th>an insect BITE</th></tr>'
       '<tr><td><strong>Reason</strong></td><td>A form of defence</td>'
       '<td>Able to draw blood in order to (i) ' + cloze("feed") + '</td></tr>'
       '<tr><td><strong>Speed of reaction</strong></td><td>The victim will feel an (ii) '
       + cloze("immediate") + ' effect</td><td>The victim will feel it several (iii) '
       + cloze("minutes") + ' later</td></tr>'
       '<tr><td><strong>Reaction</strong></td><td>The victim will experience a (iv) '
       + cloze("sharp / burning") + ' feeling</td><td>The victim will experience less (v) '
       + cloze("pain") + '</td></tr></table>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 &#182;3 "The effect is '
       'immediate and results in a sharp, burning sensation" · &#182;4 "bite to draw blood... to give such insects '
       'time to feed... pain is not as sharp as a sting and is usually felt only minutes later"。注意 (v) 填名词 '
       'pain（不是 painful）。</span></div></div>')

right = q23 + q24 + q25 + q26
body = ('<div class="sec-label">Part B1 · Text 3 · Q23–Q26</div>'
        '<div class="slide-h3">A Guide to Bee Stings — Sting vs Bite</div>'
        + split("Text 3 (¶1–4)", left, right))
slides.append(slide("Q23–Q26 · Text 3", "practice", "Part B1", body, "text3"))

# ================= 15. Q27–Q30 · ¶5–7 =================
left = '<h4>Text 3: A Guide to Bee Stings (¶5–7)</h4>' + P(T3, [5, 6, 7])

q27 = ('<div class="practice-mcq" id="q27-box"><div class="pmcq-label">Q27 · Flowchart cloze · 4 marks '
       + chip([("(i)", 35), ("(ii)", 37), ("(iii)", 84), ("(iv)", 46)]) + '</div>'
       '<div class="pmcq-q">Complete the flowchart of what happens after a bee stings (paragraphs 5–7).</div>'
       '<table class="quiz-table"><tr><th>Step</th><th>What happens</th></tr>'
       '<tr><td>1</td><td>The bee is provoked, e.g. when the bee is ' + cloze("stood on // sat on") + '</td></tr>'
       '<tr><td>2</td><td>The ' + cloze("stinger // (venomous) sac") + ' containing poison is left behind</td></tr>'
       '<tr><td>3</td><td>The skin surrounding the sting will quickly ' + cloze("redden // swell // redden and swell") + '</td></tr>'
       '<tr><td>4</td><td>The next day the skin will possibly continue to be ' + cloze("itchy") + '</td></tr></table>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 (iii) 高分因为原文和流程图都有 '
       'quickly；其余空需要 paraphrase 定位：&#182;6 "leaves its stinger lodged inside the skin" · &#182;7 '
       '"remain itchy for more than a day"。典型错误：(ii) 填 stinger lodged 重复了流程图已有信息。</span></div></div>')

q28 = sa("q28", "Q28 · Find a word · 1 mark", chip(33),
         "Find a word in paragraph 6 that has a similar meaning to <strong>'most important'</strong>.",
         '<p><strong>key</strong></p>'
         '<p>&#182;6 "The <em>key</em> sign of a bee sting is that the bee leaves its stinger..." — '
         'key = 最关键的。别被长难词吸引。</p>')

q29 = sa("q29", "Q29 · Paragraph locating · 1 mark", chip(45),
         "Which paragraph describes how a wasp sting looks different from a bee sting?",
         '<p><strong>Paragraph 6</strong></p>'
         '<p>&#182;6 结尾对比：bee sting 螫针留在皮肤内 vs wasp sting 只有一个小刺孔（puncture hole）。</p>')

q30 = sa("q30", "Q30 · Reference · 1 mark", chip(69),
         "What does <strong>'it'</strong> (line 22) refer to?",
         '<p><strong>the swelling // the sting // the area around the sting</strong></p>'
         '<p>&#182;7 "The swelling will reduce after a few hours, but <em>it</em> may remain itchy for more than '
         'a day" — it = the swelling（仍会痒的是肿胀处）。</p>')

right = q27 + q28 + q29 + q30
body = ('<div class="sec-label">Part B1 · Text 3 · Q27–Q30</div>'
        '<div class="slide-h3">What Happens After a Sting</div>'
        + split("Text 3 (¶5–7)", left, right))
slides.append(slide("Q27–Q30 · Text 3", "practice", "Part B1", body, "text3"))

# ================= 16. Q31–Q34 · ¶8–15 =================
left = '<h4>Text 3: A Guide to Bee Stings (¶8–15)</h4>' + P(T3, [8, 9, 10, 11, 12, 13, 14, 15])

q31 = mcq("q31", "Q31 · MC · 1 mark", chip(46),
          "According to paragraphs 8–12, which of the following actions should <strong>NOT</strong> be taken to "
          "relieve the symptoms of a bee sting?",
          [("A", "Removing the stinger quickly.", False, "&#182;9 建议及时拔除螫针。"),
           ("B", "Applying an anti-histamine cream.", False, "&#182;11 建议涂抹。"),
           ("C", "Putting ice straight on the swelling.", True, ""),
           ("D", "Using calamine lotion on the wound.", False, "&#182;12 建议使用炉甘石洗液。")],
          "🔑 &#182;10 (but never hold ice directly on the skin) — never = NOT be taken。NOT 题要找否定指令。")

q32 = sa("q32", "Q32 · Short answer · 2 marks", chip(43),
         "According to paragraph 9, why should you be careful when removing the stinger?",
         '<p><strong>not to squeeze the sting sac // not to inject (more) poison (into the wound)</strong></p>'
         '<p>&#182;9 "take great care not to squeeze the sting sac as this will inject more poison into the wound" — '
         '问为何小心，答原因（别挤毒囊），不是照抄拔针方法。</p>')

q33 = sa("q33", "Q33 · Short answer · 2 marks", chip(32),
         "According to paragraphs 13–15, what evidence does the writer provide to suggest that anaphylactic shock "
         "is uncommon?",
         '<p><strong>3% of the population who are allergic (to stings) / at risk</strong></p>'
         '<p>&#182;14 "the people at risk are the <em>three percent</em> of the population who are allergic" — '
         '找 evidence（数字证据），不是抄过敏性休克的定义。</p>')

q34 = sa("q34", "Q34 · Short answer · 2 marks", chip(23),
         "Why does the writer suggest calling an ambulance if someone has a severe reaction to an insect sting?",
         '<p><strong>He / she may die / may have anaphylactic shock / needs immediate medical treatment // '
         'may have serious medical conditions</strong></p>'
         '<p>&#182;13 "a serious medical condition that requires immediate medical assistance and can even cause '
         'death" — 问为何叫救护车，答严重后果，不是照抄被螫的原因。</p>')

right = q31 + q32 + q33 + q34
body = ('<div class="sec-label">Part B1 · Text 3 · Q31–Q34</div>'
        '<div class="slide-h3">Treatments &amp; Allergies — Why-questions</div>'
        + split("Text 3 (¶8–15)", left, right))
slides.append(slide("Q31–Q34 · Text 3", "practice", "Part B1", body, "text3"))

# ================= 17. Q35–Q37 · Text 4 ¶1–4 =================
left = '<h4>Text 4: Hong Kong\'s First Urban Beekeeper (¶1–4)</h4>' + P(T4, [1, 2, 3, 4])

q35 = mcq("q35", "Q35 · MC · 1 mark", chip(41),
          "What does <strong>'one beehive at a time'</strong> (line 2) imply?",
          [("A", "Keeping bees on rooftops is inappropriate.", False, "与文章态度相反。"),
           ("B", "Using only one beehive is an effective method.", False, "不是讲方法有效性。"),
           ("C", "Bringing nature back into the city is a slow process.", True, ""),
           ("D", "Producing a unique local beehive is an important goal.", False, "无此意。")],
          "🔑 one...at a time = 一个一个来 → 渐进缓慢的过程。呼应 bringing nature back into the city。")

q36 = ('<div class="practice-mcq" id="q36-box"><div class="pmcq-label">Q36 · Summary cloze · 4 marks '
       + chip([("(i)", 23), ("(ii)", 15), ("(iii)", 26), ("(iv)", 41)]) + '</div>'
       '<div class="pmcq-q">Complete the summary about Michael Leung and HK Honey (paragraph 2). Click each blank '
       'to check.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'He set up HK Honey and is also its (i) ' + cloze("creative director") + '. HK Honey links Hongkongers with '
       '(ii) ' + cloze("(local) beekeepers") + ' through the products from its bees. HK Honey\'s priorities are to '
       'maintain (iii) ' + cloze("bee population(s)") + ' ...and to increase people\'s (iv) '
       + cloze("awareness") + ' of the importance of bees.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 摘要已把 founder 转述为 '
       'He set up HK Honey，所以 (i) 只填 creative director（最大坑：重复照抄）。(ii)–(iii) 原文 links local '
       'beekeepers with city dwellers · help sustain bee populations。</span></div></div>')

q37a = mcq("q37i", "Q37(i) · MC · 1 mark", chip(43),
           "When did <strong>beekeeping start in Hong Kong</strong> (in the outlying areas)?",
           [("A", "2010", False, "2010 是 Leung 认识 Mr Yip / 创办 HK Honey。"),
            ("B", "The 1980s", False, "1980s 是 Mr Yip 在沙田开蜂场。"),
            ("C", "Not stated", True, "")],
           "🔑 &#182;3 只说 beekeeping has been around... for some time — 没给具体时间。")
q37b = mcq("q37ii", "Q37(ii) · MC · 1 mark", chip(63),
           "When was <strong>HK Honey founded</strong>?",
           [("A", "2010", True, ""),
            ("B", "The 1980s", False, "这是 Mr Yip 的蜂场。"),
            ("C", "Not stated", False, "&#182;4 met in early 2010... by that summer。")])
q37c = mcq("q37iii", "Q37(iii) · MC · 1 mark", chip(81),
           "When did <strong>Mr Yip start his bee farm in Shatin</strong>?",
           [("A", "2010", False, "2010 是两人相识。"),
            ("B", "The 1980s", True, ""),
            ("C", "Not stated", False, "&#182;3 since the 1980's。")])
q37d = mcq("q37iv", "Q37(iv) · MC · 1 mark", chip(52),
           "When did <strong>Mr Leung become a product designer</strong>?",
           [("A", "2010", False, "2010 与职业无关。"),
            ("B", "The 1980s", False, "与 Mr Yip 有关。"),
            ("C", "Not stated", True, "")],
           "🔑 &#182;1 只说他 a local product designer，没说何时成为。Not stated 陷阱题。")

right = q35 + q36 + q37a + q37b + q37c + q37d
body = ('<div class="sec-label">Part B1 · Text 4 · Q35–Q37</div>'
        '<div class="slide-h3">HK Honey — Rooftop Beekeeping Begins</div>'
        + split("Text 4 (¶1–4)", left, right))
slides.append(slide("Q35–Q37 · Text 4", "practice", "Part B1", body, "text4"))

# ================= 18. Q38–Q40 · ¶3–6 =================
left = '<h4>Text 4: Hong Kong\'s First Urban Beekeeper (¶3–6)</h4>' + P(T4, [3, 4, 5, 6])

q38 = sa("q38", "Q38 · Reference · 1 mark", chip(69),
         "Who/What does <strong>'they'</strong> (line 10) refer to?",
         '<p><strong>(Mr Michael) Leung and (Mr) Yip</strong></p>'
         '<p>&#182;4 首句 "After <em>they</em> met in early 2010" — they = 上文的 Leung 和 Mr Yip 两人。</p>')

q39 = tfng_slide("q39", "Q39 · T / F / NG · 3 marks",
                 "According to paragraph 4, are the following statements about HK Honey True (T), False (F) or Not Given (NG)?",
                 [("(i)", "arranges visits to rooftop beehives.", "T",
                   "&#182;4 organises tours on urban beekeeping。", 51),
                  ("(ii)", "sells cakes online.", "F",
                   "honey cakes are only available during their workshops — 网店不卖蛋糕。", 63),
                  ("(iii)", "runs workshops monthly.", "NG",
                   "原文没说频率（monthly）。", 60)])

q40 = sa("q40", "Q40 · Short answer · 2 marks", chip(33),
         "According to paragraphs 5–6, what are the <strong>TWO</strong> differences between western and Chinese "
         "beekeeping methods?",
         '<p><strong>(i)</strong> Chinese beekeepers use / wear no protective clothing / gloves and head nets but '
         'western beekeepers wear protective clothing <span style="color:var(--text-3)">' + chip(33) + '</span></p>'
         '<p><strong>(ii)</strong> Chinese beekeepers keep a wide range of bee species but western beekeepers keep '
         'a single species <span style="color:var(--text-3)">' + chip(27) + '</span></p>'
         '<p>&#182;6 "a wide range of bee species... unlike in the west where commercial beekeepers usually rely on '
         'a single species" · "the Chinese approach uses no protective clothing &ndash; no gloves and no head nets"。'
         '注意：答案必须包含<strong>两端对比</strong>，只写一边不得全分。</p>')

right = q38 + q39 + q40
body = ('<div class="sec-label">Part B1 · Text 4 · Q38–Q40</div>'
        '<div class="slide-h3">East vs West — Two Ways of Beekeeping</div>'
        + split("Text 4 (¶3–6)", left, right))
slides.append(slide("Q38–Q40 · Text 4", "practice", "Part B1", body, "text4"))

# ================= 19. Q41–Q45 · ¶7–8 =================
left = '<h4>Text 4: Hong Kong\'s First Urban Beekeeper (¶7–8)</h4>' + P(T4, [7, 8])

q41 = sa("q41", "Q41 · Reference · 1 mark", chip(40),
         "Who/What does <strong>'they'</strong> (line 23) refer to?",
         '<p><strong>(the) bees</strong></p>'
         '<p>&#182;7 "Surprisingly and fortunately <em>they</em> did sustain themselves in the city, and continue to '
         'amaze him with each new location" — they = 上句的 bees。别被 Leung 迷惑。</p>')

q42 = sa("q42", "Q42 · Short answer · 2 marks", chip(17),
         "Why is Leung continually surprised by the bees in the beehives he sets up?",
         '<p><strong>bees sustain themselves in (Hong Kong\'s) urban environment / in different locations</strong></p>'
         '<p>&#182;7 "Leung wasn\'t 100% sure if bees could sustain themselves in Hong Kong\'s urban environment. '
         'Surprisingly and fortunately they did sustain themselves in the city..." — 两个要素：sustain themselves '
         '+ urban environment，缺一不可。</p>')

q43 = sa("q43", "Q43 · Short answer · 2 marks", chip(37),
         "Find <strong>ONE</strong> factor in paragraph 7 that makes Hong Kong honey <strong>'priceless'</strong> (line 26).",
         '<p><strong>(It / the honey in Hong Kong is) an eclectic mix of wild / seasonal flowers // '
         'hard work that has gone into producing it / the honey</strong></p>'
         '<p>&#182;7 "The honey in Hong Kong is an <em>eclectic mix</em> of wild and seasonal flowers" · '
         '"we also taste all the <em>hard work</em> that has gone into producing it" — 任选其一。</p>')

q44 = sa("q44", "Q44 · Find a word · 1 mark", chip(7),
         "Find a word in paragraph 8 which means <strong>'highly motivated'</strong>.",
         '<p><strong>driven</strong></p>'
         '<p>&#182;8 "Leung is a <em>driven</em> individual" — driven（有干劲的）≠ 开车。仅 7% 正确：'
         '一词多义是 B1 最大陷阱。</p>')

q45 = mcq("q45", "Q45 · MC · 1 mark", chip(39),
          "Which of the following is the <strong>best alternative title</strong> for this article?",
          [("A", "Nature comes to the city", True, ""),
           ("B", "How to keep bees in the city", False, "文章不是操作指南。"),
           ("C", "HK Honey is the best in the city", False, "没有比较蜂蜜优劣。"),
           ("D", "Declining bee population affects the city", False, "只是 &#182;2 提到的背景细节。")],
          "🔑 标题题看主旨：&#182;1 bringing nature back into the city, one beehive at a time — A。")

right = q41 + q42 + q43 + q44 + q45
body = ('<div class="sec-label">Part B1 · Text 4 · Q41–Q45</div>'
        '<div class="slide-h3">Priceless Honey — Ending with a Title</div>'
        + split("Text 4 (¶7–8)", left, right))
slides.append(slide("Q41–Q45 · Text 4", "practice", "Part B1", body, "text4"))

# ================= 20. B1 Close Reading =================
cr = ('<div class="sec-label">Part B1 · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;1 (Text 3): Bees... can however ' + sig("become a threat", "构成威胁") + ' to people... '
      'honey bees and carpenter bees ' + sig("seldom sting unless they are provoked", "很少螫人除非被激怒") + '. '
      'Fortunately they ' + sig("haven't been spotted", "尚未被发现") + ' in Hong Kong yet.</p>'
      '<p style="margin-top:14px">&#182;2: Insect stings ' + sig("should not be confused with", "不应与……混淆") +
      ' insect bites.</p>'
      '<p style="margin-top:14px">&#182;6: The ' + sig("key sign", "关键特征") + ' of a bee sting is that the bee '
      'leaves its stinger ' + sig("lodged", "卡在；留在") + ' inside the skin... In contrast, the only sign of a wasp '
      'sting is likely to be a small ' + sig("puncture hole", "刺孔") + '.</p>'
      '<p style="margin-top:14px">&#182;9: This should be done carefully... ' + sig("take great care not to", "千万注意不要") +
      ' squeeze the sting sac.</p>'
      '<p style="margin-top:14px">&#182;1 (Text 4): ...bringing nature back into the city, '
      + sig("one beehive at a time", "一次一个蜂箱（循序渐进）") + '.</p>'
      '<p style="margin-top:14px">&#182;4: ...uniting Hong Kong urban beekeepers '
      + sig("from all walks of life", "来自各行各业") + '.</p>'
      '<p style="margin-top:14px">&#182;6: ' + sig("In contrast to the west", "与西方相反") + ', the Chinese approach '
      'to beekeeping uses no protective clothing.</p>'
      '<p style="margin-top:14px">&#182;7: ' + sig("Surprisingly and fortunately", "令人惊讶又庆幸") + ' they did '
      + sig("sustain themselves", "自给自足地生存") + ' in the city... The honey is '
      + sig("priceless", "无价的") + '.</p>'
      '<p style="margin-top:14px">&#182;8: Leung is a ' + sig("driven", "有干劲的") + ' individual and is also '
      + sig("channelling his energies into", "将精力投入") + ' similar projects.</p></div>')
slides.append(slide("Part B1 · Close Reading", "close-reading", "Part B1", cr))

# ================= 21. B1 Exit Test =================
b1_exit_cards = [
    ("provoke", "激怒；惹怒"),
    ("be confused with", "与……混淆"),
    ("draw blood", "吸血"),
    ("lodge (in the skin)", "卡在（皮肤里）"),
    ("pump (poison)", "泵入（毒液）"),
    ("relieve (itching)", "缓解（瘙痒）"),
    ("consult (a pharmacist)", "咨询（药剂师）"),
    ("sustain (bee populations)", "维持（蜜蜂数量）"),
    ("channel energies into", "把精力投入到"),
    ("be adapted to", "适应……"),
]
body = ('<div class="sec-label">Part B1 · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">动词短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 3–4 Bees · 10 items · 每题 1 分</div>'
        + flip_grid(b1_exit_cards))
slides.append(slide("Part B1 Exit Test", "exit-test", "Part B1", body))

# ================= 22. B1 Recap =================
recap = ('<div class="sec-label">Part B1 · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part B1 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 3 = <strong>实用指南（guide/leaflet）</strong>；Text 4 = <strong>人物特写（profile）</strong>。'
         'B1 拿分关键：定位快 + 填空准。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>填空题查词性、查重复（Q27/Q36/Q37）；why-题答原因不答方法（Q32/Q34)；'
         '一词多义 driven≠开车（Q44）；Not stated/NG 不代表错误（Q37i/Q39iii）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128202; 2018 隐形数据 — 击碎砖块看 B1 最难题</h4>'
         '<p>Q44 driven ' + chip(7) + ' · Q36(ii) beekeepers ' + chip(15) + ' · Q42 城市生存 ' + chip(17) + ' · '
         'Q36(iii) bee populations ' + chip(26) + ' · Q34 ambulance ' + chip(23) + ' · '
         'Q36(i) creative director ' + chip(23) + ' — 照抄过多 + 要素不全是两大失分原因。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128273; 金句</h4>'
         '<p>两要素题（Q40/Q42）：写完检查是否两端都答了；摘要填空先读空格前后判词性。</p></div>')
slides.append(slide("Part B1 · Recap", "exit-test", "Part B1", recap))

# ================= 23. Part B2 divider =================
div_b2 = ('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">'
          '<div class="class-badge" style="font-size:20px;padding:14px 36px;margin-bottom:24px">Part B2</div>'
          '<div class="slide-h1" style="text-align:center">Harder Section</div>'
          '<div class="slide-h3" style="text-align:center;color:var(--text-2);margin-top:12px">Text 5–6 · Q46–Q71 · 42 marks</div>'
          '<p style="text-align:center;font-size:20px;margin-top:20px;color:var(--text-2);max-width:600px">'
          'Hand Pollination + Sweetness and Light — 阅读重点：短语深层含义 (implication) · 隐喻 (metaphor) · '
          '观点匹配。2018 年 B2 平均得分率约 52.5%（选考人数 56.1%）。</p></div>')
slides.append(slide("Part B2", "divider", "Part B2", div_b2))

# ================= 24. B2 Entry Test =================
b2_entry_cards = [
    ("pollination", "授粉"),
    ("blossom", "花朵；开花"),
    ("orchard", "果园"),
    ("conservation", "保护；环保"),
    ("moral (n.)", "寓意；教训"),
    ("diversity", "多样性"),
    ("apiarist", "养蜂人"),
    ("heather", "石南（植物）"),
    ("nectar", "花蜜"),
    ("hood", "风帽；头罩"),
]
body = ('<div class="sec-label">Part B2 · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">核心名词 Nouns — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 5–6 Pollination &amp; Honey · 10 words · 每题 1 分</div>'
        + flip_grid(b2_entry_cards))
slides.append(slide("Part B2 Entry Test", "entry-test", "Part B2", body))

# ================= 25. Q46–Q49 · Text 5 =================
left = '<h4>Text 5: Farmers Resort to Hand Pollination (full)</h4>' + P(T5, [1, 2, 3, 4, 5, 6])

q46 = sa("q46", "Q46 · Find a word · 1 mark", chip(67),
         "Which word in paragraph 1 does the writer use to suggest how bees move around flowers?",
         '<p><strong>dust</strong></p>'
         '<p>&#182;1 "Bees <em>dust</em> their way through blossoms, moving from flower to flower" — '
         'dust 作动词：沾满花粉地穿行。</p>')

q47 = sa("q47", "Q47 · Phrase meaning · 2 marks", chip(10),
         "What is the meaning of the phrase <strong>'hit blossom-time'</strong> (line 8)?",
         '<p><strong>when (apple) flowers blossom / ripen / open</strong></p>'
         '<p>&#182;2 "moving up the hillsides as each orchard <em>hit blossom-time</em>" — hit + 时间词 = 到达某一时 '
         '节（进入花期）。陷阱：过度纠结 hit 的字面意思（打）而答错。全卷第二难（10%）。</p>')

q48 = mcq("q48", "Q48 · MC · 2 marks", chip(66),
          "What is the <strong>'moral of this story'</strong> (line 11)? We should...",
          [("A", "look after bees.", True, ""),
           ("B", "pay more money to replace bees.", False, "这是后果，不是寓意。"),
           ("C", "listen to economists' opinions on bees.", False, "经济学家是后文反转角色。"),
           ("D", "stop bees from changing their behaviour.", False, "无此意。")],
          "🔑 &#182;2 the obvious conservation moral: this is what happens when we don't take care of the "
          "little creatures → look after bees。")

q49 = sa("q49", "Q49 · Short answer · 2 marks", chip(51),
         "Why does <strong>'the work'</strong> (line 10) become more expensive than before?",
         '<p><strong>(it was) free to have bees to pollinate (but now) humans (are) employed / paid to pollinate</strong></p>'
         '<p>&#182;2 "When they disappear, the work they did <em>for free</em> suddenly becomes expensive" — '
         '要点：蜜蜂原本免费 → 现在雇人付费。需要转述，不能照抄。</p>')

right = q46 + q47 + q48 + q49
body = ('<div class="sec-label">Part B2 · Text 5 · Q46–Q49</div>'
        '<div class="slide-h3">Hand Pollination — The Bee Story Begins</div>'
        + split("Text 5 (full text)", left, right))
slides.append(slide("Q46–Q49 · Text 5", "practice", "Part B2", body, "text5"))

# ================= 26. Q50–Q54 · Text 5 =================
left = '<h4>Text 5: Farmers Resort to Hand Pollination (full)</h4>' + P(T5, [1, 2, 3, 4, 5, 6])

q50 = sa("q50", "Q50 · Find a word · 1 mark", chip(74),
         "Find a word in paragraph 3 that can be replaced by <strong>'affected negatively'</strong>.",
         '<p><strong>hurt</strong></p>'
         '<p>&#182;3 "apple production was not <em>hurt</em> by the absence of bees"。</p>')

q51 = mcq("q51", "Q51 · MC · 2 marks", chip(50),
          "Why did the writer use the word <strong>'Woah!'</strong> (line 21)? The writer wants to...",
          [("A", "argue that a statement is incorrect.", False, "不是反驳，是停顿惊叹。"),
           ("B", "express happiness for a new discovery.", False, "并非高兴。"),
           ("C", "make an important argument more persuasive.", False, "不是加强说服力。"),
           ("D", "get the reader to stop and think about a surprising statement.", True, "")],
          "🔑 感叹语篇标记：Woah! 让读者停下来注意下面这个惊人（甚至荒谬）的观点。")

q52 = sa("q52", "Q52 · Word replacement · 1 mark", chip(40),
         "Suggest <strong>ONE</strong> word to replace <strong>'critters'</strong> (line 22).",
         '<p><strong>creatures // insects // bugs // animals</strong></p>'
         '<p>&#182;5 "there are some <em>critters</em> we humans don\'t really need to have around" — '
         'critters = 小生物（口语）。</p>')

q53 = ('<div class="practice-mcq" id="q53-box"><div class="pmcq-label">Q53 · Summary cloze · 5 marks '
       + chip([("(i)", 38), ("(ii)", 42), ("(iii)", 63), ("(iv)", 65), ("(v)", 48)]) + '</div>'
       '<div class="pmcq-q">Complete the summary of paragraphs 3–5. Use <strong>ONE word</strong> for each blank.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'After a decade of study, economists released a (i) ' + cloze("surprising / shocking / startling") +
       ' report: apple production increased despite the absence of bees. This was in spite of the (ii) '
       + cloze("disappearing / missing / absent") + ' bees. Human pollinators are better because they are able to '
       'access each (iii) ' + cloze("flower / blossom") + ', boosting productivity. Bees are less dependable, '
       'preferring warm and (iv) ' + cloze("dry / calm") + ' weather. The economists concluded we need not worry '
       'about the (v) ' + cloze("diversity / variety") + ' of life on Earth.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 &#182;3 a shocker... '
       '30 to 40 percent greater... better at getting to every blossom... could work in windy, rainy weather · '
       '&#182;4 They don\'t like working when it\'s wet → bees like warm &amp; dry · &#182;5 biological '
       'diversity。</span></div></div>')

q54 = sa("q54", "Q54 · Phrase meaning · 3 marks", chip(15),
         "What is <strong>'the logic of the market'</strong> that the writer refers to in line 28?",
         '<p><strong>allowing profits / money / market to control / decide conservation policies</strong></p>'
         '<p>&#182;6 "the danger of allowing the logic of the market to drive conservation policy" — 市场逻辑 = '
         '让利润/金钱决定环保决策（值不值钱就保不保护）。B2 最难题之一（15%）：需整段推理 + 转述。</p>')

right = q50 + q51 + q52 + q53 + q54
body = ('<div class="sec-label">Part B2 · Text 5 · Q50–Q54</div>'
        '<div class="slide-h3">The Economists\' Version — Story Turned on its Head</div>'
        + split("Text 5 (full text)", left, right))
slides.append(slide("Q50–Q54 · Text 5", "practice", "Part B2", body, "text5"))

# ================= 27. Q55–Q58 · Text 6 ¶1–2 =================
left = '<h4>Text 6: Sweetness and Light (¶1–2)</h4>' + P(T6, [1, 2])

q55 = sa("q55", "Q55 · Short answer · 2 marks", chip(31),
         "Why does Willie keep beehives on the heather moor?",
         '<p><strong>because heather honey (produced on the heather moor) is highly prized / the most prized in the '
         'world / unique // he wants to get heather honey</strong></p>'
         '<p>&#182;1 "Heather honey... is <em>one of the most prized in the world</em>" — 因为石南蜂蜜极其珍贵。</p>')

q56 = sa("q56", "Q56 · Short answer · 2 marks", chip(90),
         "According to paragraph 1, how is heather honey different from other honey?",
         '<p><strong>(unique) gel-like texture // fox-red // beaded with silver bubbles // room-filling fragrance</strong></p>'
         '<p>&#182;1 "with its unique <em>gel-like texture</em> and <em>room-filling fragrance</em>... it glows '
         '<em>fox-red</em>, often <em>beaded with little silver bubbles</em>" — 任答其一。</p>')

q57 = mcq("q57", "Q57 · MC · 2 marks", chip(65),
          "What does the writer mean when he writes, <strong>'Honey bees left alone do not sting'</strong> (line 6)?",
          [("A", "Bees leave intruders alone.", False, "leave alone 在此处不是放过入侵者。"),
           ("B", "Bees might not die when left alone.", False, "答非所问。"),
           ("C", "Bees don't sting without good reason.", True, ""),
           ("D", "Bees only sting when they want to die.", False, "过于字面。")],
          "🔑 left alone = 不受打扰时 → 螫人是有原因的（保护蜂巢），C。")

q58 = mcq("q58", "Q58 · MC · 2 marks", chip(50),
          "<strong>'Instead, the sting rips the centre from the bee's abdomen'</strong> (lines 8–9). "
          "The writer used the word <strong>'instead'</strong>, but instead of what?",
          [("A", "stinging an intruder.", False, ""),
           ("B", "digging into the skin.", False, ""),
           ("C", "pumping poison into human flesh.", False, ""),
           ("D", "withdrawing the sting from the skin.", True, "")],
          "🔑 前句 The barbed lancets dig into the skin, pump poison into human flesh, and then cannot "
          "<em>withdraw</em>. Instead, the sting rips... — instead of withdrawing（无法拔出，反而扯出内脏）。")

right = q55 + q56 + q57 + q58
body = ('<div class="sec-label">Part B2 · Text 6 · Q55–Q58</div>'
        '<div class="slide-h3">Sweetness and Light — The Price of a Sting</div>'
        + split("Text 6 (¶1–2)", left, right))
slides.append(slide("Q55–Q58 · Text 6 ¶1–2", "practice", "Part B2", body, "text6"))

# ================= 28. Q59–Q62 · ¶3–4 =================
left = '<h4>Text 6: Sweetness and Light (¶3–4)</h4>' + P(T6, [3, 4])

q59 = sa("q59", "Q59 · Short answer · 2 marks", chip(46),
         "Why does the writer compare Willie to <strong>'a spaceman'</strong> (line 14)?",
         '<p><strong>what Willie / he wears / the beekeeping suit looks like a spacesuit (covering the whole body) // '
         'in the suit he moves slowly / slow-mo (like a spaceman)</strong></p>'
         '<p>&#182;3 "In his suit, he walks around like a <em>spaceman</em>" — 防蜂服像宇航服（全包裹）+ 动作缓慢。</p>')

q60 = ('<div class="practice-mcq" id="q60-box"><div class="pmcq-label">Q60 · Summary cloze · 4 marks '
       + chip([("(i)", 86), ("(ii)", 35), ("(iii)", 40), ("(iv)", 70)]) + '</div>'
       '<div class="pmcq-q">Complete the summary of paragraph 3. Use <strong>ONE word</strong> for each blank.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'Beekeepers should protect their (i) ' + cloze("bodies / body / skin") + ' like a warrior wearing a suit of '
       'armour. Instead of a helmet, they wear a (ii) ' + cloze("hood") + ' along with something like a flying suit. '
       'The result of all this gear is that beekeepers are somewhat (iii) ' + cloze("restricted / limited") +
       ' in what they can do. However, this is not such a bad thing as they must not move too (iv) '
       + cloze("quickly / fast") + '.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 &#182;3 net-fronted '
       '<em>hood</em> · Boots and gloves <em>restrict</em> some movement（注意词形：restricted 不是 restrictive）· '
       'You go with a quiet tread → not move too quickly。</span></div></div>')

q61 = tfng_slide("q61", "Q61 · T / F / NG · 3 marks",
                 "According to paragraph 4, are the following statements True (T), False (F) or Not Given (NG)?",
                 [("(i)", "Smoke makes bees more likely to sting.", "F",
                   "&#182;4 The smoke can help lull the bees... become less aggressive。", 82),
                  ("(ii)", "As soon as Willie lifts the first box he knows how successful the harvest is.", "T",
                   "Immediately, its weight reveals the exact extent of the haul。", 72),
                  ("(iii)", "Willie and his family have always been successful with their honey harvest.", "F",
                   "Some years he gets nothing at all — 并非总是成功。", 69)])

q62 = sa("q62", "Q62 · Word meaning · 2 marks", chip(48),
         "What does <strong>'heaves'</strong> (line 22) suggest about the top box?",
         '<p><strong>(the top box is) heavy // the top box is full of / has a lot of honey</strong></p>'
         '<p>&#182;4 "he <em>heaves</em> off the top box. Immediately, its weight reveals the exact extent of the '
         'haul" — heave = 用力举起 → 暗示很重（装满蜂蜜）。</p>')

right = q59 + q60 + q61 + q62
body = ('<div class="sec-label">Part B2 · Text 6 · Q59–Q62</div>'
        '<div class="slide-h3">The Bee-suit &amp; The Harvest</div>'
        + split("Text 6 (¶3–4)", left, right))
slides.append(slide("Q59–Q62 · Text 6 ¶3–4", "practice", "Part B2", body, "text6"))

# ================= 29. Q63–Q67 · ¶4–5 =================
left = '<h4>Text 6: Sweetness and Light (¶4–5)</h4>' + P(T6, [4, 5])

q63 = sa("q63", "Q63 · Short answer · 2 marks", chip(43),
         "The writer believes <strong>'skill and luck'</strong> (line 25) contributed to Willie's success. "
         "What 'skill' and 'luck' is the writer referring to?",
         '<p><strong>Skill:</strong> keeping bees that are well adapted to the environment // keeping bees for many / '
         'over 50 years // knowledge about his bees / beekeeping <span style="color:var(--text-3)">' + chip(43) + '</span></p>'
         '<p><strong>Luck:</strong> (suitable) / (good) weather (was good) <span style="color:var(--text-3)">'
         + chip(53) + '</span></p>'
         '<p>&#182;4 "both skill and luck came together... the weather was good over the year (luck)... reaping the '
         'rewards of knowing his turf and keeping bees that are well adapted to their environment (skill)"。</p>')

q64 = sa("q64", "Q64 · Short answer · 2 marks", chip(42),
         "Why does the writer describe the harvesting of honey from beehives as a <strong>'drama'</strong> (line 30)?",
         '<p><strong>the harvest is unpredictable / not the same every year / uncertain / has ups and downs</strong></p>'
         '<p>&#182;4 结尾 "some years you get next-to-nothing, in others you crop gold... Some years he gets nothing '
         'at all... Such is the drama of harvest" — 关键是<strong>不可预测性</strong>，不是戏剧有很多角色。</p>')

q65 = sa("q65", "Q65 · Reference · 1 mark", chip(26),
         "What does <strong>'it'</strong> (line 34) refer to?",
         '<p><strong>(the) sting</strong></p>'
         '<p>&#182;5 "When a bee stings, a banana-like odour spreads in the air, attracting others to sting the same '
         'spot" — 语境中的 it = the sting（螫刺/螫伤处）。</p>')

q66 = sa("q66", "Q66 · Phrase meaning · 1 mark", chip(53),
         "What is the writer referring to when he says <strong>'the beekeeper's second skin'</strong> (lines 34–35)?",
         '<p><strong>(the) bee suit // (the) armour of the apiarist // (the) protective clothes</strong></p>'
         '<p>&#182;5 "they seek the vulnerable chink in the beekeeper\'s <em>second skin</em>" — second skin = '
         '防蜂服（像第二层皮肤一样包裹全身）。隐喻题：找上文的本体。</p>')

q67 = sa("q67", "Q67 · Comparison · 1 mark", chip(72),
         "Find <strong>ONE</strong> thing the writer compares <strong>'beekeepers'</strong> to in paragraph 5.",
         '<p><strong>(an attacking) bear // characters in video game</strong></p>'
         '<p>&#182;5 "Bees in the wild can burrow into the fur of an attacking <em>bear</em>" · "You feel like a '
         '<em>character within a video game</em>" — 蜜蜂的攻击对象被比作熊/游戏角色（即养蜂人）。</p>')

right = q63 + q64 + q65 + q66 + q67
body = ('<div class="sec-label">Part B2 · Text 6 · Q63–Q67</div>'
        '<div class="slide-h3">Skill, Luck &amp; Drama — Metaphors</div>'
        + split("Text 6 (¶4–5)", left, right))
slides.append(slide("Q63–Q67 · Text 6 ¶4–5", "practice", "Part B2", body, "text6"))

# ================= 30. Q68–Q71 · ¶5–6 =================
left = '<h4>Text 6: Sweetness and Light (¶5–6)</h4>' + P(T6, [5, 6])

q68 = sa("q68", "Q68 · Metaphor · 1 mark", chip(70),
         "Find <strong>ONE</strong> metaphor for <strong>'bees'</strong> the writer uses in paragraph 5.",
         '<p><strong>(aggressive) atoms // flying attackers // sharks</strong></p>'
         '<p>&#182;5 "Zinging, small, aggressive <em>atoms</em>" · "surrounded by <em>flying attackers</em>" · '
         '"like <em>sharks</em> drawn to blood" — 三个隐喻任选其一。</p>')

q69 = sa("q69", "Q69 · Short answer · 2 marks", chip(24),
         "Why is <strong>'a stray stitch'</strong> (line 35) a problem for a beekeeper?",
         '<p><strong>bees can get / find a place / go through the hole to attack the beekeeper // '
         'bees can attack / sting through a stray stitch</strong></p>'
         '<p>&#182;5 "A hole in the finger-tip of a glove, a stray stitch on the seam, will not go unpunished" — '
         '要转述：蜜蜂会钻过缝隙螫人。照抄 seek the vulnerable chink 在问题语境中不通。</p>')

q70 = ('<div class="practice-mcq" id="q70-box"><div class="pmcq-label">Q70 · Summary cloze · 2 marks '
       + chip([("(i)", 72), ("(ii)", 65)]) + '</div>'
       '<div class="pmcq-q">Complete the summary of paragraph 6. Use <strong>ONE word</strong> for each blank.</div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'Some beekeepers are (i) ' + cloze("careless / reckless") + ' when handling bees. Willie feels that bees are '
       'more (ii) ' + cloze("important / precious / valuable") + ' than the honey itself.</div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 &#182;6 lose bees by '
       '<em>carelessly</em> crushing them · bees <em>matter</em> more than honey → important/precious/valuable。'
       '</span></div></div>')

q71 = ('<div class="practice-mcq" id="q71-box"><div class="pmcq-label">Q71 · Matching · 6 marks '
       + chip([("(i)", 49), ("(ii)", 20), ("(iii)", 68), ("(iv)", 35), ("(v)", 79), ("(vi)", 20)]) + '</div>'
       '<div class="pmcq-q">Drag each person (A–F) to the comment they would most likely make. '
       'Each letter is used ONCE; one comment matches <strong>F. Not Applicable</strong>.</div>'
       '<div class="word-pool" id="q71-pool" style="margin-bottom:10px">'
       '<div class="draggable" draggable="true" data-word="q71-a" data-cat="a">A. Apple farm owner</div>'
       '<div class="draggable" draggable="true" data-word="q71-b" data-cat="b">B. Hand pollinator</div>'
       '<div class="draggable" draggable="true" data-word="q71-c" data-cat="c">C. Economist</div>'
       '<div class="draggable" draggable="true" data-word="q71-d" data-cat="d">D. Willie Robson</div>'
       '<div class="draggable" draggable="true" data-word="q71-e" data-cat="e">E. Conservationist</div>'
       '<div class="draggable" draggable="true" data-word="q71-f" data-cat="f">F. Not Applicable</div></div>'
       '<div class="tb-wrap"><table class="match-grid"><tr><th>Comment</th><th style="width:150px">Person</th></tr>'
       '<tr><td><strong>(i)</strong> Stings are just an occupational hazard.</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="d"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>(ii)</strong> The bees always arrive in time to pollinate our apple farms.</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="f"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>(iii)</strong> The bees themselves are irreplaceable and they are part of a bigger picture.</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="e"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>(iv)</strong> It\'s exhausting and the pay is not really that good. Some days I get home soaked to the skin.</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="b"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>(v)</strong> Hand pollination in Maoxian county is all about the numbers. Perhaps the world doesn\'t need bees any more.</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="c"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>(vi)</strong> Our window is so short that there are only five days before the blossoms drop, so we need all our available hands on deck.</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="a"><div class="drop-content"></div></div></td></tr>'
       '</table></div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkMatch(\'q71\',6)">Check</button>'
       '<button class="reveal-btn" onclick="resetMatch(\'q71\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q71-ans\')" style="background:var(--fcc-blue-dark)">Show Answers</button></div>'
       '<div class="ans-reveal" id="q71-result"></div>'
       '<div class="ans-reveal" id="q71-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>(i) D Willie Robson</strong> — 螫伤只是职业风险（养蜂人的日常） · '
       '<strong>(ii) F Not Applicable</strong> — 蜜蜂已经消失了，没人会说蜜蜂总会准时来 · '
       '<strong>(iii) E Conservationist</strong> — 蜜蜂无可替代、属于更大的图景 · '
       '<strong>(iv) B Hand pollinator</strong> — 又累工资又低、浑身湿透（风雨中工作） · '
       '<strong>(v) C Economist</strong> — 一切看数字，世界也许不再需要蜜蜂 · '
       '<strong>(vi) A Apple farm owner</strong> — 花期只有五天，需要所有人手。</p></div>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 匹配题用语言印记：'
       'occupational hazard → 职业（养蜂） · soaked to the skin 呼应 ¶3 风雨工作 · all about the numbers 呼应经济学家 · '
       'five days before the blossoms drop 呼应花期。F 是与全文相反的干扰项。</span></div></div>')

right = q68 + q69 + q70 + q71
body = ('<div class="sec-label">Part B2 · Text 6 · Q68–Q71</div>'
        '<div class="slide-h3">Final Boss — Metaphors &amp; Voice Matching</div>'
        + split("Text 6 (¶5–6)", left, right))
slides.append(slide("Q68–Q71 · Text 6 ¶5–6", "practice", "Part B2", body, "text6"))

# ================= 31. B2 Close Reading =================
cr = ('<div class="sec-label">Part B2 · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;1 (Text 5): Bees ' + sig("dust their way through blossoms", "沾着花粉穿行花丛") + '... So they decided '
      + sig("to replace bees with humans", "用人类代替蜜蜂") + '.</p>'
      '<p style="margin-top:14px">&#182;2: ...as each orchard ' + sig("hit blossom-time", "进入花期") + '... '
      'When they disappear, the work they did for free ' + sig("suddenly becomes expensive", "突然变得昂贵") + '.</p>'
      '<p style="margin-top:14px">&#182;4: The economists seemed to ' + sig("turn the moral of this story on its head", "彻底颠覆寓意") + '.</p>'
      '<p style="margin-top:14px">&#182;5: ' + sig("Woah!", "哇！（让读者停下来思考）") + ' Well, you can imagine what the '
      'biologists must have thought... So let\'s not ' + sig("get hung up on", "过于纠结") + ' biological diversity.</p>'
      '<p style="margin-top:14px">&#182;6: ...the danger of allowing ' + sig("the logic of the market", "市场逻辑") +
      ' to drive conservation policy.</p>'
      '<p style="margin-top:14px">&#182;2 (Text 6): ...the sting ' + sig("rips the centre from", "扯出……的中心") +
      ' the bee\'s abdomen.</p>'
      '<p style="margin-top:14px">&#182;3: It\'s a matter of ' + sig("weighing up the form", "审时度势") + '. If trouble '
      'starts, you ' + sig("bail out", "赶紧撤退") + '.</p>'
      '<p style="margin-top:14px">&#182;4: The smoke can help ' + sig("lull the bees", "安抚蜜蜂") + '... both '
      + sig("skill and luck came together", "技术与运气兼备") + '... Such is the ' + sig("drama of harvest", "收获的戏剧性") + '.</p>'
      '<p style="margin-top:14px">&#182;5: The bees... go ' + sig("purposefully berserk", "有目的地发狂") + '... they '
      + sig("undermine your confidence", "削弱你的信心") + ' and go ' + sig("dab, dab, dab", "一下一下地螫") + '.</p>'
      '<p style="margin-top:14px">&#182;6: Man makes use of bees but only by ' + sig("respecting their nature", "尊重它们的本性") + '.</p></div>')
slides.append(slide("Part B2 · Close Reading", "close-reading", "Part B2", cr))

# ================= 32. B2 Exit Test =================
b2_exit_cards = [
    ("resort to", "诉诸；求助于"),
    ("take a second look", "重新审视"),
    ("turn...on its head", "彻底颠覆……"),
    ("get hung up on", "纠结于；放不下"),
    ("kit up", "装备整齐"),
    ("lull (the bees)", "安抚；哄"),
    ("go berserk", "发狂"),
    ("bail out", "撤退；撤离"),
    ("reap the rewards", "收获回报"),
    ("beaded with", "点缀着……"),
]
body = ('<div class="sec-label">Part B2 · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">动词短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 5–6 Pollination &amp; Honey · 10 items · 每题 1 分</div>'
        + flip_grid(b2_exit_cards))
slides.append(slide("Part B2 Exit Test", "exit-test", "Part B2", body))

# ================= 33. B2 Recap =================
recap = ('<div class="sec-label">Part B2 · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part B2 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 5 = <strong>报刊科普议论（bee story + 观点反转）</strong>；Text 6 = <strong>文学性记叙 '
         '（literary journalism）</strong>。B2 考深层理解：短语含义、隐喻、反讽、观点匹配。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>短语题不抠字面（hit blossom-time / drama）；隐喻找本体（second skin → bee suit；atoms → bees）；'
         '匹配题用语言印记 + 排除法（Q71 的 F 选项）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128202; 2018 隐形数据 — 击碎砖块看 B2 最难题</h4>'
         '<p>Q47 hit blossom-time ' + chip(10) + ' · Q54 logic of the market ' + chip(15) + ' · '
         'Q65 it 指代 ' + chip(26) + ' · Q69 stray stitch ' + chip(24) + ' · '
         'Q71(ii)/(vi) 匹配 ' + chip(20) + ' — 需要推理和改写（paraphrase）的题目最难。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128273; 金句</h4>'
         '<p>阅卷员看重关键观点而非关键词；答案越长 ≠ 分越高 — 简洁准确是 B2 生存法则。</p></div>')
slides.append(slide("Part B2 · Recap", "exit-test", "Part B2", recap))

# ================= 34. 全卷数据榜 =================
def drow(n, q, pct, content):
    return (f'<tr><td>{n}</td><td>{q}</td><td>{chip(pct)}</td><td>{content}</td></tr>')

datab = ('<div class="sec-label">Data Reveal · 全卷数据榜</div>'
         '<div class="slide-h2" style="margin-bottom:10px">&#128202; 2018 全卷正确率榜 — 先猜再击碎砖块</div>'
         '<div style="font-size:17px;color:var(--text-2);margin-bottom:14px">每块砖后藏着一个正确率 — '
         '猜猜哪题最难，再点击两次揭晓。</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128293; 最难 10 题</h4>'
         '<table class="quiz-table"><tr><th>#</th><th>题号</th><th>正确率</th><th>考查内容</th></tr>'
         + drow(1, "Q18", 4, "辨识反讽（irony）")
         + drow(2, "Q44", 7, "词义查找（driven）")
         + drow(3, "Q6(vii)", 8, "摘要填空（stronger/greater）")
         + drow(4, "Q16", 9, "指代理解（working companions）")
         + drow(5, "Q47", 10, "短语理解（hit blossom-time）")
         + drow(6, "Q54", 15, "短语理解（logic of the market）")
         + drow(7, "Q42", 17, "简答题（蜜蜂在城市生存）")
         + drow(8, "Q6(iv)", 19, "摘要填空（emotions/senses）")
         + drow(9, "Q71(ii)", 20, "人物匹配（Not Applicable）")
         + drow(10, "Q71(vi)", 20, "人物匹配（Apple farm owner）")
         + '</table></div>'
         '<div class="card"><h4>&#10003; 最易 10 题</h4>'
         '<table class="quiz-table"><tr><th>#</th><th>题号</th><th>正确率</th><th>考查内容</th></tr>'
         + drow(1, "Q24", 93, "选择题（Africanised honey bee）")
         + drow(2, "Q3(i)", 92, "广告匹配（Ad 1）")
         + drow(3, "Q56", 90, "简答题（heather honey 特征）")
         + drow(4, "Q22(iii)", 89, "观点匹配（John: Agrees）")
         + drow(5, "Q60(i)", 86, "摘要填空（bodies/body/skin）")
         + drow(6, "Q4", 85, "多选题（未提及活动）")
         + drow(7, "Q27(iii)", 84, "流程图填空（redden/swell）")
         + drow(8, "Q61(i)", 82, "判断题（Smoke: F）")
         + drow(9, "Q25(ii)", 80, "判断题（Bees more dangerous: F）")
         + drow(10, "Q20", 80, "选择题（Best title: D）")
         + '</table></div>')
slides.append(slide("全卷数据榜", "exit-test", "收尾", datab))

# ================= 35. 考生表现分析 =================
perf = ('<div class="sec-label">Candidates\' Performance · 考生表现分析</div>'
        '<div class="slide-h2" style="margin-bottom:14px">2018 官方数据 — 知己知彼</div>'
        '<div class="card" style="margin-bottom:14px"><h4>&#128202; 考试概况</h4>'
        '<p>应考总人数 <strong>54,382</strong> 人 · 选考 Part B1（较易）<strong>43.9%</strong> · 选考 Part B2（较难）'
        '<strong>56.1%</strong>。选考 A+B2 可获全部等级（Level 1–5<strong>**</strong>）；选考 A+B1 最高只能获 Level 4。</p>'
        '<table class="quiz-table"><tr><th>部分</th><th>满分</th><th>平均得分率</th><th>标准差</th></tr>'
        '<tr><td>Part A（必考）</td><td>42</td><td>54.3%</td><td>21.8%</td></tr>'
        '<tr><td>Part B1（较易）</td><td>42</td><td>47.9%</td><td>21.1%</td></tr>'
        '<tr><td>Part B2（较难）</td><td>42</td><td>52.5%</td><td>21.8%</td></tr></table></div>'
        '<div class="card" style="margin-bottom:14px"><h4>&#127919; 官方点评 → 备考建议</h4>'
        '<p><strong>① 填空/摘要题（cloze）</strong>：词性不符、拼写错误均不得分；完成后回读检查；别重复摘要已有信息。</p>'
        '<p><strong>② 避免过度照抄（over-copying）</strong>：答案越长越可能是在用数量掩盖理解不足，也耗时；强考生答得简洁明了。</p>'
        '<p><strong>③ 深层理解</strong>：反讽、隐喻、语篇标记词要 read between the lines；短语题（hit blossom-time / drama）'
        '结合更广上下文推断；多要素题（Q40/Q42）检查是否答全。</p></div>')
slides.append(slide("考生表现分析", "exit-test", "收尾", perf))

# ================= 36. Well Done =================
done = ('<section class="slide" data-title="Well Done!" data-section="done" data-part="">'
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%">'
        '<div style="font-size:72px;margin-bottom:24px">&#127881;</div>'
        '<h2 class="slide-h2">Well Done!</h2>'
        '<p style="font-size:20px;color:var(--text-2);max-width:600px;line-height:1.8;margin-bottom:28px">'
        'You completed <strong>2018 DSE Paper 1 Reading</strong> — Part A (music) + Part B1 (bee stings &amp; urban '
        'beekeeper) + Part B2 (hand pollination &amp; sweetness and light)。</p>'
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
<title>2018 DSE Paper 1 阅读卷 · 网页课件 v1</title>
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
      <div class="sidebar-logo">&lt;/&gt; DSE 2018</div>
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
      <span class="course-tag">2018 DSE · Paper 1</span>
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
      <button class="hint-toggle-btn" id="hintToggleBtn" onclick="showAllData()" title="Remove all brick covers — reveal every correct rate (H)">&#128202; Show Data</button>
      <button class="hardmode-btn" id="hardmodeBtn" onclick="toggleHardMode()" title="Toggle hard mode: show full passage">&#128274; Easy</button>
      <button class="clear-hl-btn" onclick="clearAllHighlights()" title="Clear all highlights">&#128465; Clear</button>
      <button class="clear-hl-btn" onclick="resetProgress()" title="Reset all saved answers &amp; progress">&#8634; Reset</button>
      <span class="palette-wrap">
        <button class="clear-hl-btn" id="paletteBtn" onclick="togglePalettePanel(event)" title="Change theme color">&#127912;</button>
      </span>
      <button class="clear-hl-btn" id="randBtn" onclick="toggleRandPanel(event)" title="Random number picker — 随机点名">&#127922;</button>
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
