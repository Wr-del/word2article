// 英语词形还原工具 - 用于识别单词变形

// 不规则动词映射表（变形 -> 原形）
const IRREGULAR_VERBS: Record<string, string> = {
  // be 动词
  'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
  // have
  'had': 'have', 'having': 'have',
  // do
  'did': 'do', 'done': 'do', 'does': 'do', 'doing': 'do',
  // go
  'went': 'go', 'gone': 'go', 'goes': 'go', 'going': 'go',
  // say
  'said': 'say', 'says': 'say', 'saying': 'say',
  // take
  'took': 'take', 'taken': 'take', 'takes': 'take', 'taking': 'take',
  // come
  'came': 'come', 'comes': 'come', 'coming': 'come',
  // make
  'made': 'make', 'makes': 'make', 'making': 'make',
  // know
  'knew': 'know', 'known': 'know', 'knows': 'know', 'knowing': 'know',
  // think
  'thought': 'think', 'thinks': 'think', 'thinking': 'think',
  // get
  'got': 'get', 'gotten': 'get', 'gets': 'get', 'getting': 'get',
  // see
  'saw': 'see', 'seen': 'see', 'sees': 'see', 'seeing': 'see',
  // give
  'gave': 'give', 'given': 'give', 'gives': 'give', 'giving': 'give',
  // tell
  'told': 'tell', 'tells': 'tell', 'telling': 'tell',
  // find
  'found': 'find', 'finds': 'find', 'finding': 'find',
  // leave
  'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
  // call
  'called': 'call', 'calls': 'call', 'calling': 'call',
  // try
  'tried': 'try', 'tries': 'try', 'trying': 'try',
  // ask
  'asked': 'ask', 'asks': 'ask', 'asking': 'ask',
  // need
  'needed': 'need', 'needs': 'need', 'needing': 'need',
  // become
  'became': 'become', 'becomes': 'become', 'becoming': 'become',
  // keep
  'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
  // begin
  'began': 'begin', 'begins': 'begin', 'beginning': 'begin',
  // show
  'showed': 'show', 'shown': 'show', 'shows': 'show', 'showing': 'show',
  // hear
  'heard': 'hear', 'hears': 'hear', 'hearing': 'hear',
  // run
  'ran': 'run', 'runs': 'run', 'running': 'run',
  // bring
  'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
  // write
  'wrote': 'write', 'written': 'write', 'writes': 'write', 'writing': 'write',
  // stand
  'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
  // lose
  'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
  // pay
  'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
  // meet
  'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
  // sit
  'sat': 'sit', 'sits': 'sit', 'sitting': 'sit',
  // speak
  'spoke': 'speak', 'spoken': 'speak', 'speaks': 'speak', 'speaking': 'speak',
  // lie (躺)
  'lay': 'lie', 'lain': 'lie', 'lies': 'lie', 'lying': 'lie',
  // lead
  'led': 'lead', 'leads': 'lead', 'leading': 'lead',
  // grow
  'grew': 'grow', 'grown': 'grow', 'grows': 'grow', 'growing': 'grow',
  // fall
  'fell': 'fall', 'fallen': 'fall', 'falls': 'fall', 'falling': 'fall',
  // send
  'sent': 'send', 'sends': 'send', 'sending': 'send',
  // build
  'built': 'build', 'builds': 'build', 'building': 'build',
  // understand
  'understood': 'understand', 'understands': 'understand', 'understanding': 'understand',
  // draw
  'drew': 'draw', 'drawn': 'draw', 'draws': 'draw', 'drawing': 'draw',
  // break
  'broke': 'break', 'broken': 'break', 'breaks': 'break', 'breaking': 'break',
  // spend
  'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
  // cut
  'cut': 'cut', 'cuts': 'cut', 'cutting': 'cut',
  // rise
  'rose': 'rise', 'risen': 'rise', 'rises': 'rise', 'rising': 'rise',
  // drive
  'drove': 'drive', 'driven': 'drive', 'drives': 'drive', 'driving': 'drive',
  // eat
  'ate': 'eat', 'eaten': 'eat', 'eats': 'eat', 'eating': 'eat',
  // sing
  'sang': 'sing', 'sung': 'sing', 'sings': 'sing', 'singing': 'sing',
  // swim
  'swam': 'swim', 'swum': 'swim', 'swims': 'swim', 'swimming': 'swim',
  // drink
  'drank': 'drink', 'drunk': 'drink', 'drinks': 'drink', 'drinking': 'drink',
  // ring
  'rang': 'ring', 'rung': 'ring', 'rings': 'ring', 'ringing': 'ring',
  // shrink
  'shrank': 'shrink', 'shrunk': 'shrink', 'shrinks': 'shrink', 'shrinking': 'shrink',
  // sink
  'sank': 'sink', 'sunk': 'sink', 'sinks': 'sink', 'sinking': 'sink',
  // bear
  'bore': 'bear', 'born': 'bear', 'bears': 'bear', 'bearing': 'bear',
  // tear
  'tore': 'tear', 'torn': 'tear', 'tears': 'tear', 'tearing': 'tear',
  // wear
  'wore': 'wear', 'worn': 'wear', 'wears': 'wear', 'wearing': 'wear',
  // throw
  'threw': 'throw', 'thrown': 'throw', 'throws': 'throw', 'throwing': 'throw',
  // catch
  'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
  // choose
  'chose': 'choose', 'chosen': 'choose', 'chooses': 'choose', 'choosing': 'choose',
  // freeze
  'froze': 'freeze', 'frozen': 'freeze', 'freezes': 'freeze', 'freezing': 'freeze',
  // wake
  'woke': 'wake', 'woken': 'wake', 'wakes': 'wake', 'waking': 'wake',
  // bite
  'bit': 'bite', 'bitten': 'bite', 'bites': 'bite', 'biting': 'bite',
  // hide
  'hid': 'hide', 'hidden': 'hide', 'hides': 'hide', 'hiding': 'hide',
  // forgive
  'forgave': 'forgive', 'forgiven': 'forgive', 'forgives': 'forgive', 'forgiving': 'forgive',
  // shake
  'shook': 'shake', 'shaken': 'shake', 'shakes': 'shake', 'shaking': 'shake',
  // ride
  'rode': 'ride', 'ridden': 'ride', 'rides': 'ride', 'riding': 'ride',
  // hang
  'hung': 'hang', 'hangs': 'hang', 'hanging': 'hang',
  // win
  'won': 'win', 'wins': 'win', 'winning': 'win',
  // teach
  'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
  // hold
  'held': 'hold', 'holds': 'hold', 'holding': 'hold',
  // fight
  'fought': 'fight', 'fights': 'fight', 'fighting': 'fight',
  // sell
  'sold': 'sell', 'sells': 'sell', 'selling': 'sell',
  // shoot
  'shot': 'shoot', 'shoots': 'shoot', 'shooting': 'shoot',
  // feed
  'fed': 'feed', 'feeds': 'feed', 'feeding': 'feed',
  // feel
  'felt': 'feel', 'feels': 'feel', 'feeling': 'feel',
  // sleep
  'slept': 'sleep', 'sleeps': 'sleep', 'sleeping': 'sleep',
  // lend
  'lent': 'lend', 'lends': 'lend', 'lending': 'lend',
  // mean
  'meant': 'mean', 'means': 'mean', 'meaning': 'mean',
  // deal
  'dealt': 'deal', 'deals': 'deal', 'dealing': 'deal',
  // seek
  'sought': 'seek', 'seeks': 'seek', 'seeking': 'seek',
  // flee
  'fled': 'flee', 'flees': 'flee', 'fleeing': 'flee',
  // speed
  'sped': 'speed', 'speeds': 'speed', 'speeding': 'speed',
  // light
  'lit': 'light', 'lights': 'light', 'lighting': 'light',
  // spin
  'spun': 'spin', 'spins': 'spin', 'spinning': 'spin',
  // spit
  'spat': 'spit', 'spits': 'spit', 'spitting': 'spit',
  // split
  'split': 'split', 'splits': 'split', 'splitting': 'split',
  // cast
  'cast': 'cast', 'casts': 'cast', 'casting': 'cast',
  // thrust
  'thrust': 'thrust', 'thrusts': 'thrust', 'thrusting': 'thrust',
  // burst
  'burst': 'burst', 'bursts': 'burst', 'bursting': 'burst',
  // cost
  'cost': 'cost', 'costs': 'cost', 'costing': 'cost',
  // hurt
  'hurt': 'hurt', 'hurts': 'hurt', 'hurting': 'hurt',
  // shut
  'shut': 'shut', 'shuts': 'shut', 'shutting': 'shut',
  // put
  'put': 'put', 'puts': 'put', 'putting': 'put',
  // set
  'set': 'set', 'sets': 'set', 'setting': 'set',
  // bet
  'bet': 'bet', 'bets': 'bet', 'betting': 'bet',
  // let
  'let': 'let', 'lets': 'let', 'letting': 'let',
  // spread
  'spread': 'spread', 'spreads': 'spread', 'spreading': 'spread',
}

// 不规则名词复数映射表（复数 -> 单数）
const IRREGULAR_NOUNS: Record<string, string> = {
  'children': 'child',
  'men': 'man',
  'women': 'woman',
  'teeth': 'tooth',
  'feet': 'foot',
  'geese': 'goose',
  'mice': 'mouse',
  'lice': 'louse',
  'oxen': 'ox',
  'phenomena': 'phenomenon',
  'criteria': 'criterion',
  'data': 'datum',
  'alumni': 'alumnus',
  'alumnae': 'alumna',
  'cacti': 'cactus',
  'fungi': 'fungus',
  'nuclei': 'nucleus',
  'stimuli': 'stimulus',
  'syllabi': 'syllabus',
  'theses': 'thesis',
  'analyses': 'analysis',
  'diagnoses': 'diagnosis',
  'parentheses': 'parenthesis',
  'prognoses': 'prognosis',
  'synopses': 'synopsis',
  'ellipses': 'ellipsis',
  'hypotheses': 'hypothesis',
  'oases': 'oasis',
  'crises': 'crisis',
  'appendices': 'appendix',
  'indices': 'index',
  'matrices': 'matrix',
  'vertices': 'vertex',
  'vortices': 'vortex',
}

// 形容词/副词变形映射
const IRREGULAR_ADJECTIVES: Record<string, string> = {
  'better': 'good',
  'best': 'good',
  'worse': 'bad',
  'worst': 'bad',
  'further': 'far',
  'furthest': 'far',
  'farther': 'far',
  'farthest': 'far',
  'less': 'little',
  'least': 'little',
  'more': 'many',
  'most': 'many',
}

// 变形类型枚举
export type DeformationType =
  | '过去式'
  | '过去分词'
  | '进行时'
  | '第三人称单数'
  | '复数'
  | '比较级'
  | '最高级'
  | '副词'
  | '名词形式'
  | '动词形式'
  | '形容词形式'
  | '其他变形'

export interface Deformation {
  original: string      // 原形
  deformed: string      // 文中变形
  type: DeformationType  // 变形类型
  chinese?: string      // 中文释义（可选）
}

/**
 * 将单词还原为可能的原形
 * 返回多个候选原形，因为一个变形可能对应多个原形
 */
export function getLemmas(word: string): string[] {
  const lower = word.toLowerCase()
  const lemmas: string[] = []

  // 1. 检查不规则动词
  if (IRREGULAR_VERBS[lower]) {
    lemmas.push(IRREGULAR_VERBS[lower])
  }

  // 2. 检查不规则名词
  if (IRREGULAR_NOUNS[lower]) {
    lemmas.push(IRREGULAR_NOUNS[lower])
  }

  // 3. 检查不规则形容词
  if (IRREGULAR_ADJECTIVES[lower]) {
    lemmas.push(IRREGULAR_ADJECTIVES[lower])
  }

  // 4. 规则变形处理
  for (const rule of LEMMA_RULES) {
    if (rule.pattern.test(lower)) {
      const lemma = lower.replace(rule.pattern, rule.replacement)
      if (lemma !== lower && lemma.length >= 2) {
        lemmas.push(lemma)
      }
    }
  }

  // 去重
  return [...new Set(lemmas)]
}

const LEMMA_RULES: Array<{ pattern: RegExp; replacement: string; type: DeformationType }> = [
    // 动词变形
    { pattern: /ied$/, replacement: 'y', type: '过去式' },  // studied -> study
    { pattern: /([^aeiou])ies$/, replacement: '$1y', type: '复数' },  // cities -> city
    { pattern: /(?:sh|ch|ss|x|z|o)es$/, replacement: '', type: '复数' },  // boxes -> box
    { pattern: /ves$/, replacement: 'f', type: '复数' },  // leaves -> leaf
    { pattern: /ves$/, replacement: 'fe', type: '复数' },  // knives -> knife
    { pattern: /([^s])es$/, replacement: '$1', type: '复数' },  // horses -> horse
    { pattern: /([^aeiouy][aeiouy])([^aeiouy])ed$/, replacement: '$1$2', type: '过去式' },  // stopped -> stop
    { pattern: /([^e])ed$/, replacement: '$1e', type: '过去式' },  // hoped -> hope
    { pattern: /ed$/, replacement: '', type: '过去式' },  // walked -> walk
    { pattern: /([^aeiouy][aeiouy])([^aeiouy])ing$/, replacement: '$1$2', type: '进行时' },  // running -> run
    { pattern: /([^e])ing$/, replacement: '$1e', type: '进行时' },  // hoping -> hope
    { pattern: /ing$/, replacement: '', type: '进行时' },  // walking -> walk
    { pattern: /([^aeiouy][aeiouy])([^aeiouy])er$/, replacement: '$1$2', type: '比较级' },  // bigger -> big
    { pattern: /([^e])er$/, replacement: '$1e', type: '比较级' },  // nicer -> nice
    { pattern: /er$/, replacement: '', type: '比较级' },  // taller -> tall
    { pattern: /([^aeiouy][aeiouy])([^aeiouy])est$/, replacement: '$1$2', type: '最高级' },  // biggest -> big
    { pattern: /([^e])est$/, replacement: '$1e', type: '最高级' },  // nicest -> nice
    { pattern: /est$/, replacement: '', type: '最高级' },  // tallest -> tall
    { pattern: /([^aeiouy][aeiouy])([^aeiouy])ly$/, replacement: '$1$2', type: '副词' },  // happily -> happy
    { pattern: /([^l])ly$/, replacement: '$1', type: '副词' },  // slowly -> slow
    { pattern: /([^aeiouy])ily$/, replacement: 'y', type: '副词' },  // happily -> happy
    { pattern: /ally$/, replacement: '', type: '副词' },  // basically -> basic
    { pattern: /ly$/, replacement: '', type: '副词' },  // simply -> simple
    { pattern: /([^s])s$/, replacement: '$1', type: '第三人称单数' },  // walks -> walk

    // 名词后缀变形 (动词/形容词 -> 名词)
    { pattern: /ation$/, replacement: 'e', type: '名词形式' },  // creation -> create
    { pattern: /ation$/, replacement: '', type: '名词形式' },  // relaxation -> relax
    { pattern: /tion$/, replacement: 'te', type: '名词形式' },  // exhaustion -> exhauste (不常见)
    { pattern: /tion$/, replacement: 't', type: '名词形式' },  // collection -> collect
    { pattern: /tion$/, replacement: '', type: '名词形式' },  // exhaustion -> exhaust (特殊)
    { pattern: /sion$/, replacement: 'de', type: '名词形式' },  // decision -> decide
    { pattern: /sion$/, replacement: 'd', type: '名词形式' },  // expansion -> expand
    { pattern: /sion$/, replacement: '', type: '名词形式' },  // tension -> tens
    { pattern: /ment$/, replacement: '', type: '名词形式' },  // movement -> move
    { pattern: /ment$/, replacement: 'e', type: '名词形式' },  // management -> manage
    { pattern: /ness$/, replacement: '', type: '名词形式' },  // darkness -> dark
    { pattern: /ness$/, replacement: 'y', type: '名词形式' },  // happiness -> happy
    { pattern: /ity$/, replacement: 'e', type: '名词形式' },  // activity -> active
    { pattern: /ity$/, replacement: '', type: '名词形式' },  // curiosity -> curious
    { pattern: /ance$/, replacement: '', type: '名词形式' },  // resistance -> resist
    { pattern: /ance$/, replacement: 'e', type: '名词形式' },  // acceptance -> accept
    { pattern: /ence$/, replacement: '', type: '名词形式' },  // existence -> exist
    { pattern: /ence$/, replacement: 'e', type: '名词形式' },  // confidence -> confide
    { pattern: /ure$/, replacement: '', type: '名词形式' },  // failure -> fail
    { pattern: /ure$/, replacement: 'e', type: '名词形式' },  // pressure -> presse
    { pattern: /al$/, replacement: '', type: '名词形式' },  // arrival -> arriv
    { pattern: /al$/, replacement: 'e', type: '名词形式' },  // removal -> remove

    // 动词后缀变形 (名词/形容词 -> 动词)
    { pattern: /ize$/, replacement: '', type: '动词形式' },  // organize -> organ
    { pattern: /ize$/, replacement: 'y', type: '动词形式' },  // categorize -> category
    { pattern: /ify$/, replacement: '', type: '动词形式' },  // simplify -> simpl
    { pattern: /ify$/, replacement: 'y', type: '动词形式' },  // classify -> class
    { pattern: /fy$/, replacement: '', type: '动词形式' },  // satisfy -> satisf

    // 形容词后缀变形 (名词 -> 形容词)
    { pattern: /ful$/, replacement: '', type: '形容词形式' },  // helpful -> help
    { pattern: /ful$/, replacement: 'y', type: '形容词形式' },  // beautiful -> beauty
    { pattern: /less$/, replacement: '', type: '形容词形式' },  // helpless -> help
    { pattern: /ous$/, replacement: '', type: '形容词形式' },  // dangerous -> danger
    { pattern: /ous$/, replacement: 'y', type: '形容词形式' },  // curious -> curi
    { pattern: /ive$/, replacement: '', type: '形容词形式' },  // creative -> creat
    { pattern: /ive$/, replacement: 'e', type: '形容词形式' },  // passive -> passe
    { pattern: /able$/, replacement: '', type: '形容词形式' },  // comfortable -> comfort
    { pattern: /able$/, replacement: 'e', type: '形容词形式' },  // reliable -> relie
    { pattern: /ible$/, replacement: '', type: '形容词形式' },  // responsible -> respons
    { pattern: /ical$/, replacement: 'y', type: '形容词形式' },  // historical -> history
    { pattern: /ical$/, replacement: '', type: '形容词形式' },  // musical -> music
    { pattern: /al$/, replacement: '', type: '形容词形式' },  // natural -> natur
    { pattern: /al$/, replacement: 'e', type: '形容词形式' },  // cultural -> culture
]

/**
 * 判断变形类型
 */
export function getDeformationType(original: string, deformed: string): DeformationType {
  const orig = original.toLowerCase()
  const def = deformed.toLowerCase()

  // 检查不规则映射
  if (IRREGULAR_VERBS[def] === orig) {
    // 根据变形特征判断类型
    if (def.endsWith('ed') || def === 'was' || def === 'were' || def === 'did') return '过去式'
    if (def.endsWith('en') || def === 'been' || def === 'done' || def === 'gone') return '过去分词'
    if (def.endsWith('ing')) return '进行时'
    if (def.endsWith('s') || def === 'does') return '第三人称单数'
    return '其他变形'
  }

  if (IRREGULAR_NOUNS[def] === orig) return '复数'
  if (IRREGULAR_ADJECTIVES[def] === orig) return '比较级'

  // 规则变形判断
  if (def.endsWith('ed')) return '过去式'
  if (def.endsWith('ing')) return '进行时'
  if (def.endsWith('er')) return '比较级'
  if (def.endsWith('est')) return '最高级'
  if (def.endsWith('ly')) return '副词'
  if (def.endsWith('s') || def.endsWith('es') || def.endsWith('ies')) return '复数'

  // 名词后缀
  if (def.endsWith('tion') || def.endsWith('sion') || def.endsWith('ation')) return '名词形式'
  if (def.endsWith('ment') || def.endsWith('ness') || def.endsWith('ity')) return '名词形式'
  if (def.endsWith('ance') || def.endsWith('ence') || def.endsWith('ure')) return '名词形式'

  // 动词后缀
  if (def.endsWith('ize') || def.endsWith('ify') || def.endsWith('fy')) return '动词形式'

  // 形容词后缀
  if (def.endsWith('ful') || def.endsWith('less') || def.endsWith('ous')) return '形容词形式'
  if (def.endsWith('ive') || def.endsWith('able') || def.endsWith('ible')) return '形容词形式'
  if (def.endsWith('ical') || def.endsWith('al')) return '形容词形式'

  return '其他变形'
}

/**
 * 从文章中提取所有单词（保留位置信息）
 */
export function extractWordsFromContent(content: string): Array<{ word: string; index: number }> {
  const words: Array<{ word: string; index: number }> = []
  // 移除 ** 标记，但保留单词
  const cleanContent = content.replace(/\*\*/g, '')
  // 匹配英文单词（可能包含连字符或撇号）
  const regex = /\b[a-zA-Z]+(?:[''-][a-zA-Z]+)*\b/g
  let match

  while ((match = regex.exec(cleanContent)) !== null) {
    words.push({
      word: match[0],
      index: match.index
    })
  }

  return words
}

/**
 * 核心函数：对比原始单词列表和文章内容，找出变形
 * @param originalWords 原始单词列表
 * @param articleContent 文章内容
 * @param wordDefinitions 单词释义映射（可选）
 * @returns 变形对照列表
 */
export function findDeformations(
  originalWords: string[],
  articleContent: string,
  wordDefinitions?: Record<string, string>
): Deformation[] {
  const deformations: Deformation[] = []
  const articleWords = extractWordsFromContent(articleContent)

  // 创建原始单词集合（小写）
  const originalSet = new Set(originalWords.map(w => w.toLowerCase()))

  // 遍历文章中的每个单词
  for (const { word: articleWord } of articleWords) {
    const lowerArticleWord = articleWord.toLowerCase()

    // 跳过不在原始列表中的单词（原形匹配）
    if (originalSet.has(lowerArticleWord)) {
      continue
    }

    // 获取这个单词可能的原形
    const possibleLemmas = getLemmas(articleWord)

    // 检查是否有原形在原始列表中
    for (const lemma of possibleLemmas) {
      if (originalSet.has(lemma.toLowerCase())) {
        // 找到变形！
        const type = getDeformationType(lemma, articleWord)

        // 避免重复
        const exists = deformations.some(
          d => d.original === lemma && d.deformed === articleWord
        )

        if (!exists) {
          deformations.push({
            original: lemma,
            deformed: articleWord,
            type: type,
            chinese: wordDefinitions?.[lemma]
          })
        }
        break  // 找到一个匹配就够了
      }
    }
  }

  // 按原形排序
  return deformations.sort((a, b) => a.original.localeCompare(b.original))
}

/**
 * 简化版：只判断单词是否是某个原始单词的变形
 */
export function isDeformationOf(word: string, originalWord: string): boolean {
  const lowerWord = word.toLowerCase()
  const lowerOriginal = originalWord.toLowerCase()

  // 直接匹配
  if (lowerWord === lowerOriginal) return false  // 不是变形，是原形

  // 获取可能的原形
  const lemmas = getLemmas(word)
  return lemmas.some(l => l.toLowerCase() === lowerOriginal)
}

/**
 * 批量查找变形（优化版本，适合大量单词）
 */
export function findDeformationsBatch(
  originalWords: string[],
  articleWords: string[]
): Map<string, string[]> {
  const result = new Map<string, string[]>()

  // 创建原始单词索引
  const originalIndex = new Map<string, string>()
  for (const word of originalWords) {
    originalIndex.set(word.toLowerCase(), word)
  }

  // 遍历文章单词
  for (const articleWord of articleWords) {
    const lower = articleWord.toLowerCase()

    // 跳过原形
    if (originalIndex.has(lower)) continue

    // 获取可能的原形
    const lemmas = getLemmas(articleWord)

    for (const lemma of lemmas) {
      const original = originalIndex.get(lemma.toLowerCase())
      if (original) {
        if (!result.has(original)) {
          result.set(original, [])
        }
        const deformations = result.get(original)!
        if (!deformations.includes(articleWord)) {
          deformations.push(articleWord)
        }
      }
    }
  }

  return result
}