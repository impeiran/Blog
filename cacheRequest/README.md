最近碰到的一道笔试题，题目大概如下：

>请实现一个cacheRequest方法，保证当前ajax请求相同资源时，真实网络层中，实际只发出一次请求（假设已经存在request方法用于封装ajax请求）

一开始看到第一感觉是，设个Http Header`cache-control`，把`expire`调大，不就自然会找浏览器缓存拿了。但是看到后面说提供自带的`request`方法和只发起一次ajax。那估计是想让笔者在业务层自己用代码解决这个cache问题。

接下来，我们抛开实际场景价值，思考下怎样实现。

一般我们很简单的就可以得出以下思路：

- 利用闭包或者模块化的设计，引用一个`Map`，存储对应的缓存数据。
- 每次请求检查缓存，有则返回缓存数据，无则发起请求。
- 请求成功后，再保存缓存数据并返回，请求失败则不缓存。

然后我们一般会写出下面的代码：

```javascript
// 构建Map，用作缓存数据
const dict = new Map()
// 这里简单的把url作为cacheKey
const cacheRquest = (url) => {
  if (dict.has(url)) {
    return Promise.resolve(dict.get(url))
  } else {
    // 无缓存，发起真实请求，成功后写入缓存
    return request(url).then(res => {
      dict.set(url, res)
      return res
    }).catch(err => Promise.reject(err))
  }
}
```

**写到这里，你以为这篇文章就这么容易的结束了吗～～**

当然不是，我觉得还有一个小坑：

**有这么一个小概率边缘情况，并发两个或多个相同资源请求时，第一个请求处于`pending`的情况下，实际上后面的请求依然会发起，不完全符合题意。**

因此，我们再重新设计出以下逻辑：

1. 当第一个请求处于`pending`时，设一个状态值锁住，后面并发的`cacheRequest`识别到`pending`时，则不发起请求，封装成异步操作，并塞进队列。
2. 当请求响应后，取出队列的异步`resolve`，把响应数据广播到每一个异步操作里。
3. 当发生请求错误时，同理：广播错误信息到每一个异步操作。
4. 之后的异步`cacheRequest`则正常的取出success的响应数据。

至此，并发的请求只要第一个返回成功了，后边都会马上响应，且真实只发起一个ajax请求。

首先，定义好我们缓存数据的`schema`，称为`cacheInfo`以此存入我们的`Map`里

```javascript
{
  status: 'PENDING', // ['PENDING', 'SUCCESS'， 'FAIL']
  response: {},      // 响应数据
  resolves: [],      // 成功的异步队列
  rejects: []        // 失败的异步队列
}
```

函数的主体我们梳理下主干的逻辑：

- 额外的加多一个`option`，参数可传入自定义的cacheKey
- 真实请求的`handleRequest`逻辑单独进行封装，因为不止一处用到，我们下面再单独实现。

```javascript
const dict = new Map()

const cacheRequest = function (target, option = {}) {
  const cacheKey = option.cacheKey || target

  const cacheInfo = dict.get(cacheKey)
  // 无缓存时，发起真实请求并返回
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
```

接下来，就是发起真实请求的`handleRequest`，我们把改写`status`的操作和写入`cacheInfo`的操作一并封装在里面。当中抽离出两个公共函数：写入缓存的`setCache`和用于广播异步操作的`notify`。

**首先是setCache**，逻辑非常简单，浅合并原来的`cacheInfo`并写入

```javascript
// ... dict = new Map()

const setCache = (cacheKey, info) => {
  dict.set(cacheKey, {
    ...(dict.get(cacheKey) || {}),
    ...info
  })
}
```

**接下来是handleRequest**：改写状态锁，发起真实请求，进行响应成功和失败后的广播操作

```javascript
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
```

**最后是广播函数notify**的实现，取出队列，逐个广播然后清空

```javascript
// ... dict = new Map()

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
```

接下来，就是紧张又刺激的测试环节，测试代码以截图形式呈现

- 服务端用express简单搭建一下，构造一个延时2秒的接口测试并发时的情况
- 客户端request采用axios代替，构造并发的请求与单独的请求。

服务端代码：
![](https://user-gold-cdn.xitu.io/2020/3/20/170f6e8704b84848?w=1100&h=752&f=png&s=134698)

客户端代码：

![](https://user-gold-cdn.xitu.io/2020/3/20/170f6ea0a23b4d58?w=1236&h=1114&f=png&s=265729)

效果预览：

![](https://user-gold-cdn.xitu.io/2020/3/20/170f6f3afcc45492?w=480&h=395&f=gif&s=4465610)

**拓展与总结**
1. 测试与函数源代码已放到个人[Github仓库](https://github.com/impeiran/Blog/tree/master/cacheRequest)
2. 虽然可能会有人觉得笔者钻了牛角尖，但如果从实现一个库来说是必须得考虑到多种情况的。
3. 函数还有更多可拓展完善的地方，例如：设置expire的cache过期时间，自定义设置request等等；