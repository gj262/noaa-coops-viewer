import React from 'react'

import './YearSelector.scss'

export default class YearSelector extends React.Component {
  static propTypes = {
    years: React.PropTypes.array.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleYear: React.PropTypes.func
  };

  render () {
    return (
        <table className='table table-condensed years'>
          <thead>
          </thead>
          <tbody>
          {this.props.years.map(year => (
            <tr key={year}>
              <td>
                {year}
              </td>
              <td>
                <input type='checkbox' checked={this.isChecked(year)} onChange={this.yearSelect.bind(this, year)} />
              </td>
            </tr>
          ))}
          </tbody>
        </table>
    )
  }

  isChecked(year) {
    return this.props.selection.indexOf(year) !== -1
  }

  yearSelect(year) {
    this.props.toggleYear(year)
  }
}
