import React from 'react'
import { MIN, MAX } from 'reducers/coOps'

import './YearSelector.scss'

const debug = window.debug('components/year-selector');

export default class YearSelector extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleYearSelection: React.PropTypes.func.isRequired,
    setHoverYear: React.PropTypes.func.isRequired,
    clearHoverYear: React.PropTypes.func.isRequired
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
        <table className='table table-condensed table-hover years'>
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
          {orderedYears.map(yearData => (
            <tr
              key={yearData.year}
              onMouseOver={this.onMouseOverYear.bind(this, yearData)}
              onMouseOut={this.onMouseOutYear.bind(this, yearData)}>
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
    this.props.toggleYearSelection(year)
  }

  onMouseOverYear(yearData) {
    debug(`mouseover ${yearData.year}`)
    this.props.setHoverYear(yearData.year)
  }

  onMouseOutYear(yearData) {
    debug(`mouseout ${yearData.year}`)
    this.props.clearHoverYear()
  }

  // Dave Thompson's palette
  // http://research.jisao.washington.edu/wallace/palette.gif

  minValueStyle(value, range) {
    var index = range.max === range.min ? 0 : Math.floor(4 * ((value - range.min) / (range.max - range.min)));
    return {
      background: ['rgb(60,160,240)', 'rgb(80,180,250)', 'rgb(130,210,255)', 'rgb(160,240,255)', 'rgb(200,250,255)'][index]
    };
  }

  maxValueStyle(value, range) {
    var index = range.max === range.min ? 0 : Math.floor(4 * ((value - range.min) / (range.max - range.min)));
    return {
      background: ['rgb(255,232,120)', 'rgb(255,192,60)', 'rgb(255,160,0)', 'rgb(255,96,0)', 'rgb(255,50,0)'][index]
    };
  }
}
