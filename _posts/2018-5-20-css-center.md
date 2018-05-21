---
layout:     post
title:      CSS布局 - 居中
subtitle:   谈谈几种用于居中的方法。
date:       2018-05-20 
author:     Chaser
header-img: 
catalog: true
tags:
    - html/css
---

>网上关于居中的方案还是非常多的，
>这里整理一下几种自己比较常用的。

## 水平居中

### 1.最常见使用 margin: 0 auto;

```css
<div class="parent">
  	<div class="child"></div>
</div>

.child{
	margin:0 auto;
}
```

适用于块级元素。

内敛块元素无效。

元素脱离文档流（即设置float或者absolute,fixed定位等等）也无效。

### 2.使用display:inline-block和text-align:center

```css
<div class="parent">
  		<div class="child"></div>
</div>

.parent{
	text-align:center;
}
.child{
	display:inline-block;
}	
```

子元素为内敛元素或内敛块元素。

### 3.使用absolute定位和transform

```css
<div class="parent">
  		<div class="child"></div>
</div>

.parent{
    position: relative;
}
.child{
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}
```
不想影响父元素时，可使用如下方案：

```css
<div></div>

div{
    position: relative;
    left: 50%;
    transform: translateX(-50%);
}
```

将子框设置为绝对定位，移动子框，使子框左侧距离相对框左侧边框的距离为相对框宽度的一半，再通过向左移动子框的一半宽度以达到水平居中。当然，在此之前，我们需要设置父框为相对定位，使父框成为子框的相对框。

缺点：transform属于css3内容，兼容性存在一定问题，高版本浏览器需要添加一些前缀

### 4.使用flex盒子与margin

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
	display:flex;
}
.child{
	margin:0 auto;
}
```

较于第一点更好，子元素可为内联元素或者块级元素。 

（低版本浏览器(ie6 ie7 ie8)不支持）

### 5.使用flex和justify-content

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
	display:flex;
	justify-content:center;
}
```

（低版本浏览器(ie6 ie7 ie8)不支持）

## 垂直居中

### 1.使用table-cell+vertical-align

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
	display:table-cell;
	vertical-align:middle;
}
```

兼容性较好，ie8以上均支持

### 2.使用absolute和transform

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
    position: relative;
}
.child{
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
}
```

不想影响父元素时，可使用如下方案：

```css
<div></div>

div{
    position: relative;
    top: 50%;
    transform: translateY(-50%);
}
```

缺点：transform属于css3内容，兼容性存在一定问题，高版本浏览器需要添加一些前缀

### 3.使用flex和align-items

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
	display:flex;
	align-items:center;
}
```

兼容性可能存在问题。

## 水平垂直同时居中

>其实就是结合前面两者的方案。

### 1.使用inline-block+text-align+table-cell+vertical-align

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
	display:table-cell;
	text-align:center;
	vertical-align:middle;
}
.child{
	display:inline-block;
}
```

子元素为内联元素或者内联块元素。

### 2.使用flex+justify-content+align-items

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
	display:flex;
	justify-content:center;
	align-items:center;
}
```

IE8以下不兼容。

### 3.使用position和transform

```css
<div class="parent">
  	<div class="child"></div>
</div>

.parent{
    position: relative;
}
.child{
    position: absolute;
    top: 50%;
    left:50%;
    transform: translate(-50%,-50%);
}
```

不想影响父元素时，可使用如下方案：

```css
<div></div>

div{
    position: relative;
    top: 50%;
    left:50%;
    transform: translate(-50%.-50%);
}
```

低版本浏览器需要加前缀。

***

（目前用到的大概只有这些，后续会逐渐补充……）