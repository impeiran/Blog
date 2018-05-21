---
layout:     post
title:      CSS布局 - 居中
subtitle:   谈谈几种用于居中的方法。
date:       2018-05-21 
author:     Chaser
header-img: 
catalog: true
tags:
    - html/css
---

>网上关于居中的方案还是非常多的，
>这里说一下几种自己比较常用的。

## 水平居中

1.最常见的应该使用 margin: 0 auto;

```html
<div class="parent">
  	<div class="child"></div>
</div>

.child{
	margin:0 auto;
}
```
