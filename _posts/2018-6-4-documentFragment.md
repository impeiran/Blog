---
layout:     post
title:      元素添加优化
subtitle:   使用DocumentFragments或innerHTML
date:       2018-6-4 
author:     Chaser
header-img: 
catalog: true
tags
    - javascript
    - html/css
    - Web优化
---

> 我们知道DOM操作会引起回流和重绘，减少没必要或者压缩DOM操作有利于前端性能优化。

- 现有一插入DOM节点的例子如下
```javascript
let list = document.querySelector('url');
for(let index = 1 ; index < 3 ; index++){
    let li = document.createElement('li');
    li.innerText = 'item' + index;
    list.appendChild(li);
}
```
初学者很容易会写成这样的代码，这样结果就是进行了三次DOM节点添加操作，会造成三次回流和重绘。  

而如果使用以下两种方法就可以减少DOM操作，优化性能。

- 用一个字符串记录所有节点的信息，使用一次innerHTML进行全部添加

```javascript
let list = document.querySelector('url');
let str = '';
for(let index = 1 ; index < 3 ; index++){
    str += '<li>item'+index+'</li>';
}
list.innerHTML = str;
```

- 使用DocumentFragments暂存所有节点信息
```javascript
let list = document.querySelector('url');
var frag = document.createDocumentFragment();
for(let index = 1 ; index < 3 ; index++){
    let li = document.createElement('li');
    li.innerText = 'item' + index;
    frag.appendChild(li);
}
list.appendChild(frag);
```
`DocumentFragement`是一组子节点的“虚拟存储”，并且它没有父标签。可以把它想象成一个“仓库”节点，但这个节点不会成为DOM Tree的一部分。把`DocumentFragement`类型节点作为参数传给`appendChild()`或者`insertBefore()`等方法时，实际上只会将文档片段的所有子节点添加到相应位置上。

所以在上述例子中，`frag`只起到了一个暂存仓库的作用，最终添加到`ul`标签里的，也只是三个`li`节点。