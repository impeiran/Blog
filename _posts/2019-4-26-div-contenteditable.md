---
layout:     post
title:      踩坑可编辑表格与div Contenteditable
subtitle:   浅淡开发运用其特性遇到的问题
date:       2019-4-26
author:     Chaser
header-img: 
tags:
    - js
    - html
    - vue
---

> 事件的开端源于项目经理提出的一个需求，简化如下：
>
> **做一个像excel一样的可随意填写编辑的表格**

其实这个需求并不难，然后就接下来了，看了下github的相关库，也没找到合适的。所以打算还是自己写。

用的vue数据绑定一下填写，然后按需切换编辑模式渲染出输入域，感觉也不是问题。

然后就是一点UI上的小细节：

* 表格单元格虽然是响应式的，但是其里面的内容并不能影响到单元格的宽度变化。
* 其次单元格里的输入域要能**自动换行**，不能像input框一样一直往右填不换行显示。



分析到这里，这个输入域其实就想到两种实现：

1. Textarea，搭配一些工具依据输入动态改变其高度，实现自动换行的效果。
2. 一个比较冷门的方法，给div加上`contenteditable`属性，然后监听`input`事件，其自带自动换行功能，还能渲染html字符串，以便以后加需求，类似在文本域中加标签或者@xxx之类的，就比较好处理（ps：部分富文本编辑器也有依据此原理来实现）。



ok，决定选第二种了，然后像往常一样封装个可以双向绑定v-model的vue组件。

代码如下：

```vue
<template>
  <div 
    class="edit-block"
    v-html="text"
    :contenteditable="readOnly"
    @input="textInputHandler">
  </div>
</template>

<script>
export default {
  props: {
    value: { type: String, default: '' },
    readOnly: { type: Boolean, default: false },
  },

  data () {
    return {
      text: this.value
    }
  },

  methods: {
    textInputHandler () {
      this.$emit('input', this.$el.innerHTML)
    }
  }
}
</script>

<style lang="scss" scoped>
.edit-block {
  text-align: left;
  word-break: break-all;
  user-select: text;
  border: none;
  outline: none;
}
</style>
```

然后父组件直接可以这样调用：

```html
<edit-div v-model="$scope.index[prop]" />
```



在chrome下面测试，感觉还可以，就是**光标歪了**，而且后面发现提交后，**异步更新prop，组件视图没刷新**。果然还是很多小问题。

于是查了下，发现有篇文章还写的不错，解决了刚刚说的问题，不过光标还是有点小瑕疵。

[segmentfault传送门](https://segmentfault.com/a/1190000008261449)

然而接下来又是一个致命问题，`contenteditable`的div在IE下**不支持Input**事件。

所以后来方案改了，用了autosize + textarea的方案去实现。代码如下：

```javascript
<template>
  <div class="text-area-wrapper">
    <textarea
      v-model="val"
      rows="1"
      ref="textarea"
      :disabled="disabled"
      @input="$emit('edit')"
    ></textarea>
  </div>
</template>
<script>
import autosize from 'autosize'

export default {
  name: 'TextareaAutosize',

  props: {

    onlyNum: {
      type: [Boolean],
      default: false
    },

    value: {
      type: [String, Number],
      default: ''
    },

    disabled: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      val: null
    }
  },

  methods: {
    updateVal () {
      this.val = this.value
    }
  },

  watch: {
    value () {
      this.updateVal()
    },

    val (newVal) {
      if (this.onlyNum) {
        let middleText = ('' + newVal).replace(/[^\d\.]/g,'')
        this.val = middleText
        this.$emit('input', middleText)
      } else {
        this.$emit('input', newVal)
      }
    }
  },
    
  created () {
    this.updateVal()
  },

  mounted () {
    autosize(this.$refs.textarea)
  },
}
</script>
```



