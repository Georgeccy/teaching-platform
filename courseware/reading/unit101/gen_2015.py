#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate index.html for 2015 DSE Paper 1 Reading courseware (v1).
Part 2: Part B2 (Q56-77, Text 5) + data board + performance + done + shell.
Run: python3 gen_2015.py  (imports helpers & Part A slides from gen_part1.py)
Scope: Part A + Part B2 only (Part B1 Q32-55 NOT included per user request).
"""
from gen_part1 import (chip, mcq, sa, sub_sa, tfng_slide, cloze, para, flip_grid, sig,
                       slide, split, P, T1, T2, T5, COMMENTS, slides)


# ================= 12. Part B2 divider =================
div_b2 = ('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">'
          '<div class="class-badge" style="font-size:20px;padding:14px 36px;margin-bottom:24px">Part B2</div>'
          '<div class="slide-h1" style="text-align:center">Harder Section</div>'
          '<div class="slide-h3" style="text-align:center;color:var(--text-2);margin-top:12px">Text 5 · Q56&ndash;Q77 · 40 marks</div>'
          '<p style="text-align:center;font-size:20px;margin-top:20px;color:var(--text-2);max-width:620px">'
          'Young Minds in Critical Condition（Michael S. Roth 论博雅教育与批判性思维）— 阅读重点：'
          '抽象指代与隐喻（critical / blindness / absorption）· 作者立场 · 读者评论（Tom vs Laura）。</p></div>')
slides.append(slide("Part B2", "divider", "Part B2", div_b2))

# ================= 13. B2 Entry Test =================
b2_entry_cards = [
    ("weary", "疲惫的；不耐烦的"),
    ("triumphantly", "得意洋洋地"),
    ("undermine", "削弱；自我拆台"),
    ("depraved", "堕落的"),
    ("sophistication", "老练；世故"),
    ("cynicism", "愤世嫉俗"),
    ("debunker", "揭穿者"),
    ("fetishize", "盲目迷恋"),
    ("absorption", "沉浸；专注"),
    ("receptive capacities", "接纳能力"),
]
body = ('<div class="sec-label">Part B2 · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">学术词汇 Academic Words — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 5 Critical Condition · 10 words · 每题 1 分</div>'
        + flip_grid(b2_entry_cards))
slides.append(slide("Part B2 Entry Test", "entry-test", "Part B2", body))

# ================= 14. Q56–Q59 · Text 5 ¶1–2 =================
left = '<h4>Text 5: Young Minds in Critical Condition（¶1–2）</h4>' + P(T5, [1, 2])

q56 = mcq("q56", "Q56 · MC · 1 mark", chip(52),
          "Why does Michael Roth try <strong>&quot;not to sound too weary&quot;</strong> (lines 3-4) when he replies to his students?",
          [("A", "The students are not self-reliant.", False, "与题干无关。"),
           ("B", "The students have no imagination.", False, "文中未提。"),
           ("C", "He thinks the writers are not interesting.", False, "他并不认为作者无趣。"),
           ("D", "He has replied to these comments many times before.", True, "")],
          "&#182;1 &quot;<em>It happens every semester</em>... Trying not to sound too <em>weary</em>&quot; — "
          "每学期都发生 = 同样的话他已回答过无数次，所以尽量不显出不耐烦。")

q57i = sub_sa("q57i", "i",
              "Why does the student think Rousseau &quot;is undermining himself&quot;?",
              '<p><strong>Rousseau is a depraved animal because he (himself / too) is (also) reflecting // '
              'it is a contradiction that Rousseau claims &quot;the man who reflects is a depraved animal&quot; // '
              'his claim is wrong / ironic</strong></p>'
              '<p>&#182;1 &quot;the man who <em>reflects</em> is a depraved animal&quot; — 学生认为：Rousseau '
              '自己也在反思，按他自己的话他也该是「堕落的动物」→ 自我拆台。仅 12% 对。</p>')
q57ii = sub_sa("q57ii", "ii",
               "Why might the student feel triumphant?",
               '<p><strong>the student thinks he&#39;s right / smart / sophisticated // he is challenging a famous '
               'person / author / theory // he&#39;s found mistakes (in the texts) which shows his critical thinking '
               'skills</strong></p>'
               '<p>&#182;1 &quot;A student <em>triumphantly</em> points out&quot; — 学生觉得自己指出了名家的矛盾，'
               '显得聪明、有批判力。</p>')

q58 = sa("q58", "Q58 · Short answer · 1 mark", chip(39),
         "Which word or phrase in paragraph 2 best summarizes the student&#39;s criticism of the writers in paragraph 1?",
         '<p><strong>(apparent) contradictions</strong></p>'
         '<p>&#182;2 &quot;our authors created these apparent <em>&quot;contradictions&quot;</em>&quot; — '
         '学生批评的核心就是「作者自相矛盾」，Roth 在 ¶2 直接给出了这个词。</p>')

q59 = ('<div class="practice-mcq" id="q59-box"><div class="pmcq-label">Q59 · Matching · 2 marks</div>'
       '<div class="pmcq-q">Match the person with the idea presented in the questions taken from paragraph 2. '
       'Write the letter (A&ndash;C). <strong>ONE question is not used.</strong></div>'
       '<div class="word-pool" id="q59-pool" style="margin-bottom:10px">'
       '<div class="draggable" draggable="true" data-word="q59-a" data-cat="a">A. &quot;How do we think about inequality and learning?&quot;</div>'
       '<div class="draggable" draggable="true" data-word="q59-b" data-cat="b">B. &quot;How can we stand on our own feet while being open to inspiration?&quot;</div>'
       '<div class="draggable" draggable="true" data-word="q59-c" data-cat="c">C. &quot;Isn&#39;t it more interesting to find inspiration in them?&quot;</div></div>'
       '<div class="tb-wrap"><table class="match-grid"><tr><th>Person</th><th style="width:190px">Question (A&ndash;C)</th></tr>'
       '<tr><td><strong>i) Michael Roth</strong> ' + chip(68) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="c"><div class="drop-content"></div></div></td></tr>'
       '<tr><td><strong>ii) Ralph Waldo Emerson</strong> ' + chip(57) + '</td>'
       '<td class="dz-cell"><div class="drop-zone" data-accept="b"><div class="drop-content"></div></div></td></tr>'
       '</table></div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkMatch(\'q59\',2)">Check</button>'
       '<button class="reveal-btn" onclick="resetMatch(\'q59\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q59-ans\')" style="background:var(--fcc-blue-dark)">Show Answers</button></div>'
       '<div class="ans-reveal" id="q59-result"></div>'
       '<div class="ans-reveal" id="q59-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>i) Roth &rarr; C</strong>（&quot;<em>Isn&#39;t it more interesting...</em>&quot; 是 Roth 自己'
       '的问句） · <strong>ii) Emerson &rarr; B</strong>（&quot;<em>stand on our own feet</em>&quot; 呼应 '
       'Emerson 的 self-reliance） · <strong>A 未使用</strong>（inequality and learning 不对应任何人）。</p>'
       '<p>&#128273; 匹配抓「关键词回响」：Roth 的立场是 find inspiration（选 C）；Emerson 的核心概念是 '
       'self-reliance = stand on our own feet（选 B）。</p></div></div>')

right = q56 + \
        '<div class="practice-mcq" id="q57-box"><div class="pmcq-label">Q57 · Short answer · 2 marks</div><div class="pmcq-q">i) Why does the student think Rousseau &quot;is undermining himself&quot;? ii) Why might the student feel triumphant?</div>' + q57i + q57ii + '</div>' + \
        q58 + q59
body = ('<div class="sec-label">Part B2 · Text 5 · Q56–Q59</div>'
        '<div class="slide-h3">The Triumphant Student — 自我拆台的矛盾</div>'
        + split("Text 5 (¶1–2)", left, right))
slides.append(slide("Q56–Q59 · Text 5 ¶1–2", "practice", "Part B2", body, "text5"))

# ================= 15. Q60–Q63 · Text 5 ¶3–7 =================
left = '<h4>Text 5: Being Smart = Being Critical?（¶3–7）</h4>' + P(T5, [3, 4, 5, 6, 7])

q60 = sa("q60", "Q60 · Short answer · 1 mark", chip(73),
         "What does <strong>&quot;It&quot;</strong> (line 11) refer to?",
         '<p><strong>having strong critical thinking skills // being critical</strong></p>'
         '<p>&#182;3 &quot;<em>Being smart</em>, for many, means being critical. Having strong critical skills '
         'shows... <em>It</em> is a sign of sophistication&quot; — It 回指「批判性强 / 有很强的批判性思维」'
         '这件事。&#10007; being smart（那是 means 前后的等号两端，不是 It 的指代）。</p>')

q61 = ('<div class="practice-mcq" id="q61-box"><div class="pmcq-label">Q61 · Word-pool cloze · 3 marks</div>'
       '<div class="pmcq-q">Complete this summary of paragraphs 3 and 4 by choosing a word from the eight '
       'options. Each word can be used <strong>ONCE</strong> only.</div>'
       '<div class="word-pool" id="q61-pool" style="margin-bottom:10px">'
       '<div class="draggable" draggable="true" data-word="q61-difficult" data-cat="q61-difficult">difficult</div>'
       '<div class="draggable" draggable="true" data-word="q61-important" data-cat="q61-important">important</div>'
       '<div class="draggable" draggable="true" data-word="q61-intelligent" data-cat="q61-intelligent">intelligent</div>'
       '<div class="draggable" draggable="true" data-word="q61-gruelling" data-cat="q61-gruelling">gruelling</div>'
       '<div class="draggable" draggable="true" data-word="q61-responsible" data-cat="q61-responsible">responsible</div>'
       '<div class="draggable" draggable="true" data-word="q61-satisfying" data-cat="q61-satisfying">satisfying</div>'
       '<div class="draggable" draggable="true" data-word="q61-cynical" data-cat="q61-cynical">cynical</div>'
       '<div class="draggable" draggable="true" data-word="q61-unproductive" data-cat="q61-unproductive">unproductive</div></div>'
       '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
       'According to Roth, the kind of thinking honed at college is (i) '
       '<span class="dz-cell" style="display:inline-block"><div class="drop-zone" data-accept="q61-unproductive" '
       'style="display:inline-block;min-width:150px"><div class="drop-content"></div></div></span> '
       + chip(30) + ' once students leave the campus. However, students believe it makes them more (ii) '
       '<span class="dz-cell" style="display:inline-block"><div class="drop-zone" data-accept="q61-intelligent" '
       'style="display:inline-block;min-width:150px"><div class="drop-content"></div></div></span> '
       + chip(42) + ' although others may feel they are just being (iii) '
       '<span class="dz-cell" style="display:inline-block"><div class="drop-zone" data-accept="q61-cynical" '
       'style="display:inline-block;min-width:150px"><div class="drop-content"></div></div></span> '
       + chip(35) + '.</div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkMatch(\'q61\',3)">Check</button>'
       '<button class="reveal-btn" onclick="resetMatch(\'q61\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q61-ans\')" style="background:var(--fcc-blue-dark)">Show Answers</button></div>'
       '<div class="ans-reveal" id="q61-result"></div>'
       '<div class="ans-reveal" id="q61-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>(i) unproductive</strong>（¶4 &quot;will not take you very far beyond the university&quot;） · '
       '<strong>(ii) intelligent</strong>（¶3 &quot;being smart... means being critical&quot;） · '
       '<strong>(iii) cynical</strong>（¶4 &quot;the satisfactions of <em>cynicism</em>&quot;）。</p>'
       '<p>&#128273; 8 选 3：先定词性（i 需形容词），再抓逻辑信号 — (i) 表「出校后无用」（否定），'
       '(ii) 学生自认为正面（intelligent），(iii) others 觉得负面（cynical）。剩余 5 个是干扰项。</p></div></div>')

q62 = tfng_slide("q62", "Q62 · T / F / NG · 3 marks",
                 "Based on paragraphs 5 and 6, decide whether the following statements are True, False or the information is Not Given.",
                 [("(i)", "The writer thinks that being critical has no use.", "F",
                   "¶5 \"<em>not totally without value</em>\" — Roth 承认批判并非全无价值，说「没有用」为 False。", 88),
                  ("(ii)", "Students could learn more if they were less critical.", "T",
                   "¶5 \"we may be <em>depriving students</em> of the chance to learn as much as "
                   "possible\" + ¶6 \"close themselves off from their <em>potential</em>\" — "
                   "少些批判就能学到更多。", 65),
                  ("(iii)", "Students don't enjoy books, music and experiments in the classroom.", "NG",
                   "¶6 只说学生可能「close themselves off from potential to find or create meaning」，"
                   "并未提及他们是否 enjoy — Not Given。", 69)])

q63 = mcq("q63", "Q63 · MC · 1 mark", chip(63),
          "What is the main idea in paragraph 7?",
          [("A", "Living outside university requires tolerance.", False, "未提 tolerance。"),
           ("B", "Critical skills contribute to your popularity after university.", False, "与文意相反。"),
           ("C", "Displaying critical prowess has little benefit after university.", True, ""),
           ("D", "There is little critical thinking outside the university.", False, "外面批判性思维并不少。")],
          "&#182;7 &quot;those points often come at <em>their own expense</em>... But this cynicism is "
          "<em>no achievement</em>&quot; — 出了校门炫耀批判力得不偿失。")

right = q60 + q61 + q62 + q63
body = ('<div class="sec-label">Part B2 · Text 5 · Q60–Q63</div>'
        '<div class="slide-h3">Being Smart = Being Critical? — 批判的代价</div>'
        + split("Text 5 (¶3–7)", left, right))
slides.append(slide("Q60–Q63 · Text 5 ¶3–7", "practice", "Part B2", body, "text5"))

# ================= 16. Q64–Q67 · Text 5 ¶8–9 =================
left = '<h4>Text 5: 两种传统与批判的沉迷（¶8–9）</h4>' + P(T5, [8, 9])

q64 = ('<div class="card accent" style="margin-bottom:8px"><p style="font-size:19px;line-height:1.75">Below is a summary of paragraph 8. In three of the lines, there is ONE mistake. If you find a mistake, underline the mistake and replace the word with one that expresses the correct idea. Write the word in the space on the right. If there is no mistake, put a tick (&#10003;) in the space. The first has been done for you. <strong>(4 marks)</strong></p></div>'
       '<div class="tb-wrap"><table>'
       '<tr><th>#</th><th>Summary</th><th style="width:150px"></th></tr>'
       '<tr><td>e.g.</td><td>There are <u>three</u> traditions in liberal education in America:</td>'
       '<td style="color:var(--text-3)"><span style="color:var(--fcc-green-dark);font-weight:800">two</span></td></tr>'
       '<tr class="q1-hidden-row" id="q64-row-i"><td>(i)</td>'
       '<td>one pursues truth, the other pursues <span class="q64-wrong" data-wrong="exuberance" data-correct="excellence">exuberance</span>. Since</td>'
       '<td><span class="rate-cover-wrap"><span class="acc-badge acc-low">45%</span><span class="rate-cover" onclick="hitCover(this)" title="🧱 点击 2 次击碎砖块，查看正确率"></span></span> '
       '<button class="q1-tap-btn" onclick="revealQ1Row(\'q64-row-i\')">Tap to reveal</button></td></tr>'
       '<tr class="q1-hidden-row" id="q64-row-ii"><td>(ii)</td>'
       '<td>the 1960s, there has been <span class="q64-wrong" data-wrong="less" data-correct="more / greater">less</span> emphasis on the former,</td>'
       '<td><span class="rate-cover-wrap"><span class="acc-badge acc-mid">50%</span><span class="rate-cover" onclick="hitCover(this)" title="🧱 点击 2 次击碎砖块，查看正确率"></span></span> '
       '<button class="q1-tap-btn" onclick="revealQ1Row(\'q64-row-ii\')">Tap to reveal</button></td></tr>'
       '<tr class="q1-hidden-row" id="q64-row-iii"><td>(iii)</td>'
       '<td>which now is synonymous with fault-finding and challenging beliefs. '
       '<span class="q1-no-mistake" style="color:var(--fcc-green-dark);font-weight:800">&#10003; no mistake</span></td>'
       '<td><span class="rate-cover-wrap"><span class="acc-badge acc-mid">58%</span><span class="rate-cover" onclick="hitCover(this)" title="🧱 点击 2 次击碎砖块，查看正确率"></span></span> '
       '<button class="q1-tap-btn" onclick="revealQ1Row(\'q64-row-iii\')">Tap to reveal</button></td></tr>'
       '<tr class="q1-hidden-row" id="q64-row-iv"><td>(iv)</td>'
       '<td>Rather than being a participant, there is a preference to be a '
       '<span class="q64-wrong" data-wrong="competitor" data-correct="spectator // beholder">competitor</span>.</td>'
       '<td><span class="rate-cover-wrap"><span class="acc-badge acc-mid">58%</span><span class="rate-cover" onclick="hitCover(this)" title="🧱 点击 2 次击碎砖块，查看正确率"></span></span> '
       '<button class="q1-tap-btn" onclick="revealQ1Row(\'q64-row-iv\')">Tap to reveal</button></td></tr>'
       '</table></div>'
       '<div style="margin-top:10px">'
       '<button class="reveal-btn" onclick="toggleRev(\'q64-all-ans\')" style="font-size:15px">Show Explanations</button>'
       '<div class="ans-reveal" id="q64-all-ans">'
       '<strong>(i) exuberance &rarr; excellence</strong> &mdash; &quot;exuberant performance in pursuit of '
       '<em>excellence</em>&quot;（两条传统：critical inquiry 追求真理 vs exuberant performance 追求卓越）。<br>'
       '<strong>(ii) less &rarr; more / greater</strong> &mdash; &quot;emphasis on inquiry has become '
       '<em>dominant</em>&quot;（近半世纪 inquiry 占主导 &rarr; emphasis 变多而非变少）。<br>'
       '<strong>(iii) &#10003;</strong> &mdash; 与原文同义（fault-finding = expose error，challenging beliefs = '
       'undermine belief），本行无错。<br>'
       '<strong>(iv) competitor &rarr; spectator // beholder</strong> &mdash; &quot;the sophisticated '
       '<em>spectator</em>... reverent <em>beholder</em>&quot;（旁观者/注视者，不是竞争者）。<br><br>'
       '<span class="method-badge">&#128273; Proofreading 四步法：定位 &rarr; 对照 &rarr; 识别语义 &rarr; 替换。'
       '核心陷阱：错词永远和正确答案是&ldquo;同类用词&rdquo;&mdash;&mdash;词性相同、词义范围相同。</span>'
       '</div></div>')

q65 = mcq("q65", "Q65 · MC · 1 mark", chip(54),
          "Which phrase can replace the meaning of <strong>&quot;fetishizing&quot;</strong> in line 37?",
          [("A", "the obsession with", True, ""),
           ("B", "the problem of", False, "fetishize 无「问题」之意。"),
           ("C", "the hatred of", False, "无「憎恨」之意。"),
           ("D", "the experiment with", False, "无「实验」之意。")],
          "&#182;9 &quot;<em>fetishizing</em> disbelief as a sign of intelligence&quot; — fetishize = 把……当作"
          "迷恋/崇拜的对象 → the obsession with。")

q66i = sub_sa("q66i", "i",
              "State the first way people have changed (¶9).",
              '<p><strong>fetishizing disbelief as a sign of intelligence (is contributing to the depletion of '
              'our cultural resources)</strong></p>'
              '<p>&#182;9 第一变：把「怀疑」迷恋成聪明的标志，消耗我们的文化资源。</p>', 17)
q66ii = sub_sa("q66ii", "ii",
               "State the second way people have changed (¶9).",
               '<p><strong>(increasingly fractured) technological existence wears down our receptive capacities // '
               '(people&#39;s) receptive capacities have decreased / been worn down // losing the ability to become '
               'absorbed in works of literature / art / science</strong></p>'
               '<p>&#182;9 第二变：碎片化的科技生活磨损了我们的接纳能力（absorption 成为濒危物种）。</p>', 35)

q67 = sa("q67", "Q67 · Short answer · 1 mark", chip(45),
         "In paragraph 10, what does Michael Roth believe students initially would prefer to watch in his class?",
         '<p><strong>(movies / films with) explosions / sex / gag lines // films / movies / things that '
         'immediately engage their senses // their own devices // students&#39; own phones / tablets / mobile / '
         'electronic gadgets</strong></p>'
         '<p>&#182;10 &quot;movies that don&#39;t immediately engage their senses with <em>explosions, sex or '
         'gag lines</em>&quot; — 学生初时只爱看感官刺激片。&#10007; 只答 films / movies（太泛，不得分）。</p>')

right = q64 + q65 + \
        '<div class="practice-mcq" id="q66-box"><div class="pmcq-label">Q66 · Short answer · 2 marks</div><div class="pmcq-q">According to paragraph 9, in what two ways have people changed, contributing to the changes in our cultural life?</div>' + q66i + q66ii + '</div>' + \
        q67
body = ('<div class="sec-label">Part B2 · Text 5 · Q64–Q67</div>'
        '<div class="slide-h3">Two Traditions — 摘要改错与沉迷批判</div>'
        + split("Text 5 (¶8–9)", left, right))
slides.append(slide("Q64–Q67 · Text 5 ¶8–9", "practice", "Part B2", body, "text5"))

# ================= 17. Q68–Q72 · Text 5 ¶10–12 =================
left = '<h4>Text 5: 电影课实验（¶10–12）</h4>' + P(T5, [10, 11, 12])

q68i = sub_sa("q68i", "i",
              "Why do the students think Michael Roth asks them to put away their phones and tablets?",
              '<p><strong>(at first they see this as) some old guy&#39;s / MR&#39;s failure to grasp their skills '
              'at multitasking // he thinks they can&#39;t multitask</strong></p>'
              '<p>&#182;10 &quot;At first they see this as some old guy&#39;s <em>failure to grasp their skill at '
              'multitasking</em>&quot; — 学生以为老师不懂多任务。&#10007; concentrate more on the movie / he&#39;s '
              'an old-fashioned guy。</p>', 26)
q68ii = sub_sa("q68ii", "ii",
               "When the class even &quot;forget&quot; their phones and tablets, what does this imply?",
               '<p><strong>they enjoy / like / are inspired by the film / lesson // pay more attention / more '
               'focused in class // absorbed / deeply engaged in the film // re-learn how to give themselves to an '
               'emotional and intellectual experience // they&#39;ve encountered an unexpected source of inspiration</strong></p>'
               '<p>&#182;10 &quot;We even <em>forget</em> our phones and tablets... unexpected sources of '
               'inspiration&quot; — 忘记手机 = 完全沉浸。</p>', 57)

q69 = mcq("q69", "Q69 · MC · 1 mark", chip(45),
          "Which one of the following is <strong>NOT</strong> mentioned as an outcome of liberal learning in paragraph 11?",
          [("A", "being open to different lifestyles", False, "¶11 有提（open ourselves to various forms of life）。"),
           ("B", "developing problem-solving skills", False, "¶11 有提（techniques of problem solving）。"),
           ("C", "activating existing knowledge", True, ""),
           ("D", "initiating new opportunities", False, "¶11 有提（instigate new possibilities）。")],
          "&#182;11 &quot;we are learning to <em>activate potential</em>&quot; — activate 的是 potential"
          "（潜能），不是 existing knowledge（已有知识）。C 偷换概念 → NOT mentioned。")

q70 = sa("q70", "Q70 · Short answer · 1 mark", chip(32),
         "What does Michael Roth mean by <strong>&quot;blindness&quot;</strong> (line 52)?",
         '<p><strong>inability / unable to understand an experience from another&#39;s point of view // things we '
         'don&#39;t know / understand / are aware of // lack of understanding something that we did not think of // '
         '(having a) limited mind // own prejudice(s) // bias</strong></p>'
         '<p>&#182;11 &quot;overcoming our own <em>blindness</em> by trying to understand an experience from '
         'another&#39;s point of view&quot; — blindness = 无法从他人视角理解经验（认知盲区/偏见）。仅 32%。</p>')

q71i = sub_sa("q71i", "i",
              "What danger might &quot;absorption&quot; (line 56) pose?",
              '<p><strong>we risk changing who we are / change</strong></p>'
              '<p>&#182;12 &quot;without it we <em>risk changing who we are</em>&quot; — 沉浸的风险是'
              '「我们可能被改变」。</p>', 25)
q71ii = sub_sa("q71ii", "ii",
               "What can be used as a protection against that risk?",
               '<p><strong>hard-nosed critical thinking</strong></p>'
               '<p>&#182;12 &quot;<em>hard-nosed critical thinking</em> is a useful tool, but it also may become '
               'a <em>defense</em>&quot; — 顽固的批判性思维可以当「防御」。</p>', 28)

q72 = sa("q72", "Q72 · Short answer · 1 mark", chip(52),
         "Which word in paragraph 12 means <strong>&quot;really want&quot;</strong>?",
         '<p><strong>crave</strong></p>'
         '<p>&#182;12 &quot;we sometimes <em>crave</em> that protection&quot; — crave = 渴望、极想要。</p>')

right = \
    '<div class="practice-mcq" id="q68-box"><div class="pmcq-label">Q68 · Short answer · 2 marks</div><div class="pmcq-q">i) Why do the students think Michael Roth asks them to put away their phones and tablets? ii) When the class even &quot;forget&quot; their phones and tablets, what does this imply?</div>' + q68i + q68ii + '</div>' + \
    q69 + q70 + \
    '<div class="practice-mcq" id="q71-box"><div class="pmcq-label">Q71 · Short answer · 2 marks</div><div class="pmcq-q">i) What danger might &quot;absorption&quot; pose? ii) What can be used as a protection against that risk?</div>' + q71i + q71ii + '</div>' + \
    q72
body = ('<div class="sec-label">Part B2 · Text 5 · Q68–Q72</div>'
        '<div class="slide-h3">The Film Class Experiment — 沉浸与盲区</div>'
        + split("Text 5 (¶10–12)", left, right))
slides.append(slide("Q68–Q72 · Text 5 ¶10–12", "practice", "Part B2", body, "text5"))

# ================= 18. Q73–Q77 · Text 5 ¶13 + Comments =================
left = '<h4>Text 5: 结论与读者评论（¶13 + Comments）</h4>' + P(T5, [13]) + \
       '<div class="passage-excerpt"><div class="para-num">COMMENTS</div>' + COMMENTS + '</div>'

q73 = ('<div class="practice-mcq" id="q73-box"><div class="pmcq-label">Q73 · Tick TWO · 2 marks '
       + chip([("i", 78), ("iii", 78)]) + '</div>'
       '<div class="pmcq-q">Which of the following does Michael Roth imply in paragraph 13? Put a tick (✓) '
       'next to the <strong>TWO</strong> that apply, then press <strong>Check</strong>.</div>'
       '<div class="pmcq-options tick-group" id="q73-opts">'
       '<span class="pmcq-opt" data-correct="true" onclick="toggleTick(this)">'
       '<span class="pl">i</span>Learning should have some application to society.</span>'
       '<span class="pmcq-opt" data-correct="false" onclick="toggleTick(this)">'
       '<span class="pl">ii</span>University education is limited to critical thinking.</span>'
       '<span class="pmcq-opt" data-correct="true" onclick="toggleTick(this)">'
       '<span class="pl">iii</span>Liberal education helps whole person development.</span>'
       '<span class="pmcq-opt" data-correct="false" onclick="toggleTick(this)">'
       '<span class="pl">iv</span>There should be more problem solving rather than critical thinking.</span>'
       '</div>'
       '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">'
       '<button class="reveal-btn" onclick="checkTicks(\'q73\')">Check</button>'
       '<button class="reveal-btn" onclick="resetTicks(\'q73\')" style="background:var(--text-3)">Reset</button>'
       '<button class="reveal-btn" onclick="toggleRev(\'q73-ans\')" style="background:var(--fcc-blue-dark)">'
       'Show Answers</button></div>'
       '<div class="ans-reveal" id="q73-result"></div>'
       '<div class="ans-reveal" id="q73-ans"><div class="ans-banner"><span class="tick">&#10003;</span>'
       '<div><div class="at">Answer Key</div></div></div>'
       '<p><strong>&#9745; i)</strong> Learning should have some application to society（&quot;contribute to '
       'the <em>world</em>&quot;） · <strong>&#9745; iii)</strong> Liberal education helps whole person '
       'development（&quot;<em>reshape it, and ourselves</em>&quot;）</p>'
       '<p>&#9744; ii) Roth 说的是 liberal education「must NOT limit itself to critical thinking」→ 不是'
       '「大学教育局限于批判思维」 · &#9744; iv) Roth 并不反对 problem solving，只是认为不该只有它。</p>'
       '<p>&#128273; 推断题：i 和 iii 都是 ¶13 的正面主张；ii/iv 是「偷换 / 夸张」的干扰项。</p></div></div>')

q74i = sub_sa("q74i", "i",
              "State the first implication of &quot;critical&quot;.",
              '<p><strong>to think critically // (to develop) critical thinking (skills) // to criticise // to '
              'point out errors // to find contradictions // to show how things don&#39;t make sense // to take '
              'the guise of the sophisticated spectator</strong></p>'
              '<p>含义一：批判性思维（全文前半的主线）。</p>', 32)
q74ii = sub_sa("q74ii", "ii",
               "State the second implication of &quot;critical&quot;.",
               '<p><strong>(the situation / it) is quite serious / urgent // to be in (a) danger(ous) situation // '
               'critical condition, that it is important, serious</strong></p>'
               '<p>含义二：情况危急（critical condition 医学用语「病危」）— 年轻人的心智处于危险状态。仅 10% 对：'
               '要看出标题的双关。</p>', 10)

q75 = mcq("q75", "Q75 · MC · 1 mark", chip(44),
          "Which of the following best describes Michael Roth&#39;s intention in writing this article?",
          [("A", "to express a strongly held opinion", True, ""),
           ("B", "to show the pros and cons of an issue", False, "文章立场鲜明，不是平衡利弊。"),
           ("C", "to expose a dangerous secret to the public", False, "无「黑幕」可言。"),
           ("D", "to amuse the reader using his personal experience", False, "个人经历是论据不是目的。")],
          "&#182;13 &quot;Liberal education <em>must not</em> limit itself... it <em>must</em> also foster...&quot; "
          "— 全文是强烈主张（should / must 高频），选 A。")

q76 = sa("q76", "Q76 · Short answer · 4 marks", chip(62),
         "What is Tom&#39;s stance towards Liberal Education? Summarize his opinion in your own words.",
         '<p><strong>He disagrees / is (strongly) against Liberal Education // He thinks Liberal Education is not '
         'important / useless</strong>（立场 1 分）</p>'
         '<p>&#10003; it is a waste of money // costly / expensive（1 分）</p>'
         '<p>&#10003; it doesn&#39;t help you get a job // no prospect of a job / career // doesn&#39;t help your '
         'future（1 分）</p>'
         '<p>&#10003; you can get the same / a similar kind of education by reading books / in the library / '
         'self study（1 分）</p>'
         '<p>&#10003; they should / it is better to study STEM subjects (science / technology / engineering / maths)'
         '（任何三点 + 立场 = 4 分）</p>'
         '<p>&#10007; university is a waste of money // university should focus on STEM // Liberal Education costs '
         'universities a lot of money（偷换主语）</p>'
         '<p>&#128273; Tom 的评论有 4 个独立要点：① $60,000 学费贵 ② no prospect for a job ③ library 自学即可 '
         '④ 改学 STEM。看分答题：4 分 = 4 个点（或 3 点 + 明确立场）。用自己的话重组，不能大段照抄。</p>')

q77 = sa("q77", "Q77 · Short answer · 2 marks", chip([("Yes", 43), ("Reason", 4)]),
         "Does Laura agree with Michael Roth? Give a reason for your answer.",
         '<p><strong>Yes</strong> &mdash; (she thinks) it is easier to take apart (the structure of) an argument / '
         'ideas than it is to build one // criticise an argument than it is to make one</p>'
         '<div style="margin:8px 0;padding:8px 12px;border-left:3px solid var(--fcc-green-dark);'
         'border-radius:0 8px 8px 0;background:rgba(11,130,53,.06)">'
         '<p style="margin:0 0 4px;font-size:15px;font-weight:800;color:var(--fcc-green-dark)">'
         '&#9989; 得分点 1 · 判断（1 分）</p>'
         '<p style="margin:0;font-size:17px"><strong>Yes</strong> &mdash; Laura <strong>同意</strong> Roth 的观点。'
         '判断必须直接明确（正确率 43%）。</p></div>'
         '<div style="margin:8px 0;padding:8px 12px;border-left:3px solid var(--fcc-purple-dark);'
         'border-radius:0 8px 8px 0;background:rgba(var(--accent-rgb),.05)">'
         '<p style="margin:0 0 4px;font-size:15px;font-weight:800;color:var(--fcc-purple-dark)">'
         '&#9989; 得分点 2 · 理由（1 分）</p>'
         '<p style="margin:0;font-size:17px">It is easier to take apart (the structure of) an argument / ideas '
         'than it is to build one &mdash; criticising an argument is easier than making one。'
         'Laura：造楼要数月，拆楼几小时 &mdash; 批评比建设容易（正确率仅 4%）。</p></div>'
         '<p style="margin-top:8px">&#10007; it takes a long time to build it, and less time and skill to wreck it'
         '（时间反了：build 才 takes months or years）。&#10007; 把 structure 理解为「课程/楼房」&mdash; 此处 '
         'structure 指「论点结构」。</p>'
         '<p>&#128273; 答题模板：判断 + because + 理由，一句话连写成完整回答 &mdash; '
         '&quot;Yes, because it is easier to take apart an argument than to build one.&quot; '
         '两个得分点各 1 分，缺一不可。</p>')

right = q73 + \
        '<div class="practice-mcq" id="q74-box"><div class="pmcq-label">Q74 · Short answer · 2 marks</div><div class="pmcq-q">In the title &quot;Young Minds in Critical Condition&quot;, what TWO implications does &quot;critical&quot; have in this context?</div>' + q74i + q74ii + '</div>' + \
        q75 + q76 + \
        q77
body = ('<div class="sec-label">Part B2 · Text 5 · Q73–Q77</div>'
        '<div class="slide-h3">Critical 的双关 — 结论与读者声音</div>'
        + split("Text 5 (¶13 + Comments)", left, right))
slides.append(slide("Q73–Q77 · Text 5 ¶13+Comments", "practice", "Part B2", body, "text5"))

# ================= 19. B2 Close Reading =================
cr = ('<div class="sec-label">Part B2 · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;1: A student ' + sig("triumphantly", "得意洋洋地") + ' points out that Rousseau is '
      + sig("undermining himself", "自我拆台") + '... Trying not to sound too ' + sig("weary", "不耐烦") + '.</p>'
      '<p style="margin-top:14px">&#182;2: these ' + sig("apparent contradictions", "表面上的矛盾")
      + '... ' + sig("ponder", "思索") + ' more interesting questions.</p>'
      '<p style="margin-top:14px">&#182;3: being smart, for many, means being critical... a sign of '
      + sig("sophistication", "老练世故") + '.</p>'
      '<p style="margin-top:14px">&#182;4: ' + sig("Taking things apart", "拆解事物")
      + '... the satisfactions of ' + sig("cynicism", "愤世嫉俗") + '. But this is '
      + sig("thin gruel", "淡而无味的稀粥（聊胜于无）") + '.</p>'
      '<p style="margin-top:14px">&#182;5: self-satisfied ' + sig("debunkers", "揭穿者")
      + '... people who like to ' + sig("&quot;trouble&quot; ideas", "「找茬」思想") + '.</p>'
      '<p style="margin-top:14px">&#182;7: displaying the critical ' + sig("prowess", "高超技艺")
      + '... comes at their own expense... this cynicism is ' + sig("no achievement", "不算成就") + '.</p>'
      '<p style="margin-top:14px">&#182;8: the intertwining of two traditions... in pursuit of '
      + sig("excellence", "卓越") + '... the ' + sig("sophisticated spectator", "老练的旁观者")
      + ' rather than the messy ' + sig("participant", "参与者") + '.</p>'
      '<p style="margin-top:14px">&#182;9: ' + sig("fetishizing disbelief", "把怀疑当作迷恋对象")
      + '... ' + sig("depleting our cultural resources", "耗尽文化资源") + '... wears down our '
      + sig("receptive capacities", "接纳能力") + '.</p>'
      '<p style="margin-top:14px">&#182;11: overcoming our own ' + sig("blindness", "盲区")
      + '... to ' + sig("instigate", "促成") + ' new possibilities.</p>'
      '<p style="margin-top:14px">&#182;12: ' + sig("hard-nosed", "顽固的") + ' critical thinking... '
      + sig("risky insight", "有风险的洞见") + '... we sometimes ' + sig("crave", "渴望") + ' that protection.</p>'
      '<p style="margin-top:14px">&#182;13: it must also foster ' + sig("openness, participation and "
      "opportunity", "开放、参与和机会") + '... and ' + sig("reshape", "重塑") + ' it, and ourselves.</p></div>')
slides.append(slide("Part B2 · Close Reading", "close-reading", "Part B2", cr))

# ================= 20. B2 Exit Test =================
b2_exit_cards = [
    ("point out", "指出"),
    ("take the point of view", "采取……视角"),
    ("be coupled with", "与……相伴"),
    ("negotiate the politics of", "周旋于……的潜规则"),
    ("take ... down", "击倒；扳倒"),
    ("be wary of", "警惕"),
    ("close oneself off from", "自我封闭"),
    ("at one's own expense", "以损害自己为代价"),
    ("pander to", "迎合"),
    ("instigate", "促成；激发"),
]
body = ('<div class="sec-label">Part B2 · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">学术短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 5 Critical Condition · 10 items · 每题 1 分</div>'
        + flip_grid(b2_exit_cards))
slides.append(slide("Part B2 Exit Test", "exit-test", "Part B2", body))

# ================= 21. B2 Recap =================
recap = ('<div class="sec-label">Part B2 · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part B2 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 5 = <strong>论说文（argumentative essay）</strong>：现象（学生爱挑错）&rarr; 论证'
         '（批判的代价）&rarr; 呼吁（liberal education 不该只有批判）。标题 <em>Critical</em> 一语双关'
         '（批判的 / 危急的）是全文题眼（Q74 仅 10% 答出第二层）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>抽象指代逐层剥（Q58 contradictions / Q60 It = being critical）；8 选 3 词池先定词性与'
         '褒贬（Q61）；摘要改错逐行回原文核对（Q64 iii 无错打 ✓）；评论题先判立场再拆要点'
         '（Q76 看分答 4 点 / Q77 structure ≠ 楼房）。</p></div>'
         '<div class="card"><h4>&#128170; 记住</h4>'
         '<p>Q70 blindness（32%）/ Q74 critical 双关（10%）/ Q77 理由（4%）—— 高阶推断题都要'
         '<strong>离开字面</strong>读言外之意。整个 Part B2 的平均分只有 45.8%，低于 Part A 的 49.4%。</p></div>')
slides.append(slide("Part B2 · Recap", "exit-test", "Part B2", recap))

# ================= 22. 全卷数据榜 =================
def drow(n, q, pct, content):
    return (f'<tr><td>{n}</td><td>{q}</td><td>{chip(pct)}</td><td>{content}</td></tr>')

datab = ('<div class="sec-label">Data Reveal · 全卷数据榜</div>'
         '<div class="slide-h2" style="margin-bottom:10px">&#128202; 2015 全卷正确率榜 — 先猜再击碎砖块</div>'
         '<div style="font-size:17px;color:var(--text-2);margin-bottom:14px">每块砖后藏着一个正确率 — '
         '猜猜哪题最难，再点击两次揭晓。</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128293; 最难 10 题</h4>'
         '<table class="quiz-table"><tr><th>#</th><th>题号</th><th>正确率</th><th>考查内容</th></tr>'
         + drow(1, "Q27", 4, "简答（canon = 必读书单）")
         + drow(2, "Q77(ii)", 4, "简答（Laura 同意的理由）")
         + drow(3, "Q2", 9, "简答（several more books）")
         + drow(4, "Q74(ii)", 10, "简答（critical = 危急）")
         + drow(5, "Q13", 11, "简答（Daniel 与 Psy 的共同观点）")
         + drow(6, "Q57(i)", 12, "简答（Rousseau 自我拆台）")
         + drow(7, "Q9", 22, "简答（葬礼狂饮的原因）")
         + drow(8, "Q71(i)", 25, "简答（absorption 的风险）")
         + drow(9, "Q8", 25, "简答（nonsense 的指代）")
         + drow(10, "Q31(ii)", 22, "简答（韩国人对成就的态度）")
         + '</table></div>'
         '<div class="card"><h4>&#10003; 最易 10 题</h4>'
         '<table class="quiz-table"><tr><th>#</th><th>题号</th><th>正确率</th><th>考查内容</th></tr>'
         + drow(1, "Q17(ii)", 91, "摘要填空（wealthy man）")
         + drow(2, "Q17(iii)", 88, "摘要填空（beautiful lady）")
         + drow(3, "Q62(i)", 88, "TFNG（being critical 无用 → F）")
         + drow(4, "Q17(i)", 90, "摘要填空（dramas）")
         + drow(5, "Q12", 82, "指代（them = 3rd Line Butterfly）")
         + drow(6, "Q14(iii)", 82, "TFNG（好音乐不出韩国 → T）")
         + drow(7, "Q15", 83, "简答（soaps = 韩剧）")
         + drow(8, "Q46(ii)", 84, "简答（era of relative peace）")
         + drow(9, "Q62(ii)", 65, "TFNG（少些批判学得更多 → T）")
         + drow(10, "Q5", 75, "选择题（off the radar = unknown）")
         + '</table></div>')
slides.append(slide("全卷数据榜", "exit-test", "收尾", datab))

# ================= 23. 考生表现分析 =================
perf = ('<div class="sec-label">Candidates&#39; Performance · 考生表现分析</div>'
        '<div class="slide-h2" style="margin-bottom:14px">2015 真题难度画像 — 知己知彼</div>'
        '<div class="card" style="margin-bottom:14px"><h4>&#128202; 试卷概况（官方 Table 1）</h4>'
        '<p>全卷 Part A 必做 + Part B1 / B2 二选一。选考 A+B2 可获全部等级（Level 1&ndash;5**）；'
        '选考 A+B1 最高只能获 Level 4。68,616 名考生中 36,443 选 B1、32,173 选 B2。</p>'
        '<table class="quiz-table"><tr><th>部分</th><th>Full Mark</th><th>Mean Score (%)</th><th>S.D. (%)</th></tr>'
        '<tr><td>Part A（必考）</td><td>40</td><td>49.42</td><td>19.67</td></tr>'
        '<tr><td>Part B1（较易）</td><td>40</td><td>50.85</td><td>20.32</td></tr>'
        '<tr><td>Part B2（较难）</td><td>40</td><td>45.80</td><td>17.95</td></tr></table>'
        '<p style="margin-top:8px;font-size:16px;color:var(--text-2)">B2（45.8%）确实低于 B1（50.9%）与 '
        'Part A（49.4%）— 选 B2 是冲 Level 5 的必经之路，也是难度最大的路。</p></div>'
        '<div class="card" style="margin-bottom:14px"><h4>&#127919; 2015 难度特征 &rarr; 备考建议</h4>'
        '<p><strong>① 上下文线索（macro-focus）定生死</strong>：Q27 canon（4%）有三条跨段线索都不用 — '
        '只盯着关键词附近读，必丢分。整篇视野与细节定位同样重要。</p>'
        '<p><strong>② 小心时态与指代陷阱</strong>：Q2（9%）「has authored 两本 + several in the pipeline」— '
        '现在完成时 vs 计划中；Q4 they = other Westerners。</p>'
        '<p><strong>③ 推断题要「说出来」</strong>：Q13（11%）/ Q28（7%）要求把引申义写明'
        '（Gangnam 浮华 / 朝鲜更受关注），照抄原句不得分。</p>'
        '<p><strong>④ 高阶隐喻题是 B2 分水岭</strong>：Q70 blindness（32%）/ Q74 critical 双关（10%）/ '
        'Q77 structure（4%）—— 都要脱离字面读言外之意。</p>'
        '<p><strong>⑤ 别抄长句</strong>：Q8&ndash;Q10 / Q66 / Q68 短答即可，大段照抄既费时又淹没得分点。</p></div>')
slides.append(slide("考生表现分析", "exit-test", "收尾", perf))

# ================= 24. Well Done =================
done = ('<section class="slide" data-title="Well Done!" data-section="done" data-part="">'
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%">'
        '<div style="font-size:72px;margin-bottom:24px">&#127881;</div>'
        '<h2 class="slide-h2">Well Done!</h2>'
        '<p style="font-size:20px;color:var(--text-2);max-width:600px;line-height:1.8;margin-bottom:28px">'
        'You completed <strong>2015 DSE Paper 1 Reading</strong> — Part A (warm-hearted Koreans &amp; the '
        'Impossible Country) + Part B2 (Young Minds in Critical Condition)。Part B1（Q32&ndash;55）本课件不涉及。</p>'
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
<title>2015 DSE Paper 1 阅读卷 · 网页课件 v1</title>
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
      <div class="sidebar-logo">&lt;/&gt; DSE 2015</div>
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
      <span class="course-tag">2015 DSE · Paper 1</span>
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
          <span class="rand-range-wrap">1 &ndash; <input class="rand-max" id="randMax" type="number" min="2" max="999" value="24"></span>
        </div>
        <div class="rand-num" id="randNum">?</div>
        <div class="rand-btns">
          <button class="rand-go" onclick="drawRandom()">开始点名！</button>
          <button class="rand-close" onclick="toggleRandPanel()">关闭</button>
        </div>
        <div class="rand-history" id="randHistory"></div>
      </div>
    </div>

    <!-- ===== Progress bar ===== -->
    <div class="progress-wrap"><div class="progress-bar" id="progressBar"></div></div>

    <!-- ===== Slides container ===== -->
    <div class="slides-container" id="slidesContainer">
'''

TAIL = '''
    </div><!-- /slides-container -->

  </div><!-- /main-area -->

</div><!-- /deck -->

<div class="confetti-wrap" id="confetti"></div>

<!-- Notes panel -->
<div class="notes-overlay" id="notesOverlay" onclick="closeNotes()"></div>
<div class="notes-panel" id="notesPanel">
  <div class="notes-header">
    <span class="notes-title" id="npPage">笔记</span>
    <button class="notes-close" onclick="closeNotes()">✕</button>
  </div>
  <textarea class="notes-ta" id="npTa" placeholder="在这一页记笔记……（自动保存到本地）"></textarea>
</div>

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
