---
layout:     post
title:      观察者模式VS发布订阅模式
subtitle:   浅淡观察者模式与发布订阅模式两者的区别
date:       2019-3-1
author:     Chaser
header-img: 
tags:
    - js
    - 设计模式
---

> 前言
>
> 之前网上看文章，一直以为观察者模式就是相当于发布订阅模式，只是换了个说法，而且很多js开发者跟我有一样的问题。后来接触得多了，才发现其实两者有区别。

首先透过[@swnow_in](<https://www.jianshu.com/u/2fc7f2b59f75>)的一张图来谈一下自己的理解

![img](https://upload-images.jianshu.io/upload_images/5262488-291da39f66dbc28a.png)



从图中可以看出：

* 观察者与目标（被观察者）是**直接进行交互**的，包括订阅和触发。
* 发布订阅模式是透过一个**中间者**当调度中心，相关的订阅与发布都由调度中心来进行协调。

两者的优缺点：

* 观察者模式：优点就是一一对应，比较**直观明了，占用内存资源容易进行回收**。缺点就是两者耦合。
* 发布订阅模式：优点就是一方面实现了发布者与订阅者之间的**解耦**，中间者可在两者操作之间进行更细粒度的控制。如：条件过滤发布，权限控制等等。缺点就是整一个中间调度会越来越庞大，需要手动清除里面的发布回调。

举个栗子：

* 观察者模式：彩票中心里，管理员充当目标对象（被观察者），彩民充当观察者，当管理员说公布一等奖号码时，即给各个观察者发布了消息，然后彩民（观察者）就收到发布消息，进行自己的后续操作（兑奖）。
* 发布订阅模式：每家每户向牛奶订购中心订购了牛奶，但是各家的牛奶品牌不一样，有燕塘、蒙牛等等。当燕塘牛奶来货了，订阅中心就给订购燕塘的各家各户派发燕塘牛奶。同理，当蒙牛到货时，订阅中心发布蒙牛的牛奶。

#### 观察者模式实现

![img](https://pic2.zhimg.com/80/v2-0a7ef7d1a328dc37eadefb29e0ea705d_hd.jpg)

以上面这张图为思路：

首先目标对象（被观察者）称为`Subject`，有若干个观察者`Observer`进行观察。当Subject被某些对应事件驱动了，则通知相对应的观察者，调用其回调操作。

代码实现如下，关键部分已上注释：

```javascript
// 目标（被观察者）对象模型
class Subject{
  constructor () {
    this.obs = [];
  }
  // 添加观察者
  addObserver (ob) {
    this.obs.push(ob);
  }
    
  // 通知所有观察者
  notify () {
    this.obs.forEach( ob => {
      ob.update();
    });
  }
}

// 观察者对象模型
class Observer{
  update(){
    console.log('update');
  }
  // ...
}

// 测试
let subject = new Subject();
let ob = new Observer();
//目标添加观察者了
subject.addObserver(ob);
//目标发布消息调用观察者的更新方法了
subject.notify();   //update
```

#### 发布订阅模式实现

首先要构造一个总线控制中心，负责中间操作，实现以下三个功能：

* 订阅xxx消息
* 发布xxx消息
* 取消订阅xxx消息

实现代码如下，关键部分已上注释：

```javascript
// 发布者订阅模式，事件模型
const eventProxy = {
  onList: {},

  // 订阅
  on: function (key, fn) {
    if (!this.onList[key]) {
      this.onList[key] = []
    }
    this.onList[key].push(fn)
  },

  // 取消订阅
  off: function(key, fn) {
    if (!this.onList[key]) return false

    let fnIndex = this.onList[key].indexOf(fn)
    if (fnIndex === -1) return false
    this.onList[key].splice(fnIndex, 1)
    return true
  },
  
  // 发布
  emit: function(...args) {
    if (!args.length) return
	
    // 如果没有任何订阅则返回  
    const key = args[0]
    if (!this.onList[key] || !this.onList[key].length) return
	
    // 发布对应的订阅事件
    const subscriber = this.onList[key]
    const newArgs = args.slice(1)
    subscriber.forEach(cb => {
      cb.apply(null, newArgs)
    })
  }
}
```

