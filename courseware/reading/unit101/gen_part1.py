#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate index.html for 2018 DSE Paper 1 Reading courseware (v1).
Design system: copied from 2024DSE-Paper1_v4 (fCC x Khan style).
New features: pixel-brick rate covers (2-click shatter) + Show Data button.
Part 1: helpers, passages, Part A slides.
"""
import html as _h

def esc(s):
    return _h.escape(s, quote=True)

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

def tfng_item(sub, stmt, ans, expl, pct):
    b = ""
    for v in ("T", "F", "NG"):
        b += f'<span class="tfng-btn" onclick="checkTFNG(this,\'{v}\')"><b>{v}</b></span>'
    return (f'<p style="font-size:20px;margin-bottom:8px"><strong>({sub})</strong> {stmt} {chip(pct)}</p>'
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

def split(left_title, paras, right):
    return (f'<div class="split-view"><div class="split-left" oncontextmenu="handleHighlight(event, this)">'
            f'<h4>{left_title}</h4>{paras}</div><div class="split-right">{right}</div></div>')

# ---------- passages ----------
T1 = {
"ad1t": "Are you looking for an experienced and patient piano teacher? I am an experienced pianist with professional training in piano performance and music theory. Have been teaching piano for over 25 years. Love teaching students from kindergarteners to those who have retired. Able to speak English / Mandarin / Cantonese / Korean. If interested, please call 2121 3456 for a complimentary lesson.",
"ad2t": "<strong>Advanced level guitar tuition in your home</strong> — I am a performing musician with over 15 years' experience in tutoring. Past students attended top music academies, have successful recording contracts, or work as musicians. I teach lessons for learners at intermediate level or higher.",
"ad3t": "<strong>I can coach you for all levels of drum exams from beginner to expert</strong> — New teacher qualified in UK. Conveniently located in Wan Chai. Build confidence and develop awareness of the drummer's role in a band. Call 2134 5678 to get a 30-minute trial lesson for $150.",
}

T2 = {
1: "'I won't be able to focus if you turn my music off,' a gazillion teenagers have whined at their parents. Is it possible that they're right?<br><br>Many people listen to music while they're carrying out a task, whether they're studying for an exam, driving a vehicle or even reading a book. Many of these people argue that background music helps them focus.",
2: "When you think about it, that doesn't make much sense. Why would having two things to concentrate on make you more focused, not less? Some people even go so far as to say that not having music on is more distracting.",
3: "Why would music help us concentrate? One argument is to do with attention. For all its amazing abilities, the brain hasn't really evolved to take in abstract information or spend prolonged periods thinking about one thing. We seem to have two attention systems: a conscious one that enables us to direct our focus towards things we know we want to concentrate on and an unconscious one that shifts attention towards anything our senses pick up that might be significant. The unconscious one is simpler, more fundamental, and linked to emotional processing rather than higher reasoning. It also operates faster. So when you hear a noise when you're alone at home, you're paying attention to it long before you consciously notice it and start to work out what it might have been. You can't help it.",
4: "The trouble is, while our conscious attention is focused on the task in hand, the unconscious attention system doesn't shut down; it's still very much online, scanning for anything important in your peripheral senses. And if what we're doing is unpleasant or dull &ndash; so you're already having to force your attention to stay fixed on it &ndash; the unconscious attention system is even more potent. This means that a distraction doesn't need to be as stimulating to divert your attention to something else.",
5: "Have you ever been working on a very important task in the library only to be driven slowly mad by someone constantly whispering, sniffing, or tapping their pen? Something quite innocuous suddenly becomes much more infuriating when you're trying to work on a task your brain doesn't necessarily enjoy.",
6: "Music is a very useful tool in such situations. It provides non-invasive noise and pleasurable feelings to effectively neutralise the unconscious attention system's ability to distract us. However, it's not just a matter of providing any old background noise to keep distractions at bay.",
7: "It seems clear that the type of noise, or music, is important. This may seem obvious: someone listening to classical music while they work wouldn't seem at all unusual, but if they were listening to heavy metal it would be thought very strange indeed.",
8: "While the nature and style of the music can cause specific responses in the brain (funky music compels you to dance, sad music makes you melancholic, motivational music makes you want to exercise), some studies suggest that it really is down to personal preference. Music you like increases focus, while music you don't impedes it. Given the extreme variation in musical preferences from person to person, exposing a classroom to a single type of music would obviously end up with mixed results.",
9: "Music also has a big impact on mood &ndash; truly bleak music could sap your enthusiasm for your task. Something else to look out for is music with catchy lyrics. Musical pieces without words might be better working companions, as human speech and vocalisation is something our brains pay particular attention to.",
10: "Some people argue that one of the best music genres for concentration is the video game soundtrack. This makes sense, when you consider the purpose of video game music: to help create an immersive environment and to facilitate but not distract from a task that requires constant attention and focus.",
11: "Limitations in the technology used for early game consoles meant the music also tended to be fairly simplistic in its melodies &ndash; think Tetris or Mario. In a somewhat Darwinian way, the music in video games has been refined over decades to be pleasant and entertaining, but not distracting. The composers have (probably unintentionally) been manipulating the attention systems in the brains of players for years now.",
12: "There are signs that, as technology progresses, this type of theme music is being abandoned, with game producers opting for anything from big orchestral pieces to hip-hop. The challenge will be to maintain the delicate balance of stimulation without distraction. To achieve this, game composers will need to stay focused, which is ironic.",
13: "So after knowing all this, how do you stop yourself getting distracted by noises around you? Perhaps it won't be a bad idea to keep your headphones and your favourite music close to hand.",
"comments": "<strong>Comments:</strong><br><br><strong>Laura</strong> 20 Aug 2017 17:56<br>I find it impossible to work with any music playing at all. I like music too much not to pay attention to it, whatever its quality and whatever I'm doing.<br><br><strong>Sandy</strong> 20 Aug 2017 15:11<br>Are you kidding? Am I alone in wanting peace and quiet... no sounds apart from the rain or wind.<br><br><strong>John</strong> 19 Aug 2017 22:34<br>All my life no one could understand how I was able to study and get good grades by listening to heavy metal music. I can't study without my brain being blasted by my tunes. Thank you for the article. I don't feel weird anymore.<br><br><strong>Leo</strong> 19 Aug 2017 20:06<br>Who knows? I can usually focus on my homework with music playing but I can't revise like that.",
}

T3 = {
1: "Bees are known for their role in producing honey and pollinating flowers to produce fruit. They can however become a threat to people when they build their hives near or inside homes. Bees are considered less dangerous than other stinging insects like wasps. In Hong Kong, honey bees and carpenter bees seldom sting unless they are provoked. However, there are aggressive species such as the Africanised honey bees that will sting humans. Fortunately they haven't been spotted in Hong Kong yet.",
2: "Insect stings should not be confused with insect bites.",
3: "An insect uses its sting as a form of defence when it perceives a threat either to itself or its colony. It stings by injecting poison into or under the skin. The effect is immediate and results in a sharp, burning sensation.",
4: "While some insects sting as a form of defence, some bite to draw blood. To give such insects time to feed, insect bites have evolved so that the pain is not as sharp as a sting and is usually felt only minutes later.",
5: "The most common insects that sting are wasps (including hornets) and bees. Wasps are the most aggressive and may sting with little provocation.",
6: "Bees are much less likely to sting, most commonly stinging when they are stood or sat on. The key sign of a bee sting is that the bee leaves its stinger lodged inside the skin and a venomous sac will continue to pump poison for more than a minute. In contrast, the only sign of a wasp sting is likely to be a small puncture hole in the skin.",
7: "If one is stung by a wasp or bee, the area around the sting will quickly redden and swell. The swelling will reduce after a few hours, but it may remain itchy for more than a day.",
8: "Some people are much more sensitive to insect stings than others, and young children tend to be particularly sensitive. There are practical steps that can be taken.",
9: "If stung by a bee, the pain will be reduced significantly if the stinger is removed promptly. This should be done carefully using sharp fingernails, tweezers or a knife &ndash; take great care not to squeeze the sting sac as this will inject more poison into the wound.",
10: "To clean the wound, wash it with soap and water and then reduce swelling by bathing in cold water or by covering it with a cold compress such as ice in a cloth (but never hold ice directly on the skin).",
11: "To relieve itching, apply an anti-histamine cream for bites and stings or take an oral anti-histamine tablet (a hay fever tablet).",
12: "Calamine lotion can also be applied to cool the wound and ease the itch. If the itching is severe, consult your pharmacist about steroid creams.",
13: "Bee stings have the potential for an allergic reaction, resulting in anaphylactic shock, a serious medical condition that requires immediate medical assistance and can even cause death.",
14: "However, the people at risk are the three percent of the population who are allergic to the poison in stings. An allergy to insect stings can develop in a person at any time, even if they have not reacted to a previous sting.",
15: "Call an ambulance immediately if someone has a severe reaction to an insect sting.",
}

T4 = {
1: "On the rooftops of Hong Kong amongst the high-rise apartments, a local product designer, Michael Leung, has created his own space and is bringing nature back into the city, one beehive at a time.",
2: "Michael Leung is the founder and creative director of HK Honey, an organisation that links local beekeepers with city dwellers by providing locally produced honey products. But the organisation's ultimate goal is to help sustain bee populations, which have been declining, while raising awareness by keeping a vital relationship between people and bees alive.",
3: "According to the HK Honey website, Leung is Hong Kong's first urban beekeeper, although beekeeping has been around in the outlying areas of Hong Kong for some time. In fact, Leung was trained by Mr. Yip, who has had a bee-farming operation in Shatin since the 1980's.",
4: "After they met in early 2010, an enthusiastic Leung had HK Honey up and running by that summer. Now it's uniting Hong Kong urban beekeepers from all walks of life. It links a network of local bee farms and offers workshops, organises tours on urban beekeeping and makes honey products. Its online shop also offers handmade products such as the usual candles and bottled honey, but honey cakes made from local ingredients are only available during their workshops.",
5: "Of course, it's interesting to know that there are slight differences between the western and Chinese ways of beekeeping, not to mention behavioural variances between Chinese and western bees.",
6: "There is a wide range of bee species kept by beekeepers in China, unlike in the west where commercial beekeepers usually rely on a single species. In contrast to the west, the Chinese approach to beekeeping uses no protective clothing &ndash; no gloves and no head nets. 'This gives us a closer connection to the bees. When we work with them, we make sure we move very slowly and try not to disturb them too much.' Leung says.",
7: "Hong Kong is an incredibly dense high-rise city. Leung wasn't 100% sure if bees could sustain themselves in Hong Kong's urban environment. Surprisingly and fortunately they did sustain themselves in the city, and continue to amaze him with each new location that he sets up a beehive in. The honey in Hong Kong is an eclectic mix of wild and seasonal flowers. But when we taste it, we also taste all the hard work that has gone into producing it. The honey is priceless and a real treat to harvest and eat.",
8: "Leung is a driven individual and is also channelling his energies into similar projects. He has established HK Farm, collaborating with communities and organisations within the city to grow food on the rooftops of Hong Kong.",
}

T5 = {
1: "The story begins in central China, in an apple-growing region called Maoxian County, near Chengdu. In the mid-1990s, the bees that regularly showed up there every spring suddenly didn't. Apple farmers, obviously, need bees. Bees dust their way through blossoms, moving from flower to flower, pollinating, which helps produce apples in September. The farmers had to do something, and do it quickly. So they decided to replace bees with humans. They pollinated by hand.",
2: "In 1997, Maoxian apple growers, using brushes made from chopsticks and chicken feathers, went from blossom to blossom &ndash; just as bees do, to spread pollen. Hired hands worked full shifts, moving up the hillsides as each orchard hit blossom-time. News stories were written about this, with the obvious conservation moral: see, biologists said, this is what happens when we don't take care of the little creatures like the pollinators. When they disappear, the work they did for free suddenly becomes expensive. That was the moral of this story &ndash; until some economists took a second look.",
3: "The economists arranged interviews in Maoxian County with the local farmers &ndash; first early in the 2000s, and again in 2011. What they learned was a shocker. First, the apple farmers reported that apple production was not hurt by the absence of bees. In fact, the apple harvest was 30 to 40 percent greater when humans did the pollinating. Human pollinators were better at getting to every blossom, performed cross-pollination more efficiently, and could work in windy, rainy weather.",
4: "Bees, you should know, are less dependable. They don't like working when it's wet, they sleep a lot and they don't like the cold. The economists seemed to turn the moral of this story on its head. They argued that destroying and replacing the free gifts of nature could be an economic benefit.",
5: "Woah! Well, you can imagine what the biologists must have thought. The economists said there are some critters we humans don't really need to have around to lead a good life. So let's not get hung up on biological diversity, because we can live fairly well &ndash; maybe even be better off &ndash; in a less diverse, biologically shrunken world.",
6: "Even though people outperformed bees in apple orchards, that should not argue for their elimination. On the contrary, the conservationists said, the Maoxian case study illustrated the danger of allowing the logic of the market to drive conservation policy. Those missing bees weren't valuable in Maoxian County, but that doesn't mean they don't have value. These decisions are much more complex.",
}

T6 = {
1: "Willie Robson drives his lorry up to his beehives on the heather moor at Hangwell Law in the north of England. Beekeepers have brought their hives onto these starkly beautiful moors for at least a millennium, and some still do. Heather honey, with its unique gel-like texture and room-filling fragrance, is one of the most prized in the world. In the pot, it glows fox-red, often beaded with little silver bubbles.",
2: "Willie takes off his hairy tweed cap and kits up in his bee-suit. Honey bees left alone do not sting: stinging might harm the intruder but it also kills the bee. The barbed lancets dig into the skin, pump poison into human flesh, and then cannot withdraw. Instead, the sting rips the centre from the bee's abdomen so the insect straggles towards death, its insides ripped out, pink and pulsing. But bees will die to protect the hive, just as they will fly ceaselessly to collect nectar and pollen so the hive's colony can live.",
3: "The armour of the apiarist is a bee-suit. Willie has a sort of khaki-green nylon flying suit, which zips across the body and then across the neck to close up the net-fronted hood. The legs are tucked into wellies and the arms into gloves, elastically at the wrists. In his suit, he walks around like a spaceman. Boots and gloves restrict some movement, but he goes slow-mo for another reason. 'You go with a quiet tread, or all hell breaks loose,' he says. 'It's a matter of weighing up the form. If trouble starts, you bail out.'",
4: "After finding a piece of hessian sacking among the bric-a-brac on the back of the lorry, Willie lights the cloth with a match and puts it in a smoker formed like a pair of miniature bellows. The smoke can help lull the bees. They think there is an emergency, eat their fill of honey as if ready for flight and become less aggressive, perhaps because less able to bend and sting. Willie takes the top off the first hive. Pffcccc, pffcccc, pffcccc, goes the smoke. After a short pause, he heaves off the top box. Immediately, its weight reveals the exact extent of the haul. Honey is half as heavy again as water and a full box tells on your muscles. Beekeeping, in some aspects, is like fishing: some years you get next-to-nothing, in others you crop gold. This year everything worked, both skill and luck came together, and it is boom time; the weather was good over the year. Willie and his family have kept bees here for over fifty years, and he is now reaping the rewards of knowing his turf and keeping bees that are well adapted to their environment. This trip to Hangwell Law comes after a run of collecting a bumper harvest of heather honeycomb in ten days. It does not happen every year, or even often. Some years he gets nothing at all. But today he gets 2,500 pounds of honey. Such is the drama of harvest.",
5: "The bees, in the meantime, go purposefully berserk. Zinging, small, aggressive atoms, gold in the late afternoon sun, attack again and again from different angles, trying to find a way into the bee-suit. Their persistence is unrelenting. Bees in the wild can burrow into the fur of an attacking bear, to sting the animal where it will hurt them hopping mad. In the same way, they seek the vulnerable chink in the beekeeper's second skin. A hole in the finger-tip of a glove, a stray stitch on the seam, will not go unpunished. You feel like a character within a video game, surrounded by flying attackers. The bee-suit is slightly claustrophobic, limiting your vision but not the sounds, nor the sudden sight of bees flying onto the net visor, inches from your eyes. Willie says the bees can get to people mentally. 'They get you on the shake,' he says. 'They undermine your confidence and go dab, dab, dab.' When a bee stings, a banana-like odour spreads in the air, attracting others to sting the same spot, like sharks drawn to blood pulsing through water.",
6: "Some beekeepers lose bees by carelessly crushing them under boxes as they work under the pressure of time and the bee-blitz. Willie knows that bees matter more than honey. He brushes insects off each box with gentle sweeps of bracken and the triumph he feels at the haul is as much about the bees as anything else. Man makes use of bees but only by respecting their nature.",
}

def P(d, keys):
    return "".join(para(k, d[k]) for k in keys)

slides = []

# ================= 1. COVER =================
cover = '''<div class="s1-card-wrapper">
    <div class="xdf-header-bar">
      <div class="xdf-logo-text">DSE READING <span>// 2018 真题</span></div>
      <div class="xdf-sub-text">Paper 1 · Reading</div>
    </div>
    <div style="padding:28px 32px">
      <div class="slide-h1" style="text-align:center;margin-bottom:6px">2018 HKDSE 英语 Paper 1</div>
      <div class="slide-h2" style="text-align:center;color:var(--fcc-purple-dark);margin-bottom:24px">Music · Bees · Sweetness and Light</div>
      <div style="display:flex;justify-content:center;margin-bottom:24px">
        <div class="teacher-badge">
          <div class="tb-avatar">成</div>
          <div class="tb-name">成雨老师</div>
          <div class="tb-tag">TEACHER</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:20px">
        <div class="class-badge">真题精讲 · 2018 阅读卷 · 全 71 题</div>
      </div>
      <div class="s1-meta-grid">
        <div class="s1-meta-card"><div class="sm-label">Part A 必做</div><div class="sm-value">Q1–Q22</div><div class="sm-sub">音乐教师广告 · 音乐与专注力</div></div>
        <div class="s1-meta-card"><div class="sm-label">Part B1 较易</div><div class="sm-value">Q23–Q45</div><div class="sm-sub">蜜蜂螫伤指南 · 香港城市养蜂人</div></div>
        <div class="s1-meta-card"><div class="sm-label">Part B2 困难</div><div class="sm-value">Q46–Q71</div><div class="sm-sub">人工授粉 · 甜蜜与光明</div></div>
      </div>
      <div class="timeline-row">
        <div class="tl-seg c1"><div class="seg-ph">Part A</div><div class="seg-name">Text 1–2</div><div class="sm-sub">音乐 + Q1–22</div></div>
        <div class="tl-seg c2"><div class="seg-ph">Part B1</div><div class="seg-name">Text 3–4</div><div class="sm-sub">蜜蜂指南 + Q23–45</div></div>
        <div class="tl-seg c3"><div class="seg-ph">Part B2</div><div class="seg-name">Text 5–6</div><div class="sm-sub">授粉·采蜜 + Q46–71</div></div>
        <div class="tl-seg c4"><div class="seg-ph">收尾</div><div class="seg-name">Done</div><div class="sm-sub">数据榜 + 复盘</div></div>
      </div>
    </div>
    <div class="xdf-grid-pattern"><span>USE ARROW KEYS // SWIPE TO NAVIGATE</span></div>
  </div>'''
slides.append(slide("封面", "cover", "开场", cover))

# ================= 2. Part A Entry Test =================
a_entry_cards = [
    ("complimentary", "免费的；赠送的"),
    ("tuition", "教学；授课"),
    ("intermediate", "中级的"),
    ("qualified", "持有资格的；合格的"),
    ("trial (lesson)", "试堂；试用"),
    ("whine", "抱怨；发牢骚"),
    ("peripheral", "外围的；周边的"),
    ("innocuous", "无害的"),
    ("neutralise", "抵消；中和"),
    ("melancholic", "忧郁的"),
]
body = ('<div class="sec-label">Part A · Entry Test · 入门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">核心词汇 Words — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 1–2 Music · 10 words · 每题 1 分</div>'
        + flip_grid(a_entry_cards))
slides.append(slide("Part A Entry Test", "entry-test", "Part A", body))

# ================= 3. Q1–Q3 · Text 1 =================
left = ('<h4>Text 1: Music Teachers — Classified Ads</h4>'
        '<div class="passage-excerpt"><div class="para-num">Ad 1</div>' + T1["ad1t"] + '</div>\n'
        '<div class="passage-excerpt"><div class="para-num">Ad 2</div>' + T1["ad2t"] + '</div>\n'
        '<div class="passage-excerpt"><div class="para-num">Ad 3</div>' + T1["ad3t"] + '</div>\n')

q1 = ('<div class="practice-mcq" id="q1-box"><div class="pmcq-label">Q1 · Find similar words · 3 marks '
      + chip([("(i)", 65), ("(ii)", 65), ("(iii)", 88)]) + '</div>'
      '<div class="pmcq-q">From the ads, find ONE word that has a similar meaning to each of the following. '
      '点击空格核对答案。</div>'
      '<table class="quiz-table"><tr><th>Word</th><th>From</th><th>Similar word in the text</th></tr>'
      '<tr><td><strong>(i)</strong> \'free\'</td><td>Classified Ad 1</td><td>' + cloze("complimentary") + '</td></tr>'
      '<tr><td><strong>(ii)</strong> \'schools\'</td><td>Classified Ad 2</td><td>' + cloze("academies") + '</td></tr>'
      '<tr><td><strong>(iii)</strong> \'teach\'</td><td>Classified Ad 3</td><td>' + cloze("coach") + '</td></tr></table>'
      '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 同义替换是 DSE 高频考点：'
      'free→complimentary · schools→academies · teach→coach。定位时先锁广告，再扫读找近义词。</span></div></div>')

q2 = mcq("q2i", "Q2(i) · MC · 1 mark", chip(77),
         "Which ad <strong>states the monthly fees</strong>?",
         [("A", "Ad 1", False, "Ad 1 只提供免费试课电话，没有学费。"),
          ("B", "Ad 2", False, "Ad 2 完全没提收费。"),
          ("C", "Ad 3", False, "Ad 3 只有 trial lesson $150（一次试堂费），不是 monthly fees。"),
          ("D", "X (None of the ads)", True, "")],
         "🔑 三则广告都没有写 monthly fees → 选 X。trial lesson fee ≠ monthly fees。")
q2b = mcq("q2ii", "Q2(ii) · MC · 1 mark", chip(70),
          "Which ad <strong>mentions the teacher's personality</strong>?",
          [("A", "Ad 1", True, ""),
           ("B", "Ad 2", False, "Ad 2 讲经验和学生成就，没讲性格。"),
           ("C", "Ad 3", False, "Ad 3 讲建立自信和角色认知，是教学方法。"),
           ("D", "X (None of the ads)", False, "Ad 1 明确说 patient。")])
q2c = mcq("q2iii", "Q2(iii) · MC · 1 mark", chip(55),
          "Which ad <strong>indicates that the teacher will travel to the student</strong>?",
          [("A", "Ad 1", False, "Ad 1 是学生去上免费试课。"),
           ("B", "Ad 2", True, ""),
           ("C", "Ad 3", False, "Ad 3 说 conveniently located in Wan Chai — 是教师固定地点。"),
           ("D", "X (None of the ads)", False, "Ad 2 标题就是 in your home。")],
          "🔑 'Advanced level guitar tuition <strong>in your home</strong>' → 上门教授。陷阱：Ad 3 的 located in Wan Chai 是反例。")

q3 = mcq("q3i", "Q3(i) · MC · 1 mark", chip(92),
         "Match the comment: <strong>I have the most teaching experience.</strong>",
         [("A", "Ad 1", True, ""),
          ("B", "Ad 2", False, "Ad 2 是 15 年经验，少于 Ad 1 的 25 年。"),
          ("C", "Ad 3", False, "Ad 3 是新到任教师。"),
          ("D", "Does not match any ad", False, "over 25 years = 最多经验。")])
q3b = mcq("q3ii", "Q3(ii) · MC · 1 mark", chip(75),
          "Match the comment: <strong>I teach different kinds of musical instruments.</strong>",
          [("A", "Ad 1", False, "Ad 1 只教钢琴。"),
           ("B", "Ad 2", False, "Ad 2 只教吉他。"),
           ("C", "Ad 3", False, "Ad 3 只教爵士鼓。"),
           ("D", "Does not match any ad", True, "")],
          "🔑 三则广告各只教一种乐器 → 不匹配任何广告。")
q3c = mcq("q3iii", "Q3(iii) · MC · 1 mark", chip(75),
          "Match the comment: <strong>I don't teach beginners.</strong>",
          [("A", "Ad 1", False, "Ad 1 从幼儿园小朋友教到退休人士。"),
           ("B", "Ad 2", True, ""),
           ("C", "Ad 3", False, "Ad 3 从 beginner 到 expert 都教。"),
           ("D", "Does not match any ad", False, "Ad 2: intermediate level or higher。")])

right = q1 + q2 + q2b + q2c + q3 + q3b + q3c
body = ('<div class="sec-label">Part A · Text 1 · Q1–Q3</div>'
        '<div class="slide-h3">Music Teachers — Classified Ads</div>'
        + split("Text 1: Three classified ads", left, right))
slides.append(slide("Q1–Q3 · Text 1", "practice", "Part A", body, "text1"))

# ================= 4. Q4–Q6 · Text 2 ¶1–4 =================
left = '<h4>Text 2: Can music really help you concentrate? (¶1–4)</h4>' + P(T2, [1, 2, 3, 4])

q4 = sa("q4", "Q4 · MC (choose TWO) · 2 marks", chip(85),
        "According to paragraph 1, people listen to music while carrying out a task. "
        "Which <strong>TWO</strong> activities below are <strong>NOT</strong> mentioned?",
        '<p>A. reading a book &nbsp; B. driving a vehicle &nbsp; C. moving boxes / doing exercise &nbsp; '
        'D. studying for an exam &nbsp; E. playing the guitar</p>'
        '<p><strong>Answer: C and E</strong></p>'
        '<p>&#182;1 只提到 studying for an exam · driving a vehicle · reading a book — C（搬箱子/运动）'
        '和 E（弹吉他）未提及。</p>')

q5 = sa("q5", "Q5 · Reference · 1 mark", chip(61),
        "What does <strong>'that'</strong> (line 5) refer to?",
        '<p><strong>(the idea that) (background) music helps people focus</strong></p>'
        '<p>&#182;2 首句 "When you think about it, <em>that</em> doesn\'t make much sense" — '
        'that 回指 &#182;1 结尾 "background music helps them focus" 这一想法。</p>')

q6 = ('<div class="practice-mcq" id="q6-box"><div class="pmcq-label">Q6 · Summary cloze · 7 marks '
      + chip([("(i)", 34), ("(ii)", 41), ("(iii)", 42), ("(iv)", 19), ("(v)", 31), ("(vi)", 24), ("(vii)", 8)])
      + '</div>'
      '<div class="pmcq-q">Complete the summary of paragraphs 3–4. Use <strong>ONE word</strong> for each blank.</div>'
      '<div class="card" style="padding:14px 18px;font-size:20px;line-height:2">'
      'The brain has not evolved to take in abstract information or think about one thing for long periods, '
      'so such tasks are (i) ' + cloze("difficult / hard / challenging / problematic") + ' for it. We have two attention '
      'systems. The conscious one operates at a (ii) ' + cloze("slower / lower") + ' speed than the unconscious one, which '
      'shifts our attention to anything (iii) ' + cloze("significant / important / vital / crucial") + ' that our senses '
      'pick up. The unconscious system is linked to (iv) ' + cloze("emotions / senses") + ' rather than higher reasoning. '
      'While we are working, it is (v) ' + cloze("still / always / also") + ' scanning our surroundings. If the task is '
      'unpleasant or dull, a distraction does not need to be very (vi) ' + cloze("stimulating / interesting") + ' to '
      'divert our attention, because the unconscious attention system is even (vii) '
      + cloze("stronger / greater") + ' then.</div>'
      '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 摘要填空三大坑：① 判断词性 '
      '（此处全为形容词）② 只填一个词 ③ 不重复摘要已有的信息。(vii) 是全卷最难题之一（8%）。</span></div></div>')

right = q4 + q5 + q6
body = ('<div class="sec-label">Part A · Text 2 · Q4–Q6</div>'
        '<div class="slide-h3">Can music help you concentrate? — Attention Systems</div>'
        + split("Text 2 (¶1–4)", left, right))
slides.append(slide("Q4–Q6 · Text 2 ¶1–4", "practice", "Part A", body, "text2"))

# ================= 5. Q7–Q10 · ¶3–5 =================
left = '<h4>Text 2: Can music really help you concentrate? (¶3–5)</h4>' + P(T2, [3, 4, 5])

q7 = mcq("q7", "Q7 · MC · 1 mark", chip(56),
         "What does <strong>'You can't help it'</strong> (line 14) mean?",
         [("A", "You cannot stop the noise.", False, "重点不是噪音能否停止，而是你无法不去注意它。"),
          ("B", "You have to focus on the noise.", True, ""),
          ("C", "You will feel scared when you hear the noise.", False, "与害怕无关。"),
          ("D", "You will definitely hear noises when home alone.", False, "不是关于一定会听到声音。")],
         "🔑 can't help doing = 忍不住做某事。上句说 you're paying attention to it long before you consciously notice it → 你不得不注意它。")

q8 = sa("q8", "Q8 · Find a word/phrase · 1 mark", chip(41),
        "Find a word or phrase that the writer uses in paragraph 4 to draw readers' attention to the fact "
        "that the unconscious attention system can cause us problems.",
        '<p><strong>(the) trouble (is)</strong></p>'
        '<p>&#182;4 开头 "The trouble is, ..." — 语篇标记词（discourse marker），提示下文讲问题所在。'
        '常见错误答案 potent 是具体细节词，不是作者用来引起读者注意的手段。</p>')

q9 = sa("q9", "Q9 · Reference · 1 mark", chip(32),
        "What does <strong>'it'</strong> (line 17) refer to?",
        '<p><strong>(the) unpleasant / dull task // (the) task in hand // what we are doing</strong></p>'
        '<p>&#182;4 "if what we\'re doing is unpleasant or dull &ndash; so you\'re already having to force your attention '
        'to stay fixed on <em>it</em>" — it = 那件枯燥的任务（单数特指）。典型错误：写成复数 doing tasks。</p>')

q10 = sa("q10", "Q10 · Find a word · 1 mark", chip(62),
         "Find a word in paragraph 5 which has a similar meaning to <strong>'harmless'</strong>.",
         '<p><strong>innocuous</strong></p>'
         '<p>&#182;5 "Something quite <em>innocuous</em> suddenly becomes much more infuriating..."</p>')

right = q7 + q8 + q9 + q10
body = ('<div class="sec-label">Part A · Text 2 · Q7–Q10</div>'
        '<div class="slide-h3">Distracted! — Library Madness</div>'
        + split("Text 2 (¶3–5)", left, right))
slides.append(slide("Q7–Q10 · ¶3–5", "practice", "Part A", body, "text2"))

# ================= 6. Q11–Q14 · ¶5–8 =================
left = '<h4>Text 2: Can music really help you concentrate? (¶5–8)</h4>' + P(T2, [5, 6, 7, 8])

q11 = sa("q11", "Q11 · Short answer · 1 mark", chip(75),
         "Give <strong>ONE</strong> example of a distraction mentioned in paragraph 5.",
         '<p><strong>sniffing // whispering // tapping a pen</strong></p>'
         '<p>&#182;5 "someone constantly <em>whispering, sniffing, or tapping their pen</em>" — 任写一个即可。</p>')

q12 = mcq("q12", "Q12 · MC · 1 mark", chip(47),
          "According to paragraph 6, the main benefit of listening to music when working on an important task in a library is to...",
          [("A", "stop the non-invasive noises.", False, "音乐本身就是 non-invasive noise，不是去停止它。"),
           ("B", "create enjoyment for the listener.", False, "pleasurable feelings 是手段，不是 main benefit。"),
           ("C", "neutralise the pleasurable feelings.", False, "是利用愉悦感去抵消，不是抵消愉悦感。"),
           ("D", "cancel the effect of the unconscious system.", True, "")],
          "🔑 &#182;6 \"neutralise the unconscious attention system's ability to distract us\" — 抵消无意识系统的干扰能力。")

q13 = mcq("q13", "Q13 · MC · 1 mark", chip(69),
          "When the writer says <strong>'it really is down to personal preference'</strong> (line 32), he/she means...",
          [("A", "people prefer to dance to funky music.", False, "例子细节，非本义。"),
           ("B", "people study while listening to catchy lyrics.", False, "与歌词无关。"),
           ("C", "people focus better listening to music they enjoy.", True, ""),
           ("D", "people make better choices when listening to music.", False, "无此意。")],
          "🔑 be down to = 取决于。下句 \"Music you like increases focus\" 直接解释了它。")

q14 = sa("q14", "Q14 · Find a word · 1 mark", chip(71),
         "Find a word in paragraph 8 which can be replaced by <strong>'reduces'</strong>.",
         '<p><strong>impedes</strong></p>'
         '<p>&#182;8 "Music you like increases focus, while music you don\'t <em>impedes</em> it." — '
         'increases 与 impedes 形成对比。</p>')

right = q11 + q12 + q13 + q14
body = ('<div class="sec-label">Part A · Text 2 · Q11–Q14</div>'
        '<div class="slide-h3">Music as a Tool — Type of Music</div>'
        + split("Text 2 (¶5–8)", left, right))
slides.append(slide("Q11–Q14 · ¶5–8", "practice", "Part A", body, "text2"))

# ================= 7. Q15–Q18 · ¶8–12 =================
left = '<h4>Text 2: Can music really help you concentrate? (¶8–12)</h4>' + P(T2, [8, 9, 10, 11, 12])

q15 = sa("q15", "Q15 · Short answer · 2 marks", chip(57),
         "Explain why playing only one type of music in a classroom would <strong>'end up with mixed results'</strong> (line 34).",
         '<p><strong>there is (extreme) variation in musical preferences // music is really down to personal '
         'preference so students may react differently // students will respond to the music in different ways</strong></p>'
         '<p>&#182;8 结尾 "Given the extreme variation in musical preferences from person to person, exposing a '
         'classroom to a single type of music would obviously end up with mixed results." — 因果就在上一句。</p>')

q16 = sa("q16", "Q16 · Reference · 1 mark", chip(9),
         "<strong>'Working companions'</strong> (line 36) refers to ______.",
         '<p><strong>musical pieces without words we listen to while working / doing a task</strong></p>'
         '<p>&#182;9 "Musical pieces without words might be better <em>working companions</em>" — working companions = '
         '前文的 musical pieces without words（隐喻：无词音乐是更好的工作伙伴）。仅 9% 正确：隐喻题不能照抄字面。</p>')

q17 = ('<div class="practice-mcq" id="q17-box"><div class="pmcq-label">Q17 · Timeline cloze · 6 marks '
       + chip([("(i)", 53), ("(ii)", 41), ("(iii)", 40), ("(iv)", 31), ("(v)", 47), ("(vi)", 60)]) + '</div>'
       '<div class="pmcq-q">Complete the timeline of video game music (paragraphs 11–12). Use <strong>ONE word</strong> '
       'from the text for each blank.</div>'
       '<table class="quiz-table"><tr><th>Stage</th><th>Timeline</th></tr>'
       '<tr><td>Early video games</td><td>technological ' + cloze("limitations") + '</td></tr>'
       '<tr><td></td><td>somewhat ' + cloze("simplistic") + ' music</td></tr>'
       '<tr><td>Next 10–20 years</td><td>music refined to be ' + cloze("entertaining / pleasant") + '</td></tr>'
       '<tr><td></td><td>without being ' + cloze("distracting") + ' for the players</td></tr>'
       '<tr><td>Latest development</td><td>advances in ' + cloze("technology") + '</td></tr>'
       '<tr><td></td><td>keeping the ' + cloze("balance / stimulation") + ' right</td></tr></table>'
       '<div class="method-wrap" style="display:none"><span class="method-badge">🔑 &#182;11 "Limitations in the '
       'technology... simplistic in its melodies" · "refined over decades to be pleasant and entertaining, but not '
       'distracting" · &#182;12 "as technology progresses... the delicate balance of stimulation without '
       'distraction"。</span></div></div>')

q18 = sa("q18", "Q18 · Short answer · 2 marks", chip(4),
         "Describe the <strong>irony</strong> in paragraph 12.",
         '<p><strong>game producers / composers have to stay focused to produce music which doesn\'t distract '
         'game players / helps players focus on the game</strong></p>'
         '<p>&#182;12 结尾 "To achieve this, game composers will need to stay focused, which is ironic." — '
         '讽刺点：写让人不分心的音乐的作曲家自己必须高度专注。全卷最难题（4%）：需要整段理解 + 发现错位。</p>')

right = q15 + q16 + q17 + q18
body = ('<div class="sec-label">Part A · Text 2 · Q15–Q18</div>'
        '<div class="slide-h3">Video Game Soundtracks — The Irony</div>'
        + split("Text 2 (¶8–12)", left, right))
slides.append(slide("Q15–Q18 · ¶8–12", "practice", "Part A", body, "text2"))

# ================= 8. Q19–Q22 · ¶10–13 + comments =================
left = ('<h4>Text 2: Can music really help you concentrate? (¶10–13 + Comments)</h4>'
        + P(T2, [10, 11, 12, 13])
        + '<div class="passage-excerpt"><div class="para-num">&#9998;</div>' + T2["comments"] + '</div>\n')

q19 = mcq("q19", "Q19 · MC · 1 mark", chip(58),
          "Which type of music is considered to be extremely useful in helping people concentrate?",
          [("A", "sad music", False, "&#182;9 说 bleak music 会消磨热情。"),
           ("B", "video game music", True, ""),
           ("C", "heavy metal music", False, "只是 John 的个人偏好。"),
           ("D", "motivational music", False, "只是例子细节。")],
          "🔑 &#182;10 \"one of the best music genres for concentration is the video game soundtrack\"。")

q20 = mcq("q20", "Q20 · MC · 1 mark", chip(80),
          "Which of the following is the <strong>best title</strong> for Text 2?",
          [("A", "Why is music important?", False, "文章不止讲音乐的重要性。"),
           ("B", "How does your brain function?", False, "大脑只是切入点。"),
           ("C", "Why does your brain like music?", False, "文章不是讲大脑为何喜欢音乐。"),
           ("D", "Can music really help you concentrate?", True, "")],
          "🔑 标题题：首段设问 \"Is it possible that they're right?\" + 全文围绕音乐与专注 → D。")

q21 = mcq("q21", "Q21 · MC · 1 mark", chip(46),
          "Which of the following best describes the <strong>intention</strong> of the writer of Text 2?",
          [("A", "To defend his point of view.", False, "作者不是在为自己辩护。"),
           ("B", "To present some new research.", False, "文中研究只是论据，非主要意图。"),
           ("C", "To explain a puzzling observation.", True, ""),
           ("D", "To persuade readers to change their habits.", False, "结尾只是温和建议，非说服改变习惯。")],
          "🔑 写作意图题：首段提出 puzzle（青少年说听音乐才能专注，对吗？）→ 全文解释这一现象 → C。")

q22a = mcq("q22i", "Q22(i) · MC · 1 mark", chip(65),
           "According to the comments, what is <strong>Laura's</strong> attitude to 'Music helps me study'?",
           [("A", "Agrees", False, "Laura 说 impossible to work with any music。"),
            ("B", "Disagrees", True, ""),
            ("C", "Neither agrees nor disagrees", False, "她明确反对。")])
q22b = mcq("q22ii", "Q22(ii) · MC · 1 mark", chip(67),
           "What is <strong>Sandy's</strong> attitude?",
           [("A", "Agrees", False, "Sandy 只想要 peace and quiet。"),
            ("B", "Disagrees", True, ""),
            ("C", "Neither agrees nor disagrees", False, "Are you kidding? 明确反对。")])
q22c = mcq("q22iii", "Q22(iii) · MC · 1 mark", chip(89),
           "What is <strong>John's</strong> attitude?",
           [("A", "Agrees", True, ""),
            ("B", "Disagrees", False, "I can't study without my tunes。"),
            ("C", "Neither agrees nor disagrees", False, "")])
q22d = mcq("q22iv", "Q22(iv) · MC · 1 mark", chip(69),
           "What is <strong>Leo's</strong> attitude?",
           [("A", "Agrees", False, "Leo 说复习时不行。"),
            ("B", "Disagrees", False, "做作业时可以。"),
            ("C", "Neither agrees nor disagrees", True, "")],
           "🔑 Who knows? I can usually focus on my homework with music playing but I can't revise like that — 两边都占。")

right = q19 + q20 + q21 + q22a + q22b + q22c + q22d
body = ('<div class="sec-label">Part A · Text 2 · Q19–Q22</div>'
        '<div class="slide-h3">Title · Intention · Readers\' Comments</div>'
        + split("Text 2 (¶10–13 + Comments)", left, right))
slides.append(slide("Q19–Q22 · Title & Comments", "practice", "Part A", body, "text2"))

# ================= 9. Part A Close Reading =================
cr = ('<div class="sec-label">Part A · Close Reading</div>'
      '<div class="slide-h2">信号词 Signal Words — 逐个点击揭示</div>'
      '<div class="card" style="padding:20px 24px;margin-top:12px;font-family:\'Times New Roman\',Times,serif;font-size:22px;line-height:1.9">'
      '<p>&#182;2 (Text 2): Some people even ' + sig("go so far as to say", "甚至说") + ' that not having music on is more distracting.</p>'
      '<p style="margin-top:14px">&#182;3: You\'re paying attention to it long before you consciously notice it... '
      + sig("You can't help it", "你根本控制不了") + '.</p>'
      '<p style="margin-top:14px">&#182;4: ' + sig("The trouble is", "问题在于") + ', while our conscious attention is '
      'focused on the task in hand, the unconscious attention system doesn\'t shut down... the unconscious attention '
      'system is even ' + sig("potent", "强大的") + '.</p>'
      '<p style="margin-top:14px">&#182;5: Something quite ' + sig("innocuous", "无害的") + ' suddenly becomes much more '
      + sig("infuriating", "令人发怒的") + '...</p>'
      '<p style="margin-top:14px">&#182;6: Music... provides non-invasive noise and pleasurable feelings to effectively '
      + sig("neutralise", "抵消") + ' the unconscious attention system\'s ability to distract us... to keep '
      + sig("distractions at bay", "挡住干扰") + '.</p>'
      '<p style="margin-top:14px">&#182;8: some studies suggest that ' + sig("it really is down to personal preference", "其实取决于个人喜好") + '. Music you like increases focus, while music you don\'t '
      + sig("impedes", "妨碍") + ' it.</p>'
      '<p style="margin-top:14px">&#182;9: Musical pieces without words might be better '
      + sig("working companions", "工作伙伴（隐喻：无词音乐）") + '.</p>'
      '<p style="margin-top:14px">&#182;12: game composers will need to stay focused, which is '
      + sig("ironic", "讽刺的") + '.</p></div>')
slides.append(slide("Part A · Close Reading", "close-reading", "Part A", cr))

# ================= 10. Part A Exit Test =================
a_exit_cards = [
    ("carry out (a task)", "执行；进行（一项任务）"),
    ("take in (information)", "吸收（信息）"),
    ("keep...at bay", "遏制；挡住"),
    ("be down to (preference)", "取决于（偏好）"),
    ("end up with (mixed results)", "落得（好坏参半的结果）"),
    ("sap your enthusiasm", "消磨热情"),
    ("look out for", "留意；提防"),
    ("go so far as to", "甚至做出……"),
    ("pay attention to", "注意；关注"),
    ("close to hand", "触手可及；在手边"),
]
body = ('<div class="sec-label">Part A · Exit Test · 出门测</div>'
        '<div class="slide-h3" style="margin-bottom:6px">动词短语 Verbs &amp; Phrases — tap to flip (英→中)</div>'
        '<div style="font-size:16px;color:var(--text-2);margin-bottom:16px">Text 1–2 Music · 10 items · 每题 1 分</div>'
        + flip_grid(a_exit_cards))
slides.append(slide("Part A Exit Test", "exit-test", "Part A", body))

# ================= 11. Part A Recap =================
recap = ('<div class="sec-label">Part A · Recap</div>'
         '<div class="slide-h2" style="margin-bottom:16px">Part A 复盘 — What did we learn?</div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128221; Exam Awareness</h4>'
         '<p>Text 1 = <strong>classified ads（分类广告）</strong>；Text 2 = <strong>科普评论文章</strong>（设问开头 + 网友评论）。'
         '文体题看标题 + 开头句式 + 是否有评论区。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#127919; 难点提醒</h4>'
         '<p>指代题向上找名词（Q5/Q9/Q16）；隐喻题不能照抄字面（working companions）；'
         '反讽题找错位（Q18 游戏作曲家必须专注）；摘要填空先判词性（Q6/Q17）。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128202; 2018 隐形数据 — 击碎砖块看看 Part A 最难题</h4>'
         '<p>Q18 辨识反讽 ' + chip(4) + ' · Q16 隐喻 working companions ' + chip(9) + ' · '
         'Q6(vii) 摘要 stronger ' + chip(8) + ' · Q6(iv) emotions ' + chip(19) + ' · '
         'Q9 指代 the dull task ' + chip(32) + ' — 高层理解（隐喻/反讽/语篇标记）是最大失分点。</p></div>'
         '<div class="card" style="margin-bottom:14px"><h4>&#128273; 金句</h4>'
         '<p>摘要填空三查：词性 · 单词数 · 不重复；照抄原文 ≠ 理解。</p></div>')
slides.append(slide("Part A · Recap", "exit-test", "Part A", recap))
