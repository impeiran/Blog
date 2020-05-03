class Vue {
  constructor (option) {
    this._option = option
    this._el = document.querySelector(option.el)
    this._template = this._el.innerHTML

    this._initState(this)

    new Watcher(this, function update () {
      this._mount()
    })
  }

  _initState () {
    const data = this._data = this._option.data
      ? this._option.data() : {}

    const keys = Object.keys(data)
    let i = keys.length
    while (i--) {
      const key = keys[i]
      proxy(this, '_data', key)
    }
    observe(data)
  }

  _mount () {
    const _this = this
    let template = _this._template

    // 替换差值表达式
    let matchText
    while ((matchText = /\{\{((\w)+?)\}\}/.exec(template))) {
      template = template.replace(matchText[0], _this._data[matchText[1]])
    }

    _this._el.innerHTML = template
  }
}