
const EventEmitter = require('fast-event-emitter')

const Utils = require('./Utils')

class Button extends EventEmitter {
  constructor (name= '', text=':)', color='default', options = {}) {
    super()

    if (typeof text === "object") {
      options = text;
      text = String(options.label);
      options.label = undefined;
    }

    let obj = {
      action: {
        type: Button.TEXT_TYPE,
        label: text,
      },
      color: color
    }
    
    /** Why ?? */
    if (options.label === undefined) delete options.label;

    Object.assign(obj.action, options);

    if (obj.action.type !== Button.TEXT_TYPE) {
      delete obj.color;
      if (obj.action.type !== Button.VK_APPS_TYPE) {
        if (obj.action.label) delete obj.action.label;
      }
    }

    if (!obj.action.payload) {
      obj.action.payload = {}
    }

    let _name = String(name).replace(/\s/g, "");
    if (!name || !_name.length || typeof name !== "string") throw new Error('Button name must be sizeable string')
    name = _name;

    Object.defineProperty(this, "name", {
      value: name,
      writeable: false,
      enumerable: false,
    })

    Object.defineProperty(this, "defaultSettings", {
      value: {
        action: obj.action,
        color: color,
        label: obj.action.label,
        payload: obj.action.payload
      },
      enumerable: false
    })

    Object.assign(this, obj)

    this.__events = undefined

    Object.defineProperty(this, '__events', {
      enumerable: false,
      value: {}
    })



    this.action = this.action || {}
    this.action.payload = this.action.payload || {}

    let id = Utils.hashCode(this.action.label || '');

    id = id + '_' + color + '_' + name;

    Object.defineProperty(this, 'origin', obj)
    Object.defineProperty(this, 'id', {
      enumerable: false,
      value: id
    })

    this.action.payload.bid = this.id
    this.__savePayload()
  }

  __savePayload () {
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

Button.VK_PAY_TYPE = 'vk_pay';
Button.LOCATION_TYPE = 'location';
Button.VK_APPS_TYPE = 'open_app';
Button.TEXT_TYPE = 'text';

module.exports = Button