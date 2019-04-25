const EventEmitter = require('fast-event-emitter')

class History extends EventEmitter {

  constructor () {
    
    super();

    this.states = ['default'];
    this.location = this.states[0]
  }

  go (receiverName) {
    if (!receiverName) throw new Error('Receiver name must be not empty')
  
    let rec = receiverName;

    if (receiverName.receiverName) 
      receiverName = receiverName.receiverName;

    if (this.location !== receiverName) {
      this.states.push(receiverName);
      this.location = rec || receiverName;
    }

    this.emit('change', rec)

    return this
  } 

  back (receiverName) {

    let indexStart = this.states.indexOf(receiverName)

    if (indexStart !== -1) { // If have a receiver in states
      this.states = this.states.slice(0, indexStart)
      this.location = receiverName;
    } else {
      this.states = this.states.slice(0,-1)
      this.location = this.states[this.states.length - 1]
    } //If doesnt have then need only one back

    this.emit('change', this.location)

    return this
  } 

  clear () {
    this.states = ['default']
    this.location = this.states[0]

    this.emit('change', this.location)

    return this
  }

}

module.exports = History;
