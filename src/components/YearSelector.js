import PropTypes from 'prop-types'
import React from 'react'
import { MIN, MAX } from 'reducers/coOps'

import './YearSelector.scss'

const debug = window.debug('components/year-selector')

export default class YearSelector extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    isFetching: PropTypes.bool.isRequired,
    selection: PropTypes.array.isRequired,
    toggleYearSelection: PropTypes.func.isRequired,
    setHoverYear: PropTypes.func.isRequired,
    clearHoverYear: PropTypes.func.isRequired,
    hoverYear: PropTypes.number
  }

  render () {
    return (
      <div>
        <table className='table table-condensed table-hover years'>
          <thead>
            <tr>
              <th />
              <th />
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {this.props.data.map(yearData => (
              <tr
                key={yearData.year}
                onMouseOver={() => this.onMouseOverYear(yearData)}
                onMouseOut={() => this.onMouseOutYear(yearData)}
                className={
                  this.props.hoverYear === yearData.year ? 'emphasized' : ''
                }
              >
                <td>
                  <input
                    type='checkbox'
                    checked={this.isChecked(yearData.year)}
                    onChange={() => this.yearSelect(yearData.year)}
                  />
                </td>
                <td>
                  {yearData.year} {yearData.partial ? <sup>p</sup> : null}{' '}
                  {yearData.bogus ? <sup>b</sup> : null}
                </td>
                <td style={this.minValueStyle(yearData)}>
                  {yearData[MIN].min.toFixed(2)}
                </td>
                <td style={this.maxValueStyle(yearData)}>
                  {yearData[MAX].max.toFixed(2)}
                </td>
              </tr>
            ))}
            {this.renderFetching()}
          </tbody>
        </table>
        <span>
          <sup>p</sup> only partial data is available for these years.
        </span>
        <span>
          <sup>b</sup> these years have wildly different data from the norm.
        </span>
      </div>
    )
  }

  renderFetching () {
    if (!this.props.isFetching) {
      return null
    }
    return (
      <tr>
        <td />
        <td />
        <td colSpan={2}>Loading...</td>
      </tr>
    )
  }

  isChecked (year) {
    return this.props.selection.indexOf(year) !== -1
  }

  yearSelect = year => {
    this.props.clearHoverYear()
    this.props.toggleYearSelection(year)
  }

  onMouseOverYear = yearData => {
    debug(`mouseover ${yearData.year}`)
    this.props.setHoverYear(yearData.year)
  }

  onMouseOutYear = yearData => {
    debug(`mouseout ${yearData.year}`)
    this.props.clearHoverYear()
  }

  // Dave Thompson's palette
  // http://research.jisao.washington.edu/wallace/palette.gif

  minValueStyle (yearData) {
    if (yearData.partial) {
      return {}
    }
    var index = Math.floor(4 * yearData[MIN].heatIndex)
    return {
      background: [
        'rgb(60,160,240)',
        'rgb(80,180,250)',
        'rgb(130,210,255)',
        'rgb(160,240,255)',
        'rgb(200,250,255)'
      ][index]
    }
  }

  maxValueStyle (yearData) {
    if (yearData.partial) {
      return {}
    }
    var index = Math.floor(4 * yearData[MAX].heatIndex)
    return {
      background: [
        'rgb(255,232,120)',
        'rgb(255,192,60)',
        'rgb(255,160,0)',
        'rgb(255,96,0)',
        'rgb(255,50,0)'
      ][index]
    }
  }
}
