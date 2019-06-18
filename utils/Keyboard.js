const Button = require('./Button')

class Keyboard {

  constructor (keyboardArray = [], oneTime = false) {
    
    this.rows = [];
    this._oneTime = oneTime || false;
    
    this.id = String(new Date().getTime()) + String(Math.random() * 1000);
    
    this.buttons = {}
    this.buttonsNames = {}

    keyboardArray.forEach((row, i) => {
      if (!Array.isArray(row)) {
        throw new Error('Keyboard have not correct format at row[' + i + ']')
      }
      this.addRow(row)
    })
  }

  addRow(row=[]) {
    
    let realRow = [];

    row.forEach((elem, i) => {
      if (!(elem instanceof Button)) throw new Error('Row must content only buttons button[' + this.rows.length + '][' + i + ']')
        this.buttons[elem.id] = [this.rows.length, i]
        this.buttonsNames[elem.name] = elem.id
    })

    this.rows.push(row);

    return this
  }

  deleteRow (y=0) {
    this.rows.splice(y, 1);
    return this;
  }

  button(name = '') {
    let buttonCoords = this.buttons[this.buttonsNames[name]]
    return this.rows[buttonCoords[0]][buttonCoords[1]];
  }

  deleteRow (indexRow = 0) {
    this.rows = this.rows.slice(indexRow, 1);

    return this
  }

  oneTime (oneTime = false) {
    this._oneTime = oneTime

    return this
  }

  deleteButtonXy (x, y) {
    if (isNaN(y) || !this.rows[y]) throw new Error('Y coord need be correct')
    if (isNaN(x) || !this.rows[y][x]) throw new Error('X coord need be correct')
      
    let btn = this.rows[y][x];

    delete this.buttons[this.buttonsNames[btn.name]];
    delete this.buttonsNames[btn.name];

    this.rows[y].splice(x, 1)

    return this
  }

  deleteButton (name='') {
    let buttonCoords = this.buttons[this.buttonsNames[name]];
    if (!buttonCoords) throw new Error('Button is already deleted')
    return this.deleteButtonXy(...(buttonCoords.reverse()));
  }

  addButtonAfter (y, button) {
    if (isNaN(y) || !this.rows[y]) throw new Error('Y coord need be correct')
    if (!(button instanceof Button)) throw new Error('Ned button must be Button only')
    
    this.buttons[button.id] = [y, this.rows[y].length]
    this.buttonsNames[button.name] = button.id

    this.rows[y].push(button)
    
    return this
  }

  addButtonBefore (y, button) {
    if (isNaN(y) || !this.rows[y]) throw new Error('Y coord need be correct')
    if (!(button instanceof Button)) throw new Error('Ned button must be Button only')
    
    this.buttons[button.id] = [y, 0]
    this.buttonsNames[button.name] = button.id

    this.rows[y].unshift(button);

    return this;
  }

  toJSON () {
    return JSON.stringify({
      one_time: this._oneTime,
      buttons: this.rows
    }) 
  }
}

module.exports = Keyboard