export interface DiffToken {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export interface DeterministicDiffResult {
  tokens: DiffToken[];
  addedCount: number;
  removedCount: number;
  sameCount: number;
  similarityPercent: number;
  algorithmUsed: 'EXACT_MATCH' | 'WORD_LCS' | 'HIERARCHICAL_SENTENCE_WORD_LCS';
}

function tokenizeWords(text: string): string[] {
  return text.trim().split(/(\s+)/).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .trim()
    .split(/(?<=[.;\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Thuật toán LCS cấp từ cho 2 đoạn ngắn (tối đa 500 token mỗi bên).
 */
function runWordLcs(aWords: string[], bWords: string[]): DiffToken[] {
  const m = aWords.length;
  const n = bWords.length;
  const dp: Int32Array[] = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aWords[i] === bWords[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rawTokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aWords[i] === bWords[j]) {
      rawTokens.push({ type: 'same', text: aWords[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawTokens.push({ type: 'removed', text: aWords[i] });
      i++;
    } else {
      rawTokens.push({ type: 'added', text: bWords[j] });
      j++;
    }
  }
  while (i < m) {
    rawTokens.push({ type: 'removed', text: aWords[i++] });
  }
  while (j < n) {
    rawTokens.push({ type: 'added', text: bWords[j++] });
  }

  return rawTokens;
}

function mergeConsecutiveTokens(rawTokens: DiffToken[]): DiffToken[] {
  const merged: DiffToken[] = [];
  for (const tk of rawTokens) {
    const last = merged[merged.length - 1];
    if (last && last.type === tk.type) {
      last.text += tk.text;
    } else {
      merged.push({ ...tk });
    }
  }
  return merged;
}

/**
 * Bộ so sánh văn bản pháp luật tất định 2 pha (Two-Stage Hierarchical Deterministic Diff Engine).
 * Khắc phục triệt để lỗi P2-02 (trong SideBySideComparisonView.tsx dòng 58-68 từng gán cứng similarityPercent: 45
 * khi a.length * b.length > 250000).
 *
 * - Với đoạn ngắn (<= 250.000 tích độ dài từ): Chạy Word-level LCS trực tiếp.
 * - Với điều khoản dài (> 250.000 tích độ dài từ): Chạy Sentence/Clause-level LCS trước,
 *   các câu giống nhau giữ nguyên 100%, các câu thay đổi liền kề được chạy tiếp Word-level LCS theo từng cụm.
 * - Luôn tính `similarityPercent` chính xác từ số từ trùng khớp thực tế:
 *   `Math.round((2 * sameCount) / (2 * sameCount + addedCount + removedCount) * 100)`.
 */
export function computeDeterministicDiff(
  oldText: string,
  newText: string
): DeterministicDiffResult {
  const cleanOld = (oldText || '').trim();
  const cleanNew = (newText || '').trim();

  if (cleanOld === cleanNew) {
    const wordCount = cleanOld ? cleanOld.split(/\s+/).filter(Boolean).length : 0;
    return {
      tokens: cleanOld ? [{ type: 'same', text: cleanOld }] : [],
      addedCount: 0,
      removedCount: 0,
      sameCount: wordCount,
      similarityPercent: 100,
      algorithmUsed: 'EXACT_MATCH',
    };
  }

  const aTokens = tokenizeWords(cleanOld);
  const bTokens = tokenizeWords(cleanNew);

  let rawDiffTokens: DiffToken[] = [];
  let algorithmUsed: DeterministicDiffResult['algorithmUsed'] = 'WORD_LCS';

  if (aTokens.length * bTokens.length <= 250000) {
    rawDiffTokens = runWordLcs(aTokens, bTokens);
  } else {
    // Pha 1: Tách theo câu/khoản và chạy LCS cấp câu
    algorithmUsed = 'HIERARCHICAL_SENTENCE_WORD_LCS';
    const aSentences = splitSentences(cleanOld);
    const bSentences = splitSentences(cleanNew);
    const sm = aSentences.length;
    const sn = bSentences.length;
    const sdp: Int32Array[] = Array.from({ length: sm + 1 }, () => new Int32Array(sn + 1));

    for (let i = sm - 1; i >= 0; i--) {
      for (let j = sn - 1; j >= 0; j--) {
        if (aSentences[i] === bSentences[j]) {
          sdp[i][j] = 1 + sdp[i + 1][j + 1];
        } else {
          sdp[i][j] = Math.max(sdp[i + 1][j], sdp[i][j + 1]);
        }
      }
    }

    let i = 0;
    let j = 0;
    let pendingRemoved: string[] = [];
    let pendingAdded: string[] = [];

    const flushPending = () => {
      if (pendingRemoved.length === 0 && pendingAdded.length === 0) return;
      const subOld = pendingRemoved.join(' ');
      const subNew = pendingAdded.join(' ');
      const subA = tokenizeWords(subOld);
      const subB = tokenizeWords(subNew);
      if (subA.length * subB.length <= 250000) {
        rawDiffTokens.push(...runWordLcs(subA, subB));
      } else {
        if (subOld) rawDiffTokens.push({ type: 'removed', text: subOld });
        if (subNew) rawDiffTokens.push({ type: 'added', text: (subOld ? ' ' : '') + subNew });
      }
      rawDiffTokens.push({ type: 'same', text: ' ' });
      pendingRemoved = [];
      pendingAdded = [];
    };

    while (i < sm && j < sn) {
      if (aSentences[i] === bSentences[j]) {
        flushPending();
        rawDiffTokens.push({ type: 'same', text: aSentences[i] + ' ' });
        i++;
        j++;
      } else if (sdp[i + 1][j] >= sdp[i][j + 1]) {
        pendingRemoved.push(aSentences[i++]);
      } else {
        pendingAdded.push(bSentences[j++]);
      }
    }
    while (i < sm) pendingRemoved.push(aSentences[i++]);
    while (j < sn) pendingAdded.push(bSentences[j++]);
    flushPending();
  }

  const merged = mergeConsecutiveTokens(rawDiffTokens);

  let addedCount = 0;
  let removedCount = 0;
  let sameCount = 0;

  for (const item of merged) {
    const words = item.text.trim() ? item.text.trim().split(/\s+/).length : 0;
    if (item.type === 'added') addedCount += words;
    else if (item.type === 'removed') removedCount += words;
    else sameCount += words;
  }

  // Công thức Dice-Sørensen chuẩn cho tỷ lệ tương đồng văn bản pháp luật
  const denominator = 2 * sameCount + addedCount + removedCount;
  const similarityPercent =
    denominator > 0 ? Math.round(((2 * sameCount) / denominator) * 100) : 100;

  return {
    tokens: merged,
    addedCount,
    removedCount,
    sameCount,
    similarityPercent,
    algorithmUsed,
  };
}
