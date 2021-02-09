const { kmp, createPartialMatchTable } = require('../src/kmp')

test('字符串匹配：kmp', () => {
  let target, pattern

  target = 'ababablla'
  pattern = 'babll'
  expect(createPartialMatchTable(pattern).join('')).toBe('00100')
  expect(kmp(target, pattern)).toBe(target.indexOf(pattern))

  target = 'abbaabbaaba'
  pattern = 'abbaaba'
  expect(createPartialMatchTable(pattern).join('')).toBe('0001121')
  expect(kmp(target, pattern)).toBe(target.indexOf(pattern))

  target = 'abbaabbaaba'
  pattern = '123'
  expect(createPartialMatchTable(pattern).join('')).toBe('000')
  expect(kmp(target, pattern)).toBe(target.indexOf(pattern))
})
