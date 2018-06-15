---
layout:     post
title:      Safari 点击事件失效
subtitle:   点击不触发事件
date:       2018-06-14 
author:     Chaser
header-img: 
catalog: true
tags:
    - safari
    - javascript

---

现在大概有这么一个情况，就是使用JQuery给动态添加的元素绑定点击事件，需要使用到事件委托（因为通常情况下事件会冒泡，可以在父容器上检测到发生的事件）。

```javascript
$('body').click(function(e){
  if($(e.target).hasClass('addItem')){
    // do something
  }
});
```

在PC端测试时，点击出现的效果也是正常的，但在IOS Safari上则没反应。这是Safari上的一个bug。

解决办法：

1. 给该元素的CSS加上`cursor:pointer;`

2. 不使用事件委托，给元素直接绑定事件。

3. 给元素加上`onclick='void(0);'`

4. 把元素换成其他不受bug特性影响的元素，比如`a`,`button`等。



[Safari Mobile click bug](https://developer.mozilla.org/en-US/docs/Web/Events/click#Safari_Mobile)]
