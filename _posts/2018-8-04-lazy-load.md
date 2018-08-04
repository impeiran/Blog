---
layout:     post
title:      原生js实现图片懒加载
subtitle:   融合了函数防抖的懒加载，简单的实现
date:       2018-8-4 
author:     Chaser
header-img: 
catalog: false
tags:
    - js
---

## 图片懒加载

实现的是pc页面中常见的滚动图片到可视区中，进行的图片加载。

## 原理

要做到懒加载，我们可以把`img`标签中的`src`属性暂时替换为一张占位图片，然后在为标签添加一些自定义属性，用来存放真实地址，例如`data-origin = ""`。然后就是监测图片何时到达可视区，当将要到达时再将未加载图片的`src`替换为真实地址。  

`<img src="loading.png" data-origin="./img/pic1.png" alt="lazy-load">`

至于监测图片何时到达可视区，我们可以监听浏览器的滚动事件`onscroll`，然后滚动时判断元素距离可视区的距离。这里可以使用节点的`offsetTop`这么一个只读属性，获取**元素到页面顶部的距离**，然后**减去页面的`scrollTop`**就可以得到我们想要的**元素到可视区的距离**。

不过这里我尝试用的是这么一个api，`getBoundingClientRect()`[查看文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect) ，用于获取某个元素相对于视窗的位置集合，可以自行查看文档的介绍。

## 源码实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
  <style>
    div{
      margin: 10px auto;
    }
    .block{
      width: 800px;
      height: 600px;
      background-color: pink;
    }
    .pic-box{
      width: 400px;
    }
    img{
      display: block;
      margin: 10px;
      width: 400px;
      height: 400px;
    }
  </style>
</head>
<body>
  <div class="block"></div>
  <div class="block"></div>
  <div class="pic-box">
    <img src="" data-origin="https://cccccchaser.github.io/chaser_page/img/bg3.jpg" alt="">
    <img src="" data-origin="https://cccccchaser.github.io/chaser_page/img/top1.jpg" alt="">
    <img src="" data-origin="https://cccccchaser.github.io/chaser_page/img/top2.jpg" alt="">
    <img src="" data-origin="https://cccccchaser.github.io/chaser_page/img/top3.jpg" alt="">
  </div>
  
  <script>
    // 获取图片集合
    let imgs = document.getElementsByTagName('img'); 
	
    // 定时器声明
    let timer = null ;

    window.onscroll = function() {
      // 函数节流
      if(timer){
        clearTimeout(timer);
      }
      timer = setTimeout(function(){
        // 获取可视区高度
        let clientHeight = document.documentElement.clientHeight;
        // 遍历图片集合
        for(let i of imgs){
          // 获取图片到可视区的距离
          let toClient = i.getBoundingClientRect().top - clientHeight;
          // 若到达可视区并且图片未被加载，则进行替换真实地址。
          if(toClient <= 0 && i.getAttribute('src') == ''){
            i.setAttribute('src',i.dataset.origin);
          }
        }
      },20)
    }
  </script>
</body>
</html>
```

## 源码分析

因为浏览器的滚动事件是一个高频触发的事件，所以可以给它设定一个函数防抖，滚动停止时才会触发判断与懒加载。这里其实可以再做优化，当用户连续滚动太长的话，可能会出现图片一直未加载空白的这么一个场景，所以可以给防抖再加一个间隔，在超过时间间隔就主动触发一次加载判定。