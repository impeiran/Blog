const TreeNode = require('./tree-node')

/**
 * 将特定的格式转换为二叉树
 * @param {Object} json 
 * @example
 * {
 *   value: 666,
 *   left: {},
 *   right: {}
 * }
 */
function parseTree (json) {
  if (!json) return null

  const current = new TreeNode(json.value)
  current.left = parseTree(json.left)
  current.right = parseTree(json.right)

  return current
}

module.exports = parseTree