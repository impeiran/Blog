/**
 * u need axios
 * 请注意此处使用axios作为请求库
 */
(function (global, request) {

  // 用于存放缓存数据
  const dict = new Map()

  const setCache = (cacheKey, info) => {
    dict.set(cacheKey, {
      ...(dict.get(cacheKey) || {}),
      ...info
    })
  }

  const notify = (cacheKey, value) => {
    const info = dict.get(cacheKey)

    let queue = []

    if (info.status === 'SUCCESS') {
      queue = info.resolves
    } else if (info.status === 'FAIL') {
      queue = info.rejects
    }

    while(queue.length) {
      const cb = queue.shift()
      cb(value)
    }

    setCache(cacheKey, { resolves: [], rejects: [] })
  }

  const handleRequest = (url, cacheKey) => {
    setCache(cacheKey, { 
      status: 'PENDING',
      resolves: [],
      rejects: []
    })

    const ret = request(url)

    return ret.then(res => {
      // 返回成功，刷新缓存，广播并发队列
      setCache(cacheKey, {
        status: 'SUCCESS',
        response: res
      })
      notify(cacheKey, res)
      return Promise.resolve(res)
    }).catch(err => {
      // 返回失败，刷新缓存，广播错误信息
      setCache(cacheKey, { status: 'FAIL' })
      notify(cacheKey, err)
      return Promise.reject(err)
    })
  }

  /**
   * 缓存式请求
   * @param {String} target 请求地址
   * @param {Object} option 缓存的配置项
   * @returns {Promise}
   */
  const cacheRequest = function (target, option = {}) {
    const cacheKey = option.cacheKey || target

    const cacheInfo = dict.get(cacheKey)

    if (!cacheInfo) {
      return handleRequest(target, cacheKey)
    }

    const status = cacheInfo.status
    // 已缓存成功数据，则返回
    if (status === 'SUCCESS') {
      return Promise.resolve(cacheInfo.response)
    }
    // 缓存正在PENDING时，封装单独异步操作，加入队列
    if (status === 'PENDING') {
      return new Promise((resolve, reject) => {
        cacheInfo.resolves.push(resolve)
        cacheInfo.rejects.push(reject)
      })
    }
    // 缓存的请求失败时，重新发起真实请求
    return handleRequest(target, cacheKey)
  }

  global.cacheRequest = cacheRequest
})(this, axios)