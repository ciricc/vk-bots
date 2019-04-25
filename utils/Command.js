const Button = require('./Button')
const Utils = require('./Utils')

class Command {
  constructor (options = {}) {
    if (!options.match) throw new Error('Options match is undefined!')
    if (!options.handler || typeof options.handler !== "function") throw new Error('Option handler must be function only')
    

    let argsRegExp = /\s?({(.*?)}\s?)/g

    let args = (options.match.match(argsRegExp) || []).map(arg => arg.replace(/(\{|\}|\s)/g, ''))
    let realArgs = Utils.getArgs(options.match);
    realArgs.map(arg => {
      return arg.replace(/{(\s)*/g, '{').replace(/(\s)*}/g, '}')
    })
    options.match = options.match.replace(argsRegExp, '')

    let commandRegExp = '^' + options.match + '(.*?)([ ]+)?$'
    
    
    if (!Array.isArray(options.buttons) && options.buttons !== undefined) options.buttons = [options.buttons]     

    this.btnIds = [];

    if (options.buttons !== undefined) {
      options.buttons.forEach((btn) => {
        if (!(btn instanceof Button)) throw new Error('Buttons must content Button classes only')
        this.btnIds.push(btn.id)
        btn.on('click', (args) => {
          options.handler(...args)
        })    
      })
    } else {
      options.buttons = []
    }

    let _args = {}
    
    this.enabled = true;

    Object.assign(this, options)
    
    args.forEach((arg, i) => {
      _args[arg] = (options.args && options.args[arg]) ?  Object.assign(options.args[arg], {
        index: realArgs.indexOf(`{${arg}}`)
      }) : {
        index: realArgs.indexOf(`{${arg}}`),
        type: String,
        required: false
      }
    })

    
    this.commandRegExp = commandRegExp;
    this.args = _args;

  }
}

module.exports = Command