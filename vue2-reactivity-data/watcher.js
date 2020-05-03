let watchId = 0
class Watcher {
  constructor (vm, expOrFn) {
    this.id = watchId++
    this.vm = vm
    this.getter = expOrFn

    // 用于处理依赖
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()

    this.value = this.get()
  }

  addDep (dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  get () {
    pushTarget(this)
    const value = this.getter.call(this.vm)
    popTarget()

    return value
  }

  update () {
    Promise.resolve().then(() => {
      this.get()
    })
  }
}