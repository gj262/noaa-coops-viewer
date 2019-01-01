import PropTypes from 'prop-types'
import React from 'react'
import { VictoryAxis } from 'victory-axis'
import { VictoryChart } from 'victory-chart'
import { Curve } from 'victory-line'
import { StaticVictoryLine } from 'components/StaticVictory'
import * as d3Scale from 'd3-scale'
import { timeFormat as d3TimeFormat } from 'd3-time-format'

import './Chart.scss'

export default class Chart extends React.Component {
  static propTypes = {
    /* eslint-disable react/no-unused-prop-types */
    linePalette: PropTypes.array,
    data: PropTypes.array,
    years: PropTypes.array,
    hoverYear: PropTypes.number,
    selectedStationID: PropTypes.string,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    setHoverYear: PropTypes.func.isRequired,
    clearHoverYear: PropTypes.func.isRequired
  }

  static defaultProps = {
    linePalette: [
      '#1CE6FF',
      '#FF34FF',
      '#FF4A46',
      '#008941',
      '#006FA6',
      '#A30059',
      '#FFDBE5',
      '#7A4900',
      '#0000A6',
      '#63FFAC',
      '#B79762',
      '#004D43',
      '#8FB0FF',
      '#997D87',
      '#5A0007',
      '#809693',
      '#FEFFE6',
      '#1B4400',
      '#4FC601',
      '#3B5DFF',
      '#4A3B53',
      '#FF2F80',
      '#61615A',
      '#BA0900',
      '#6B7900',
      '#00C2A0',
      '#FFAA92',
      '#FF90C9',
      '#B903AA',
      '#D16100',
      '#DDEFFF',
      '#000035',
      '#7B4F4B',
      '#A1C299',
      '#300018',
      '#0AA6D8',
      '#013349',
      '#00846F',
      '#372101',
      '#FFB500',
      '#C2FFED',
      '#A079BF',
      '#CC0744',
      '#C0B9B2',
      '#C2FF99',
      '#001E09',
      '#00489C',
      '#6F0062',
      '#0CBD66',
      '#EEC3FF',
      '#456D75',
      '#B77B68',
      '#7A87A1',
      '#788D66',
      '#885578',
      '#FAD09F',
      '#FF8A9A',
      '#D157A0',
      '#BEC459',
      '#456648',
      '#0086ED',
      '#886F4C',
      '#34362D',
      '#B4A8BD',
      '#00A6AA',
      '#452C2C',
      '#636375',
      '#A3C8C9',
      '#FF913F',
      '#938A81',
      '#575329',
      '#00FECF',
      '#B05B6F',
      '#8CD0FF',
      '#3B9700',
      '#04F757',
      '#C8A1A1',
      '#1E6E00',
      '#7900D7',
      '#A77500',
      '#6367A9',
      '#A05837',
      '#6B002C',
      '#772600',
      '#D790FF',
      '#9B9700',
      '#549E79',
      '#FFF69F',
      '#201625',
      '#72418F',
      '#BC23FF',
      '#99ADC0',
      '#3A2465',
      '#922329',
      '#5B4534',
      '#FDE8DC',
      '#404E55',
      '#0089A3',
      '#CB7E98',
      '#A4E804',
      '#324E72',
      '#6A3A4C'
    ]
  }

  constructor (props) {
    super(props)

    var yTicks = this.makeYTicks(props.data)
    var yDomain = this.makeYDomain(yTicks)

    this.state = {
      chartData: this.makeChartData(props),
      availableYears: this.makeAvailableYears(props),
      yTicks,
      yDomain,
      xTicks: this.makeXTicks(),
      xDomain: this.makeXDomain()
    }
  }

  get axisStyle () {
    return {
      grid: { stroke: '#c9c5bb', strokeWidth: 1 },
      ticks: { stroke: '#756f6a', size: 5 },
      tickLabels: {
        fontFamily: 'Helvetica',
        color: '#756f6a',
        fontSize: '10px'
      }
    }
  }

  makeXTicks () {
    var months = []
    var start = global.moment([2012])
    for (var i = 0; i < 12; i++) {
      months.push(start.clone().toDate())
      start.add(1, 'month')
    }
    return months
  }

  makeXDomain () {
    return [global.moment([2012]), global.moment([2012]).add(1, 'year')]
  }

  componentWillReceiveProps (nextProps) {
    var yTicks = this.makeYTicks(nextProps.data)
    var yDomain = this.makeYDomain(yTicks)

    this.setState({
      chartData: this.makeChartData(nextProps),
      availableYears: this.makeAvailableYears(nextProps),
      yTicks,
      yDomain
    })
  }

  makeChartData (props) {
    return props.data.map(yearData => {
      var chartYearData = Object.assign({}, yearData)
      var colorIdx = yearData.year % props.linePalette.length
      chartYearData.color = props.linePalette[colorIdx]
      chartYearData.visible =
        props.years.indexOf(yearData.year) !== -1 ||
        props.hoverYear === yearData.year
      chartYearData.mouseover = props.hoverYear === yearData.year
      chartYearData.thin = !chartYearData.visible && !chartYearData.bogus
      return chartYearData
    })
  }

  makeAvailableYears (props) {
    var availableYears = props.data.map(yearData => yearData.year)

    return availableYears.sort((a, b) => b - a)
  }

  makeYTicks (data) {
    if (!data || data.length === 0) {
      return []
    }
    var min
    var max
    data
      .filter(yearData => !yearData.bogus)
      .forEach(yearData => {
        if (!min || yearData.min < min) {
          min = yearData.min
        }
        if (!max || yearData.max > max) {
          max = yearData.max
        }
      })
    var ticks = []
    for (var tick = Math.floor((min - 1) / 5) * 5; tick < max + 1; tick += 5) {
      ticks.push(tick)
    }
    ticks.push(tick)
    return ticks
  }

  makeYDomain (ticks) {
    return [ticks[0], ticks[ticks.length - 1]]
  }

  render () {
    if (!this.state.chartData || this.state.chartData.length === 0) {
      return null
    }

    var width = this.props.width
    if (width < 600) {
      width = 600
    }

    var aspectRatio = this.props.height / this.props.width
    aspectRatio = aspectRatio >= 1 ? 0.666 : aspectRatio <= 0.5 ? 0.333 : 0.5
    var height = width * aspectRatio

    return (
      <VictoryChart
        key={`${width} ${height}`}
        width={width}
        height={height}
        scale={{
          x: d3Scale.scaleTime(),
          y: d3Scale.scaleLinear()
        }}
        domain={{
          x: this.state.xDomain,
          y: this.state.yDomain
        }}
        domainPadding={10}
      >
        {this.renderYAxis()}
        {this.renderXAxis()}
        {this.state.chartData.map(yearData =>
          this.renderLinesForYear(yearData)
        )}
      </VictoryChart>
    )
  }

  renderYAxis () {
    return (
      <VictoryAxis
        dependentAxis
        tickValues={this.state.yTicks}
        style={this.axisStyle}
        label='&deg;F'
      />
    )
  }

  renderXAxis () {
    return (
      <VictoryAxis
        style={this.axisStyle}
        tickValues={this.state.xTicks}
        tickFormat={t => d3TimeFormat('%B')}
        xOffset={10}
      />
    )
  }

  renderLinesForYear (yearData) {
    return yearData.data.map((chunk, idx) => {
      var instanceKey =
        this.props.selectedStationID +
        yearData.year +
        idx +
        this.state.yTicks[0] +
        this.state.yTicks[this.state.yTicks.length - 1]

      return (
        <StaticVictoryLine
          key={instanceKey}
          updateAttrs={`${yearData.visible} ${yearData.thin} ${
            yearData.mouseover
          } ${this.state.yTicks[0]} ${
            this.state.yTicks[this.state.yTicks.length - 1]
          }`}
          range={[
            this.state.yTicks[0],
            this.state.yTicks[this.state.yTicks.length - 1]
          ]}
          interpolation='linear'
          data={chunk}
          x={d => new Date('2012' + d.t.substr(4))}
          y='v'
          style={{
            data: this.getLineStyle(yearData),
            label: { color: yearData.color }
          }}
          dataComponent={
            <Curve
              events={{
                onMouseOver: () => this.props.setHoverYear(yearData.year),
                onMouseOut: () => this.props.clearHoverYear()
              }}
            />
          }
        />
      )
    })
  }

  getLineStyle (yearData) {
    return {
      stroke: yearData.mouseover
        ? '#000000'
        : yearData.visible
          ? yearData.color
          : 'lightGrey',
      strokeWidth: yearData.visible ? 2 : yearData.thin ? 0.5 : 0
    }
  }
}
