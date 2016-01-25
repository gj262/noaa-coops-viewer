import React from 'react'
import { MIN, MAX } from 'reducers/coOps'

import './YearSelector.scss'

export default class YearSelector extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleYear: React.PropTypes.func
  };

  render () {
    var years = {}
    var overall = { minRange: {}, max: {} }
    this.props.data.forEach(dataset => {
      if (!(dataset.year in years)) {
        years[dataset.year] = { year: dataset.year }
      }
      if (dataset.bound === MIN) {
        years[dataset.year].min = dataset.min
        if (!('min' in overall.minRange) || dataset.min < overall.minRange.min) {
          overall.minRange.min = dataset.min
        }
        if (!('max' in overall.minRange) || dataset.min > overall.minRange.max) {
          overall.minRange.max = dataset.min
        }
      }
      else if (dataset.bound === MAX) {
        years[dataset.year].max = dataset.max
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
              <td style={this.minValueStyle(yearData.min, overall.minRange)}>
                {yearData.min.toFixed(2)}
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

  minValueStyle(value, range) {
    var index = range.max === range.min ? 0 : Math.floor(4 * ((value - range.min) / (range.max - range.min)));
    return {
      background: ['#2f56e0', '#2d64f5', '#2f8dff', '#33abf9', '#34ccff'][index],
      color: ['white', 'white', 'black', 'black', 'black'][index]
    };
  }
}
