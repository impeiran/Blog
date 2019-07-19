---
layout:     post
title:      React-Hooks卸载内存泄漏
subtitle:   组件unmount后的setState引起问题
date:       2019-7-18
author:     Chaser
header-img: 
tags:
    - react
	- react-hooks
---

> 做react开发很多时候会遇到这么一个问题：
>
> 组件卸载时，异步请求才响应，并在回调函数中使用`setState()`而导致react报错，可能还会引起内存泄漏问题。

今天在使用react 16.8 新特性hooks写组件的时候，也遇到了这么个问题，报错如下

```javascript
index.js:1375 Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
    in Article (created by Context.Consumer)
    in withRouter(Article) (created by Context.Consumer)
```

意思是叫我在`useEffect`里的清除函数取消所有订阅和异步任务，react很贴心也按照出错提供了解决思路。

#### 传统class组件解决方案

首先还是先上传统的Class Components类型的解决方案：编写一个**防内存泄漏装饰器**，逻辑上还是注入一个变量作卸载标识，`setState`之前对此标识判断返回。

```react
function unmount_prevent_leak (target) {
	// 重写目标组件的willUnmount钩子，注入一个标识
    let next = target.prototype.componentWillUnmount
    target.prototype.componentWillUnmount = function(){
        // 调用原来的钩子，并添加标识
        if(next) next.call(this,...arguments)
        this.unmount = true
    }
 
    // 重写目标组件的setState
    let setState = target.prototype.setState
    target.prototype.setState = function () { 
        if(this.unmount) return  // 已经卸载的话就不执行
        setState.call(this,...arguments)   
    }
}
 
export default unmount_prevent_leak

// 使用示例
// @unmount_prevent_leak
// class xxx {}
```

#### Hook组件简单的解决方案

按照报错给的提示，因为是用于数据请求的`useEffect`，我们可以在清除函数中对请求的promise进行置空

```react
  useEffect(() => {
    let detailRequest = getUserDetail(loginname)
    detailRequest.then(res => {
      // ... logic
    })

    let collectRequest = getTopicCollect(loginname)
    collectRequest.then(res => {
      // ... logic
    })

    return () => {
      detailRequest = null
      collectRequest = null
    }
  }, [loginname])
```

实测还是可行的，虽然一直觉得不太优雅，而且这样也很麻烦，后续再想办法抽象出一个hook