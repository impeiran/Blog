const noop = () => {}

/*  先序遍历  */
const preOrderTravel = function (tree, callback = noop) { // 迭代法
  if (!tree) return

  const list = [tree]

  while (list.length) {
    const current = list.shift()

    callback(current)
    current.right && list.unshift(current.right)
    current.left && list.unshift(current.left)
  }
}

const preOrderTravelRecurse = function (tree, callback = noop) { // 递归
  if (!tree) return

  callback(tree)
  preOrderTravelRecurse(tree.left, callback)
  preOrderTravelRecurse(tree.right, callback)
}
/*  End  */


/*  中序遍历  */
const inOrderTravel = function (tree, callback = noop) { // 迭代法
  /**
   * 技巧：向左侧遍历，并压栈所有遍历的节点
   * 找到第一个没有左孩子的节点，然后进行访问，并开始回溯
   * 回溯取栈顶的节点，等同于：上个遍历目标节点的父节点
   */

  if (!tree)  return

  const list = []

  while (true) {
    while (tree) {
      list.push(tree)
      tree = tree.left
    }

    if (!list.length) break

    const current = list.pop()
    callback(current)
    tree = current.right
  }
}

const inOrderTravelRecurse = function (tree, callback = noop) { // 递归
  if (!tree) return

  inOrderTravelRecurse(tree.left, callback)
  callback(tree)
  inOrderTravelRecurse(tree.right, callback)
}
/*  End */


/*  后序遍历  */
const tailOrderTravel = function (tree, callback = noop) {
  if (!tree)  return

  const list = []
  let pre = null

  while (tree || list.length) {
    // 把左侧全部左子压栈，直到无左子结束
    if (tree) {
      list.push(tree)
      tree = tree.left
    } else {
      // 开始处理右节点
      tree = list.pop()
      if (!tree.right || tree.right === pre) {
        callback(tree)
        pre = tree
        tree = null
      } else {
        // 这里需要重新压入原来的父节点
        list.push(tree)
        tree = tree.right
      }
    }
  }

}

const tailOrderTravelRecurse = function (tree, callback = noop) { //递归
  if (!tree) return

  tailOrderTravelRecurse(tree.left, callback)
  tailOrderTravelRecurse(tree.right, callback)
  callback(tree)
}
/*  End */


/*  层次遍历  */
const floorOrderTravel = function (tree, callback = noop) {
  if (!tree) return

  const list = [tree]

  while (list.length) {
    const current = list.shift()
    callback(current)
    current.left && list.push(current.left)
    current.right && list.push(current.right)
  }
}
/*  End  */

exports.preOrderTravel = preOrderTravel
exports.preOrderTravelRecurse = preOrderTravelRecurse
exports.inOrderTravel = inOrderTravel
exports.inOrderTravelRecurse = inOrderTravelRecurse
exports.tailOrderTravel = tailOrderTravel
exports.tailOrderTravelRecurse = tailOrderTravelRecurse
exports.floorOrderTravel = floorOrderTravel