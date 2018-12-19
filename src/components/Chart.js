import PropTypes from 'prop-types'
import React from 'react'
import { VictoryAxis, VictoryChart } from 'victory'
import { StaticVictoryLine } from 'components/StaticVictory'
import { MIN, MAX } from 'reducers/coOps'
import Moment from 'moment'
import * as d3Scale from 'd3-scale'

import './Chart.scss'

export default class Chart extends React.Component {
  static propTypes = {
    linePalette: PropTypes.array,
    data: PropTypes.array,
    years: PropTypes.array,
    hoverYear: PropTypes.number,
    selectedStationID: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
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

  constructor () {
    super()
    this.state = {
      chartData: [],
      availableYears: [],
      xTicks: this.makeXTicks(),
      xDomain: this.makeXDomain(),
      yTicks: [],
      yDomain: []
    }
  }

  makeXTicks () {
    var months = []
    var start = Moment([2012])
    for (var i = 0; i < 12; i++) {
      months.push(start.clone().toDate())
      start.add(1, 'month')
    }
    return months
  }

  makeXDomain () {
    return [Moment([2012]), Moment([2012]).add(1, 'year')]
  }

  componentWillReceiveProps (nextProps) {
    // Map to display data as new data is received.
    var chartData = nextProps.data.map(dataset => {
      var chartDataset = Object.assign({}, dataset)
      var colorIdx = dataset.year % this.props.linePalette.length
      chartDataset.color = this.props.linePalette[colorIdx]
      chartDataset.visible =
        nextProps.years.indexOf(dataset.year) !== -1 ||
        nextProps.hoverYear === dataset.year
      chartDataset.mouseover = nextProps.hoverYear === dataset.year
      chartDataset.thin = !chartDataset.visible && !chartDataset.bogus
      return chartDataset
    })

    var availableYears = this.state.availableYears
    nextProps.data.forEach(dataset => {
      if (availableYears.indexOf(dataset.year) === -1) {
        availableYears = availableYears
          .concat(dataset.year)
          .sort((a, b) => b - a)
      }
    })

    var yTicks = this.makeYTicks(nextProps.data)
    var yDomain = this.makeYDomain(yTicks)

    this.setState({
      chartData,
      availableYears,
      yTicks,
      yDomain
    })
  }

  makeYTicks (data) {
    if (!data || data.length === 0) {
      return []
    }
    var min
    var max
    data
      .filter(dataset => !dataset.bogus)
      .forEach(dataset => {
        if (!min || dataset[MIN].min < min) {
          min = dataset[MIN].min
        }
        if (!max || dataset[MAX].max > max) {
          max = dataset[MAX].max
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
      >
        {this.renderYAxis()}
        {this.renderXAxis()}
        {this.state.chartData.map(dataset => this.renderLine(dataset, MIN))}
        {this.state.chartData.map(dataset => this.renderLine(dataset, MAX))}
      </VictoryChart>
    )
  }

  renderYAxis () {
    return (
      <VictoryAxis
        dependentAxis
        tickValues={this.state.yTicks}
        style={{
          grid: { strokeWidth: 1 }
        }}
      />
    )
  }

  renderXAxis () {
    return (
      <VictoryAxis
        style={{
          grid: { strokeWidth: 1 }
        }}
        tickValues={this.state.xTicks}
      />
    )
  }

  renderLine (dataset, bound) {
    var instanceKey =
      this.props.selectedStationID +
      dataset.year +
      bound +
      this.state.yTicks[0] +
      this.state.yTicks[this.state.yTicks.length - 1]
    return (
      <StaticVictoryLine
        key={instanceKey}
        updateAttrs={`${dataset.visible} ${dataset.thin} ${dataset.mouseover} ${
          this.state.yTicks[0]
        } ${this.state.yTicks[this.state.yTicks.length - 1]}`}
        range={[
          this.state.yTicks[0],
          this.state.yTicks[this.state.yTicks.length - 1]
        ]}
        interpolation='natural'
        data={dataset[bound].data}
        style={{
          data: this.getLineStyle(dataset),
          label: { color: dataset.color }
        }}
      />
    )
  }

  getLineStyle (dataset) {
    return {
      stroke: dataset.mouseover
        ? '#000000'
        : dataset.visible
          ? dataset.color
          : 'lightGrey',
      strokeWidth: dataset.visible ? 2 : dataset.thin ? 0.5 : 0
    }
  }
}
