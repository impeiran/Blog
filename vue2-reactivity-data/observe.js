let depId = 0
class Dep {
  constructor () {
    this.id = depId++
    this.subs = []
  }

  addSub (sub) {
    this.subs.push(sub)
  }

  removeSub (sub) {
    const index = this.subs.findIndex(sub)
    if (index !== -1) {
      this.subs.splice(index, 1)
    }
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}
Dep.target = null

const targetStack = []

function pushTarget (target) {
  targetStack.push(target)
  Dep.target = target
}

function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}

// 将状态代理到实例上
function proxy (source, sourceKey, k) {
  Object.defineProperty(source, k, {
    enumerable: true,
    configurable: true,
    get: function () {
      return this[sourceKey][k]
    },
    set: function (val) {
      this[sourceKey][k] = val
    }
  })
}


// 递归遍历 劫持属性
function observe (obj) {
  const keys = Object.keys(obj)
  for (const key of keys) {
    const dep = new Dep()

    let val = obj[key]

    if (Object.prototype.toString.call(val) === 'object') {
      observe(val)
    }

    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function () {
        if (Dep.target) {
          dep.depend()
        }
        return val
      },

      set: function (newVal) {
        if (newVal === val) return
        val = newVal
        dep.notify()
      }
    })
  }
}