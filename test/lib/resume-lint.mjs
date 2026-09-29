// Deterministic lint for resume bullets.
//
// JSON Schema can prove a bullet is *well-formed* and *traceable* (it has an id
// and at least one claimId). It cannot prove the bullet is *worth reading*.
// policies/resume-writing-policy.md spends most of its length on that, and its
// Rule 2 ("avoid vague duty statements") is precisely checkable by pattern, so
// it is encoded here rather than left to a human/LLM review.
//
// This lint is deliberately conservative: it only flags phrasings the policy
// names explicitly, so a hit is a real policy violation, not a style opinion.

const BANNED_PATTERNS = [
  { re: /负责[^。；]*相关/, label: 'Rule 2: 空泛职责句「负责…相关」' },
  { re: /相关能力建设/, label: 'Rule 2: 空泛职责句「…相关能力建设」' },
  { re: /参与[^。；]*(项目|建设|开发)/, label: 'Rule 2: 空泛职责句「参与…项目/建设/开发」' },
  { re: /熟悉并?使用/, label: 'Rule 2: 技能罗列「熟悉并使用…」' },
  { re: /^完成[^。；]*功能[。；]?$/, label: 'Rule 2: 无机制「完成…功能」' },
  { re: /负责日常[^。；]*/, label: 'Rule 2: 低信息密度「负责日常…」' },
];

/** @returns {string[]} policy labels violated by this bullet text ([] = clean) */
export function lintBullet(text) {
  const hits = [];
  for (const { re, label } of BANNED_PATTERNS) {
    if (re.test(String(text || ''))) hits.push(label);
  }
  return hits;
}

/**
 * Flatten every bullet in a Resume View, including summaryBullets and subBlocks.
 *
 * The Resume View keeps the skill's own content slots — `sections[].entries[]`
 * with `summaryBullets / bullets / subBlocks` — and the renderer maps those onto
 * the Kami DOM for styling. So the lint walks the slots, not the rendered markup.
 *
 * Each entry carries `claimIds` and `metricIds` so callers can assert provenance
 * (e.g. "every claim is Strategy-selected, every metric is confirmed").
 */
export function collectBullets(resumeView) {
  const out = [];
  for (const sec of resumeView.sections || []) {
    for (const en of sec.entries || []) {
      const push = (bullets, where) => {
        for (const b of bullets || []) {
          const isObj = b && typeof b === 'object';
          out.push({
            id: isObj ? b.id : undefined,
            text: isObj ? b.text : b,
            claimIds: (isObj && b.claimIds) || [],
            metricIds: (isObj && b.metricIds) || [],
            where,
          });
        }
      };
      push(en.summaryBullets, `${sec.type}/summary`);
      push(en.bullets, sec.type);
      for (const sub of en.subBlocks || []) push(sub.bullets, `${sec.type}/${sub.title}`);
    }
  }
  return out;
}

/** @returns {Array<{id:string|undefined,text:string,reasons:string[]}>} */
export function lintResumeView(resumeView) {
  const problems = [];
  for (const b of collectBullets(resumeView)) {
    const reasons = lintBullet(b.text);
    if (reasons.length) problems.push({ id: b.id, text: b.text, reasons });
  }
  return problems;
}
