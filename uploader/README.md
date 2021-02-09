### 前言

本文将带你基于ES6的面向对象，脱离框架使用原生JS，从设计到代码实现一个Uploader基础类，再到实际投入使用。通过本文，你可以了解到一般情况下根据需求是如何合理构造出一个工具类lib。

### 需求描述

相信很多人都用过/写过上传的逻辑，无非就是创建`input[type=file]`标签，监听`onchange`事件，添加到`FormData`发起请求。

但是，想引入开源的工具时觉得**增加了许多体积且定制性不满足**，每次写上传逻辑又会写很多**冗余性代码**。在不同的toC业务上，还要重新编写自己的上传组件样式。

此时编写一个Uploader基础类，供于业务组件二次封装，就显得很有必要。

下面我们来分析下使用场景与功能：

- **选择文件后可根据配置，自动/手动上传，定制化传参数据，接收返回。**
- **可对选择的文件进行控制，如：文件个数，格式不符，超出大小限制等等。**
- **操作已有文件，如：二次添加、失败重传、删除等等。**
- **提供上传状态反馈，如：上传中的进度、上传成功/失败。**
- **可用于拓展更多功能，如：拖拽上传、图片预览、大文件分片等。**

然后，我们可以根据需求，大概设计出想要的API效果，再根据API推导出内部实现。

#### 可通过配置实例化

```javascript
const uploader = new Uploader({
  url: '',
  // 用于自动添加input标签的容器
  wrapper: null,
  
  // 配置化的功能，多选、接受文件类型、自动上传等等
  multiple: true,
  accept: '*',
  limit: -1, // 文件个数
  autoUpload: false
  
  // xhr配置
  header: {}, // 适用于JWT校验
  data: {} // 添加额外参数
  withCredentials: false
});
```

#### 状态/事件监听

```javascript
// 链式调用更优雅
uploader
  .on('choose', files => {
    // 用于接受选择的文件，根据业务规则过滤
  })
  .on('change', files => {
    // 添加、删除文件时的触发钩子，用于更新视图
    // 发起请求后状态改变也会触发
  })
  .on('progress', e => {
    // 回传上传进度
  })
  .on('success', ret => {/*...*/})
  .on('error', ret => {/*...*/})
```

#### 外部调用方法

这里主要暴露一些可能通过交互才触发的功能，如选择文件、手动上传等

```javascript
uploader.chooseFile();

// 独立出添加文件函数，方便拓展
// 可传入slice大文件后的数组、拖拽添加文件
uploader.loadFiles(files);

// 相关操作
uploader.removeFile(file);
uploader.clearFiles()

// 凡是涉及到动态添加dom，事件绑定
// 应该提供销毁API
uploader.destroy();
```

至此，可以大概设计完我们想要的uploader的大致效果，接着根据API进行内部实现。

### 内部实现

使用ES6的class构建uploader类，把功能进行内部方法拆分，使用下划线开头标识内部方法。

然后可以给出以下大概的内部接口：

```javascript
class Uploader {
  // 构造器，new的时候，合并默认配置
  constructor (option = {}) {}
  // 根据配置初始化，绑定事件
  _init () {}
  
  // 绑定钩子与触发
  on (evt) {}
  _callHook (evt) {}
  
  // 交互方法
  chooseFile () {}
  loadFiles (files) {}
  removeFile (file) {}
  clear () {}
  
  // 上传处理
  upload (file) {}
  // 核心ajax发起请求
  _post (file) {}
}
```

#### 构造器 - constructor

代码比较简单，这里目标主要是定义默认参数，进行参数合并，然后调用初始化函数

```javascript
class Uploader {
  constructor (option = {}) {
    const defaultOption = {
      url: '',
      // 若无声明wrapper, 默认为body元素
      wrapper: document.body,
      multiple: false,
      limit: -1,
      autoUpload: true,
      accept: '*',

      headers: {},
      data: {},
      withCredentials: false
    }
    this.setting = Object.assign(defaultOption, option)
    this._init()
  }
}
```

#### 初始化 - _init

这里初始化做了几件事：维护一个内部文件数组`uploadFiles`，构建`input`标签，绑定`input`标签的事件，挂载dom。

为什么需要用一个数组去维护文件，因为从需求上看，我们的每个文件需要一个状态去追踪，所以我们选择内部维护一个数组，而不是直接将文件对象交给上层逻辑。

由于逻辑比较混杂，分多了一个函数`_initInputElement`进行初始化`input`的属性。

```javascript
class Uploader {
  // ...
  
  _init () {
    this.uploadFiles = [];
    this.input = this._initInputElement(this.setting);
    // input的onchange事件处理函数
    this.changeHandler = e => {
      // ...
    };
    this.input.addEventListener('change', this.changeHandler);
    this.setting.wrapper.appendChild(this.input);
  }

  _initInputElement (setting) {
    const el = document.createElement('input');
    Object.entries({
      type: 'file',
      accept: setting.accept,
      multiple: setting.multiple,
      hidden: true
    }).forEach(([key, value]) => {
      el[key] = value;
    })''
    return el;
  }
}
```

看完上面的实现，有两点需要说明一下：

1. 为了考虑到`destroy()`的实现，我们需要在`this`属性上暂存`input`标签与绑定的事件。后续方便直接取来，解绑事件与去除dom。
2. 其实把`input`事件函数`changeHandler`单独抽离出去也可以，更方便维护。但是会有this指向问题，因为handler里我们希望将this指向本身实例，若抽离出去就需要使用`bind`绑定一下当前上下文。

上文中的`changeHanler`，来单独分析实现，这里我们要读取文件，响应实例choose事件，将文件列表作为参数传递给`loadFiles`。

为了更加贴合业务需求，可以通过事件返回结果来判断是中断，还是进入下一流程。

```javascript
this.changeHandler = e => {
  const files = e.target.files;
  const ret = this._callHook('choose', files);
  if (ret !== false) {
    this.loadFiles(ret || e.target.files);
  }
};
```

通过这样的实现，如果显式返回`false`，我们则不响应下一流程，否则拿返回结果||文件列表。这样我们就将判断**格式不符，超出大小限制**等等这样的逻辑交给上层实现，响应样式控制。如以下例子：

```javascript
uploader.on('choose', files => {
  const overSize = [].some.call(files, item => item.size > 1024 * 1024 * 10)
  if (overSize) {
    setTips('有文件超出大小限制')
    return false;
  }
  return files;
});
```

#### 状态事件绑定与响应

简单实现上文提到的`_callHook`，将事件挂载在实例属性上。因为要涉及到单个choose事件结果控制。没有按照标准的发布/订阅模式的事件中心来做，有兴趣的同学可以看看[tiny-emitter](https://github.com/scottcorgan/tiny-emitter)的实现。

```javascript
class Uploader {
  // ...
  on (evt, cb) {
    if (evt && typeof cb === 'function') {
      this['on' + evt] = cb;
    }
    return this;
  }

  _callHook (evt, ...args) {
    if (evt && this['on' + evt]) {
      return this['on' + evt].apply(this, args);
    }
    return;
  }
}
```

#### 装载文件列表 - loadFiles

传进来文件列表参数，判断个数响应事件，其次就是要封装出内部列表的数据格式，方便追踪状态和对应对象，这里我们要用一个外部变量生成id，再根据`autoUpload`参数选择是否自动上传。

```javascript
let uid = 1

class Uploader {
  // ...
  loadFiles (files) {
    if (!files) return false;

    if (this.limit !== -1 && 
        files.length && 
        files.length + this.uploadFiles.length > this.limit
    ) {
      this._callHook('exceed', files);
      return false;
    }
    // 构建约定的数据格式
    this.uploadFiles = this.uploadFiles.concat([].map.call(files, file => {
      return {
        uid: uid++,
        rawFile: file,
        fileName: file.name,
        size: file.size,
        status: 'ready'
      }
    }))

    this._callHook('change', this.uploadFiles);
    this.setting.autoUpload && this.upload()

    return true
  }
}
```

到这里其实还没完善，因为`loadFiles`可以用于别的场景下添加文件，我们再增加些许类型判断代码。

```diff
class Uploader {
  // ...
  loadFiles (files) {
    if (!files) return false;
    
+   const type = Object.prototype.toString.call(files)
+   if (type === '[object FileList]') {
+     files = [].slice.call(files)
+   } else if (type === '[object Object]' || type === '[object File]') {
+     files = [files]
+   }

    if (this.limit !== -1 && 
        files.length && 
        files.length + this.uploadFiles.length > this.limit
       ) {
      this._callHook('exceed', files);
      return false;
    }

+    this.uploadFiles = this.uploadFiles.concat(files.map(file => {
+      if (file.uid && file.rawFile) {
+        return file
+      } else {
        return {
          uid: uid++,
          rawFile: file,
          fileName: file.name,
          size: file.size,
          status: 'ready'
        }
      }
    }))

    this._callHook('change', this.uploadFiles);
    this.setting.autoUpload && this.upload()

    return true
  }
}
```

#### 上传文件列表 - upload

这里可根据传进来的参数，判断是上传当前列表，还是单独重传一个，建议是每一个文件单独走一次接口（有助于失败时的文件追踪）。

```javascript
upload (file) {
  if (!this.uploadFiles.length && !file) return;

  if (file) {
    const target = this.uploadFiles.find(
      item => item.uid === file.uid || item.uid === file
    )
    target && target.status !== 'success' && this._post(target)
  } else {
    this.uploadFiles.forEach(file => {
      file.status === 'ready' && this._post(file)
    })
  }
}
```

当中涉及到的`_post`函数，我们往下再单独实现。

#### 交互方法

这里都是些供给外部操作的方法，实现比较简单就直接上代码了。

```javascript
class Uploader {
  // ...
  chooseFile () {
    // 每次都需要清空value,否则同一文件不触发change
    this.input.value = ''
    this.input.click()
  }
  
  removeFile (file) {
    const id = file.id || file
    const index = this.uploadFiles.findIndex(item => item.id === id)
    if (index > -1) {
      this.uploadFiles.splice(index, 1)
      this._callHook('change', this.uploadFiles);
    }
  }

  clear () {
    this.uploadFiles = []
    this._callHook('change', this.uploadFiles);
  }
  
  destroy () {
    this.input.removeEventHandler('change', this.changeHandler)
    this.setting.wrapper.removeChild(this.input)
  }
  // ...
}
```

有一点要注意的是，主动调用`chooseFile`，需要在用户交互之下才会触发选择文件框，就是说要在某个按钮点击事件回调里，进行调用`chooseFile`。否则会出现以下这样的提示：

![](https://user-gold-cdn.xitu.io/2020/3/1/170961f4e3232cce?w=954&h=114&f=png&s=29920)

写到这里，我们可以根据已有代码尝试一下，打印`upload`时的内部`uploadList`，结果正确。

![](https://user-gold-cdn.xitu.io/2020/3/1/170961fbd2df53ee?w=1076&h=452&f=png&s=93871)

#### 发起请求 - _post

这个是比较关键的函数，我们用原生`XHR`实现，因为`fetch`并不支持`progress`事件。简单描述下要做的事：

1. 构建`FormData`，将文件与配置中的`data`进行添加。
2. 构建`xhr`，设置配置中的header、withCredentials，配置相关事件

- onload事件：处理响应的状态，返回数据并改写文件列表中的状态，响应外部`change`等相关状态事件。
- onerror事件：处理错误状态，改写文件列表，抛出错误，响应外部`error`事件
- onprogress事件：根据返回的事件，计算好百分比，响应外部`onprogress`事件

3. 因为xhr的返回格式不太友好，我们需要额外编写两个函数处理http响应：`parseSuccess`、`parseError`

```javascript
_post (file) {
  if (!file.rawFile) return

  const { headers, data, withCredentials } = this.setting
  const xhr = new XMLHttpRequest()
  const formData = new FormData()
  formData.append('file', file.rawFile, file.fileName)

  Object.keys(data).forEach(key => {
    formData.append(key, data[key])
  })
  Object.keys(headers).forEach(key => {
    xhr.setRequestHeader(key, headers[key])
  })

  file.status = 'uploading'

  xhr.withCredentials = !!withCredentials
  xhr.onload = () => {
    /* 处理响应 */
    if (xhr.status < 200 || xhr.status >= 300) {
      file.status = 'error'
      this._callHook('error', parseError(xhr), file, this.uploadFiles)
    } else {
      file.status = 'success'
      this._callHook('success', parseSuccess(xhr), file, this.uploadFiles)
    }
  }
 
  xhr.onerror = e => {
    /* 处理失败 */
    file.status = 'error'
    this._callHook('error', parseError(xhr), file, this.uploadFiles)
  }
 
  xhr.upload.onprogress = e => {
    /* 处理上传进度 */
    const { total, loaded } = e
    e.percent = total > 0 ? loaded / total * 100 : 0
    this._callHook('progress', e, file, this.uploadFiles)
  }

  xhr.open('post', this.setting.url, true)
  xhr.send(formData)
}
```

##### parseSuccess

将响应体尝试JSON反序列化，失败的话再返回原样文本

```javascript
const parseSuccess = xhr => {
  let response = xhr.responseText
  if (response) {
    try {
      return JSON.parse(response)
    } catch (error) {}
  }
  return response
}
```

##### parseError

同样的，JSON反序列化，此处还要抛出个错误，记录错误信息。

```javascript
const parseError = xhr => {
  let msg = ''
  let { responseText, responseType, status, statusText } = xhr
  if (!responseText && responseType === 'text') {
    try {
      msg = JSON.parse(responseText)
    } catch (error) {
      msg = responseText
    }
  } else {
    msg = `${status} ${statusText}`
  }

  const err = new Error(msg)
  err.status = status
  return err
}
```

至此，一个完整的Upload类已经构造完成，整合下来大概200行代码多点，由于篇幅问题，[完整的代码](https://github.com/impeiran/Blog/blob/master/uploader/uploader.js)已放在个人github里。

### 测试与实践

写好一个类，当然是上手实践一下，由于测试代码并不是本文关键，所以采用截图的方式呈现。为了呈现良好的效果，把chrome里的network调成自定义降速，并在测试失败重传时，关闭网络。


![](https://user-gold-cdn.xitu.io/2020/3/1/170962ebabc3b945?w=480&h=305&f=gif&s=4454775)

#### 服务端

这里用node搭建了一个小的http服务器，用`multiparty`处理文件接收。

![](https://user-gold-cdn.xitu.io/2020/3/1/17096214064f2f2b?w=1536&h=1442&f=png&s=290075)

#### 客户端

简单的用html结合vue实现了一下，会发现将业务代码跟基础代码分开实现后，简洁明了不少

![](https://user-gold-cdn.xitu.io/2020/3/1/170962181a83adcf?w=1508&h=1908&f=png&s=382305)

#### 拓展拖拽上传

拖拽上传注意两个事情就是

1. 监听drop事件，获取`e.dataTransfer.files`
2. 监听dragover事件，并执行`preventDefault()`，防止浏览器弹窗。

##### 更改客户端代码如下：


![](https://user-gold-cdn.xitu.io/2020/3/1/1709622ef252bcf7?w=974&h=808&f=png&s=98062)

##### 效果图GIF

![](https://user-gold-cdn.xitu.io/2020/3/1/17096220e064c2ff?w=640&h=451&f=gif&s=2500732)

### 优化与总结

本文涉及的全部源代码以及测试代码均已上传到[github仓库](https://github.com/impeiran/Blog/tree/master/uploader)中，有兴趣的同学可自行查阅。

代码当中还存在不少需要的优化项以及争论项，等待各位读者去斟酌改良：

- 文件大小判断是否应该结合到类里面？看需求，因为有时候可能会有根据`.zip`压缩包的文件，可以允许更大的体积。
- 是否应该提供可重写ajax函数的配置项？
- 参数是否应该可传入一个函数动态确定？
- ...
