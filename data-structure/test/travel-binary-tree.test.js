const demo = require('../lib/parse-tree')({
  value: 9,
  left: {
    value: 8,
    left: {
      value: 20,
    },
    right: {
      value: 16,
      left: { value: 2 },
      right: { value: 4 }
    }
  },

  right: {
    value: 7,
    left: { value: 11 },
    right: { value: 4 }
  }
})

const { 
  preOrderTravel, preOrderTravelRecurse,
  inOrderTravel, inOrderTravelRecurse,
  tailOrderTravel, tailOrderTravelRecurse,
  floorOrderTravel
} = require('../src/travel-binary-tree')

const travel = (fn, tree) => {
  let result = []
  fn(tree, ({value}) => {
    result.push(value)
  })
  return result
}

test('前序遍历', () => {
  expect(travel(preOrderTravel, demo).join(',')).toBe('9,8,20,16,2,4,7,11,4')
  expect(travel(preOrderTravelRecurse, demo).join(',')).toBe('9,8,20,16,2,4,7,11,4')
})

test('中序遍历', () => {
  expect(travel(inOrderTravel, demo).join(',')).toBe('20,8,2,16,4,9,11,7,4')
  expect(travel(inOrderTravelRecurse, demo).join(',')).toBe('20,8,2,16,4,9,11,7,4')
})

test('后序遍历', () => {
  expect(travel(tailOrderTravel, demo).join(',')).toBe('20,2,4,16,8,11,4,7,9')
  expect(travel(tailOrderTravelRecurse, demo).join(',')).toBe('20,2,4,16,8,11,4,7,9')
})

test('层次遍历', () => {
  expect(travel(floorOrderTravel, demo).join(',')).toBe('9,8,7,20,16,11,4,2,4')
})

