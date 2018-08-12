---
layout:     post
title:      采用translate3d动画取替top、left
subtitle:   动画优化
date:       2018-8-7
author:     Chaser
header-img: 
catalog: true
tags:
    - Web优化
---

## 前言

> 在实现一个动画需求时，首先考虑用了`top`属性，因为当时想用`top`的话，不像`transform`需要添加浏览器厂商前缀，方便很多。但是真机测试的时候，却发现动画非常卡顿。而采用了`transform`时却发现没有卡顿。

## 原因

网上查证了一番以后，发现使用`transform: translate3d()`进行动画的时候会具有几个优势，以至于不那么卡顿。

* 减少了页面回流的过程，只进行了重绘。
* 因为会涉及到`translateZ`这个属性，会启用硬件的GPU进行加速。
* 不用和浏览器进程共享内存和减轻cpu负担 。

而采用`top`属性进行动画的话，会将页面回流和重绘这两个过程都走一遍。

所以怪不得之前看到像iscroll、fullpage等涉及动画的库都采用`translate`属性实现。



