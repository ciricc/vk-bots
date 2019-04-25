const Button = require('./Button')

class Keyboard {

  constructor (keyboardArray = [], oneTime = false) {
    
    this.rows = [];
    this.oneTime = oneTime || false;
    
    this.id = String(new Date().getTime()) + String(Math.random() * 1000);
    this.buttons = {}

    keyboardArray.forEach((row, i) => {
      if (!Array.isArray(row)) {
        throw new Error('Keyboard have not correct format at row[' + i + ']')
      }
      this.addRow(row)
    })
  }

  addRow(row) {
    
    let realRow = [];

    row.forEach((elem, i) => {
      if (!(elem instanceof Button)) throw new Error('Row must content only buttons button[' + this.rows.length + '][' + i + ']')
        this.buttons[elem.id] = [this.rows.length, i]
    })

    this.rows.push(row);

    return this
  }

  deleteRow (indexRow = 0) {
    this.rows = this.rows.slice(indexRow, 1);

    return this
  }

  oneTime (oneTime = false) {
    this.oneTime = oneTime

    return this
  }

  deleteButton (x, y) {
    if (isNaN(y) || !this.rows[y]) throw new Error('Y coord need be correct')
    if (isNaN(x) || !this.rows[y][x]) throw new Error('X coord need be correct')
    this.rows[y] = this.rows[y].slice(x, 1)

    return this
  }

  addButtonAfter (y, button) {
    if (isNaN(y) || !this.rows[y]) throw new Error('Y coord need be correct')
    if (!(button instanceof Button)) throw new Error('Ned button must be Button only')
    
    this.rows[y].push(button)
    
    return this
  }

  toJSON () {
    return JSON.stringify({
      one_time: this.oneTime,
      buttons: this.rows
    }) 
  }
}

module.exports = Keyboard