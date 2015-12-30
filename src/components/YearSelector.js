import React from 'react'

import './YearSelector.scss'

export default class YearSelector extends React.Component {
  static propTypes = {
    years: React.PropTypes.array.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleYear: React.PropTypes.func
  }

  render () {
    return (
        <div>
        <ul className='years'>
        {this.props.years.map(year => (
            <li key={year}>
            {year}
            &nbsp;
            <input type='checkbox' checked={this.isChecked(year)} onChange={this.yearSelect.bind(this, year)} />
            </li>
        ))}
        </ul>
        </div>
    )
  }

  isChecked(year) {
    return this.props.selection.indexOf(year) !== -1
  }

  yearSelect(year) {
    this.props.toggleYear(year)
  }
}
