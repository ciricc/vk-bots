
const EventEmitter = require('fast-event-emitter')

const Utils = require('./Utils')

class Button extends EventEmitter {
  constructor (text='000', color='default', payload = {}) {
    super()

    let obj = {
      action: {
        type: 'text',
        label: text,
        payload: payload
      },
      color: color
    }

    Object.assign(this, obj)

    this.__events = undefined

    Object.defineProperty(this, '__events', {
      enumerable: false,
      value: {}
    })



    this.action = this.action || {}
    this.action.payload = this.action.payload || {}

    let id = Utils.hashCode(this.action.label) || Utils.hashCode(String(new Date().getTime()))
    
    id = id + '_' + color;

    Object.defineProperty(this, 'origin', obj)
    Object.defineProperty(this, 'id', {
      enumerable: false,
      value: id
    })

    this.action.payload.bid = this.id
    this.action.payload = JSON.stringify(this.action.payload).replace(/\\/g, '')

  }

  withId (id = 0) {
    Object.assign(this, this.origin)
    
    Object.defineProperty(this, 'id', {
      enumerable: false,
      value: id
    })

    this.action.payload.bid = this.id
    this.action.payload = JSON.stringify(this.action.payload).replace(/\\/g, '')

    return this
  }
}

Button.GREEN = 'positive'
Button.BLUE = 'primary'
Button.RED = 'negative'
Button.WHITE = 'default'

module.exports = Button