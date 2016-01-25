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
    var overall = { minRange: {}, maxRange: {} }
    this.props.data.forEach(dataset => {
      if (!(dataset.year in years)) {
        years[dataset.year] = { year: dataset.year }
      }
      if (dataset.bound === MIN) {
        years[dataset.year].min = dataset.min
        this.updateRange(dataset.min, overall.minRange)
      }
      else if (dataset.bound === MAX) {
        years[dataset.year].max = dataset.max
        this.updateRange(dataset.max, overall.maxRange)
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
              <td style={this.maxValueStyle(yearData.max, overall.maxRange)}>
                {yearData.max.toFixed(2)}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
    )
  }

  updateRange(value, range) {
    if (!('min' in range) || value < range.min) {
      range.min = value
    }
    if (!('max' in range) || value > range.max) {
      range.max = value
    }
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

  maxValueStyle(value, range) {
    var index = range.max === range.min ? 0 : Math.floor(4 * ((value - range.min) / (range.max - range.min)));
    return {
      background: ['rgb(255,232,120)', 'rgb(255,192,60)', 'rgb(255,160,0)', 'rgb(255,96,0)', 'rgb(255,50,0)'][index],
      color: ['black', 'black', 'black', 'black', 'white'][index]
    };
  }
}
