import React from 'react'
import Moment from 'moment'

export default class YearSelector extends React.Component {
  static propTypes = {
    end: React.PropTypes.number.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleYear: React.PropTypes.func
  }

  render () {
    var years = this.getYears()
    return (
        <div>
        <ul>
        {years.map(year => (
            <li key={year}>
            {year}
            <input type='checkbox' checked={this.isChecked(year)} onChange={this.yearSelect.bind(this, year)} />
            </li>
        ))}
        </ul>
        </div>
    )
  }

  getYears() {
    var years = [];
    var year = Moment().get('year')
    while (year > this.props.end) {
      years.push(year)
      year--
    }
    return years
  }

  isChecked(year) {
    return this.props.selection.indexOf(year) !== -1
  }

  yearSelect(year) {
    this.props.toggleYear(year)
  }
}
