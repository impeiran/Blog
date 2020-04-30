/**
 * 
 *  字符串匹配KMP算法： 尽量复用已匹配的字符串
 *  1. 根据模式串构建PMT表，如：
 *    ｜子字符串　 a b a b a b z a b a b a b a
 *    ｜最大匹配数 0 0 1 2 3 4 0 1 2 3 4 5 6 ?
 *    对应的值为前缀与后缀的最长公共串长度，
 *    如上图的aba，前缀为「a, ab」,后缀为「a, ba」，最长为1，即a的长度
 *  2. 遍历主字符串，到达不符合的下标时，将之前已匹配的进行查表回溯模式串的指针
 * 
 *  时间复杂度：O(m + n) 
 */

/**
 * 创建模式字符串对应的表
 * @param {String} pattern 模式字符串
 */
const createPartialMatchTable = (pattern) => {
  const table = new Array(pattern.length).fill(0)
  let maxLength = 0

  for (let i = 1, len = pattern.length; i < len; i++) {
    while (
      maxLength > 0 &&
      pattern.charAt(maxLength) != pattern.charAt(i)
    ) {
      maxLength = table[maxLength - 1]
    }

    if (pattern.charAt(maxLength) == pattern.charAt(i)) {
      maxLength++
    }

    table[i] = maxLength
  }

  return table
}

/**
 * 字符串匹配
 * @param {String} target 目标字符串
 * @param {String} pattern 匹配的模式串
 */
const kmp = (target, pattern) => {
  if (!target || !pattern) return -1

  const pmt = createPartialMatchTable(pattern)

  let count = 0

  for (let i = 0, len = target.length; i < len; i++) {
    while (count > 0 && pattern.charAt(count) !== target.charAt(i)) {
      count = pmt[count - 1]
    }

    if (target.charAt(i) === pattern.charAt(count)) {
      count++
    }

    if (count === pattern.length) {
      // ...此处可优化，记录每一个匹配的index，现暂返回第一个匹配的index
      // count = pmt[count - 1]
      return i - pattern.length + 1
    }
  }

  return -1
}

exports.createPartialMatchTable = createPartialMatchTable
exports.kmp = kmp