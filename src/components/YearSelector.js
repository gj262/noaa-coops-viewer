import React from 'react'
import { MIN, AVG, MAX } from 'reducers/coOps'

import './YearSelector.scss'

export default class YearSelector extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleYear: React.PropTypes.func
  };

  render () {
    var years = {};
    this.props.data.forEach(dataset => {
      if (!(dataset.year in years)) {
        years[dataset.year] = { year: dataset.year }
      }
      if (dataset.sampleFunction === MIN) {
        years[dataset.year].min = dataset.min
      }
      else if (dataset.sampleFunction === MAX) {
        years[dataset.year].max = dataset.max
      }
      else if (dataset.sampleFunction === AVG) {
        years[dataset.year].avg = dataset.avg
      }
    })
    var orderedYears = Object.keys(years).sort((a, b) => b - a).map(year => years[year])
    return (
        <table className='table table-condensed years'>
          <thead>
          </thead>
          <tbody>
          {orderedYears.map(yearData => (
            <tr key={yearData.year}>
              <td>
                <input type='checkbox' checked={this.isChecked(yearData.year)} onChange={this.yearSelect.bind(this, yearData.year)} />
              </td>
              <td>
                {yearData.year}
              </td>
              <td>
                {yearData.min.toFixed(2)}
              </td>
              <td>
                {yearData.avg.toFixed(2)}
              </td>
              <td>
                {yearData.max.toFixed(2)}
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
