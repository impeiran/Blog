---
layout:     post
title:      vue-cli使用代理跨域请求
subtitle:   请求接口中域名不在允许范围内
date:       2018-8-7
author:     Chaser
header-img: 
catalog: true
tags:
    - js
    - vue
---

## 前言

今天在做一个vue项目时，想用下别人网站的真实数据，无奈跨域请求为非允许域名。

## 方法

在webpack生成的node服务器环境中，设置一个代理，也可以理解为一种映射关系，具体文件在如下目录中的**index.js**：

```
|--config
	|	dev.env.js
	|	index.js
	|	prod.env.js
```

找到如下代码中的**proxyTable对象**：

```javascript
 dev: {

    // Paths
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
      // 代理后的地址
      '/api': {
        // 填写代理的地址
        target: 'https://c.y.qq.com/',
        // 是否跨域
        changeOrigin: true,
        // 本身的接口地址没有 '/api' 这种通用前缀，所以要rewrite，如果本身有则去掉  
        pathRewrite: {
          '^/api': '/'
        }
      }
    },
```

然后再在ajax中修改请求的地址（即将代理前的地址改为代理后的地址）。

**ps：这个方法也只是适合开发环境中使用，生产环境要在真实数据后台设置，原理也是一样的。**



