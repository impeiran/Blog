---
layout:     post
title:      href与src的区别
subtitle:   html标签属性
date:       2018-08-01 
author:     Chaser
header-img: 
catalog: false
tags:
    - html/css
---

**src**用于替换当前元素，**href**用于在当前文档和引用资源之间确立联系。 

src是source的缩写，指向外部资源的位置，指向的内容将会嵌入到文档中当前标签所在位置；在请求src资源时会将其指向的资源下载并应用到文档内，例如js脚本，img图片和frame等元素。 

`<script src ="js.js"></script>` 

当浏览器解析到该元素时，会暂停其他资源的下载和处理，直到将该资源加载、编译、执行完毕，图片和框架等元素也如此，类似于将所指向资源嵌入当前标签内。这也是为什么将js脚本放在底部而不是头部。  

href是`Hypertext Reference`的缩写，指向网络资源所在位置，建立和当前元素（锚点）或当前文档（链接）之间的链接，如果我们在文档中添加 

`<link href="common.css" rel="stylesheet"/>` 

那么浏览器会识别该文档为css文件，就会并行下载资源并且不会停止对当前文档的处理。这也是为什么建议使用link方式来加载css，而不是使用@import方式。 