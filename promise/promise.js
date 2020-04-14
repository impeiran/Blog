/**
 * 三种状态，且只能从pending转换为另外两种，不可逆
 */
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
const PENDING = 'pending'

class Promise {
  constructor (executor) {
    this.state = PENDING

    this.value = undefined // 成功的值
    this.reason = undefined // 失败的原因

    this.onResolvedQueue = [] // 存放then传入的resolve（array保证可多次重复then）
    this.onRejectedQueue = [] // 存放then传入的reject

    // 用于作为函数参数的resolve
    const resolve = value => {
      if (this.state === PENDING) {
        this.value = value
        this.state = FULFILLED
        this.onResolvedQueue.forEach(fn => fn(value))
      }
    }

    // 用于作为函数参数的reject
    const reject = reason => {
      if (this.state === PENDING) {
        this.reason = reason
        this.state = REJECTED
        this.onRejectedQueue.forEach(fn => fn(reason))
      }
    }

    // 执行目标函数
    try {
      executor && executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  then (onFulfilled, onRejected) {
    // onFulfilled如果不是函数，就忽略onFulfilled，直接返回value
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    // onRejected如果不是函数，就忽略onRejected，直接扔出错误
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err }

    const newPromise = new Promise((resolve, reject) => {
      try {
        if (this.state === FULFILLED) {
          setTimeout(() => {
            const ret = onFulfilled(this.value)
            resolvePromise(newPromise, ret, resolve, reject)
          }, 0)
        }

        if (this.state === REJECTED) {
          setTimeout(() => {
            const ret = onRejected(this.reason)
            resolvePromise(newPromise, ret, resolve, reject)
          }, 0)
        }

        if (this.state === PENDING) {
          this.onResolvedQueue.push(() => {
            setTimeout(() => {
              const ret = onFulfilled(this.reason)
              resolvePromise(newPromise, ret, resolve, reject)
            }, 0)
          })
          this.onRejectedQueue.push(() => {
            setTimeout(() => {
              const ret = onRejected(this.reason)
              resolvePromise(newPromise, ret, resolve, reject)
            }, 0)
          })
        }
      } catch (error) {
        reject(error)
      }
    })

    return newPromise
  }
}

function resolvePromise (newPromise, ret, resolve, reject) {
  if (ret === newPromise) {
    return reject(new TypeError('Chaining cycle detected for promise'))
  }

  // 防止多次调用
  let called
  // x不是null 且x是对象或者函数
  if (ret != null && (typeof ret === 'object' || typeof ret === 'function')) {
    try {
      // A+规定，声明then = ret的then方法
      const then = ret.then
      // 如果then是函数，就默认是promise了
      if (typeof then === 'function') {
        // 就让then执行 第一个参数是this   后面是成功的回调 和 失败的回调
        then.call(ret, y => {
          // 成功和失败只能调用一个
          if (called) return
          called = true
          // resolve的结果依旧是promise 那就继续解析
          resolvePromise(newPromise, y, resolve, reject)
        }, err => {
          // 成功和失败只能调用一个
          if (called) return
          called = true
          reject(err)// 失败了就失败了
        })
      } else {
        resolve(ret) // 直接成功即可
      }
    } catch (e) {
      // 也属于失败
      if (called) return
      called = true
      // 取then出错了那就不要在继续执行了
      reject(e)
    }
  } else {
    resolve(ret)
  }
}

Promise.resolve = val => {
  return new Promise(resolve => {
    resolve(val)
  })
}

Promise.reject = reason => {
  return new Promise((resolve, reject) => {
    reject(reason)
  })
}

Promise.race = promises => {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises.then(resolve, reject)
    }
  })
}

Promise.all = promises => {
  const len = promises.length
  const ret = new Array(len)

  let i = 1

  return new Promise((resolve, reject) => {
    promises.forEach((pm, index) => {
      pm.then(val => {
        ret[index] = val
        if (++i === len) {
          resolve(ret)
        }
      }, reject)
    })
  })
}

Promise.defer = Promise.deferred = function () {
  const dfd = {}
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

// export default Promise
module.exports = Promise
