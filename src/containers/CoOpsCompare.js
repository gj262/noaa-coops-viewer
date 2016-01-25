import React from 'react'
import { VictoryAxis, VictoryChart } from 'victory'
import { StaticVictoryLine } from 'components/StaticVictory'
import d3_time_format from 'd3-time-format'
import d3_scale from 'd3-scale'
import { connect } from 'react-redux'
import { actions as coOpsActions, MIN, MAX } from 'reducers/coOps'
import Moment from 'moment'
import YearSelector from 'components/YearSelector'
import StationSelector from 'components/StationSelector'

import './CoOpsCompare.scss'

const mapStateToProps = (state) => ({
  isFetching: state.coOps.isFetching,
  data: state.coOps.data,
  years: state.coOps.years,
  errors: state.coOps.errors,
  selectedStationID: state.coOps.selectedStationID,
  stations: state.coOps.stations
})

class CoOpsCompare extends React.Component {
  static propTypes = {
    store: React.PropTypes.object,
    linePalette: React.PropTypes.array,
    prefetchData: React.PropTypes.func,
    toggleYear: React.PropTypes.func,
    isFetching: React.PropTypes.bool,
    data: React.PropTypes.array,
    years: React.PropTypes.array,
    errors: React.PropTypes.array,
    stations: React.PropTypes.array.isRequired,
    selectedStationID: React.PropTypes.string.isRequired,
    selectStationID: React.PropTypes.func.isRequired,
    pageWidth: React.PropTypes.number.isRequired,
    pageHeight: React.PropTypes.number.isRequired
  };

  static defaultProps = {
    linePalette: [ '#1CE6FF', '#FF34FF', '#FF4A46', '#008941', '#006FA6', '#A30059',
                   '#FFDBE5', '#7A4900', '#0000A6', '#63FFAC', '#B79762', '#004D43', '#8FB0FF', '#997D87',
                   '#5A0007', '#809693', '#FEFFE6', '#1B4400', '#4FC601', '#3B5DFF', '#4A3B53', '#FF2F80',
                   '#61615A', '#BA0900', '#6B7900', '#00C2A0', '#FFAA92', '#FF90C9', '#B903AA', '#D16100',
                   '#DDEFFF', '#000035', '#7B4F4B', '#A1C299', '#300018', '#0AA6D8', '#013349', '#00846F',
                   '#372101', '#FFB500', '#C2FFED', '#A079BF', '#CC0744', '#C0B9B2', '#C2FF99', '#001E09',
                   '#00489C', '#6F0062', '#0CBD66', '#EEC3FF', '#456D75', '#B77B68', '#7A87A1', '#788D66',
                   '#885578', '#FAD09F', '#FF8A9A', '#D157A0', '#BEC459', '#456648', '#0086ED', '#886F4C',
                   '#34362D', '#B4A8BD', '#00A6AA', '#452C2C', '#636375', '#A3C8C9', '#FF913F', '#938A81',
                   '#575329', '#00FECF', '#B05B6F', '#8CD0FF', '#3B9700', '#04F757', '#C8A1A1', '#1E6E00',
                   '#7900D7', '#A77500', '#6367A9', '#A05837', '#6B002C', '#772600', '#D790FF', '#9B9700',
                   '#549E79', '#FFF69F', '#201625', '#72418F', '#BC23FF', '#99ADC0', '#3A2465', '#922329',
                   '#5B4534', '#FDE8DC', '#404E55', '#0089A3', '#CB7E98', '#A4E804', '#324E72', '#6A3A4C' ]
  };

  constructor() {
    super()
    this.state = {
      chartData: [],
      availableYears: [],
      xTicks: this.makeXTicks(),
      yTicks: []
    }
  }

  makeXTicks() {
    var months = [];
    var start = Moment([2012])
    for (var i = 0; i < 12; i++) {
      months.push(start.clone().toDate())
      start.add(1, 'month')
    }
    return months;
  }

  componentWillMount() {
    this.props.prefetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedStationID !== this.props.selectedStationID) {
      this.props.prefetchData()
    }

    // Map to display data as new data is received.
    var chartData = nextProps.data.map(dataset => {
      var chartDataset = !this.state.chartData
          ? null
          : this.state.chartData.find(
            chartDataset =>
              chartDataset.year === dataset.year &&
              chartDataset.bound === dataset.bound
          );
      if (!chartDataset) {
        chartDataset = Object.assign({}, dataset)
        chartDataset.color = this.props.linePalette[dataset.year % this.props.linePalette.length]
      }
      chartDataset.visible = nextProps.years.indexOf(dataset.year) !== -1
      chartDataset.thin = !chartDataset.visible
      return chartDataset
    })

    var availableYears = this.state.availableYears
    nextProps.data.forEach(dataset => {
      if (availableYears.indexOf(dataset.year) === -1) {
        availableYears = availableYears
          .concat(dataset.year)
          .sort((a, b) => b - a)
      }
    });

    var yTicks = this.makeYTicks(nextProps.data)

    this.setState({
      chartData,
      availableYears,
      yTicks
    })
  }

  makeYTicks(data) {
    if (!data || data.length === 0) {
      return []
    }
    var min;
    var max;
    data.forEach(dataset => {
      if (dataset.bound === MIN && (!min || dataset.min < min)) {
        min = dataset.min
      }
      if (dataset.bound === MAX && (!max || dataset.max > max)) {
        max = dataset.max
      }
    })
    var ticks = [];
    for (var tick = Math.floor((min - 1) / 5) * 5; tick < max + 1; tick += 5) {
      ticks.push(tick)
    }
    ticks.push(tick)
    return ticks
  }

  render () {
    var chartWidth = this.props.pageWidth - 248;
    if (chartWidth < 600) {
      chartWidth = 600;
    }
    var chartAspectRatio = this.props.pageHeight / this.props.pageWidth;
    chartAspectRatio = chartAspectRatio >= 1 ? 0.666 : (chartAspectRatio <= 0.5 ? 0.333 : 0.5)
    return (
      <div className='container-fluid'>
        <div className='split-pane'>
          <div className='left-pane text-center'>
            <h1>NOAA CO-OPs Water Temperatures</h1>
            <StationSelector
              selectedStationID={this.props.selectedStationID}
              stations={this.props.stations}
              selectStationID={this.props.selectStationID} />
            {this.renderErrors()}
            {this.renderChart(chartWidth, chartWidth * chartAspectRatio)}
            {this.renderFooter()}
          </div>
          <div className='right-pane'>
            <YearSelector
               data={this.state.chartData}
               selection={this.props.years}
               toggleYear={this.props.toggleYear} />
          </div>
        </div>
      </div>
    );
  }

  renderErrors() {
    return this.props.errors.map(
      error => (
        <div key={error.instance} className='alert alert-warning' role='alert'>
          Could not load data for {error.year}. {error.message}
        </div>
      )
    )
  }

  renderChart(width, height) {
    if (!this.state.chartData || this.state.chartData.length === 0) {
      return null
    }
    return (
      <VictoryChart
        key={`${width} ${height}`}
        width={width}
        height={height}
        scale={{
          x: d3_scale.time(),
          y: d3_scale.linear()
        }}>
        {this.renderYAxis()}
        {this.renderXAxis()}
        {this.state.chartData.map(dataset => this.renderLine(dataset))}
      </VictoryChart>
    )
  }

  renderYAxis() {
    return (
      <VictoryAxis
        dependentAxis
        tickValues={this.state.yTicks}
        style={{
          grid: {strokeWidth: 1}
        }} />
    )
  }

  renderXAxis() {
    return (
      <VictoryAxis
        style={{
          grid: {strokeWidth: 1}
        }}
        tickValues={this.state.xTicks}
        tickFormat={d3_time_format.format('%B')}/>
    )
  }

  renderLine(dataset) {
    var instanceKey = this.state.selectedStationID +
        dataset.year +
        dataset.bound +
        this.state.yTicks[0] +
        this.state.yTicks[this.state.yTicks.length - 1]
    return (
       <StaticVictoryLine
         key={instanceKey}
         visible={dataset.visible}
         thin={dataset.thin}
         range={[this.state.yTicks[0], this.state.yTicks[this.state.yTicks.length - 1]]}
         interpolation='natural'
         label={dataset.visible && dataset.bound === MIN ? `${dataset.year}` : ''}
         data={dataset.data}
         style={{
           data: {
             stroke: dataset.visible ? dataset.color : 'lightGrey',
             'strokeWidth': dataset.visible ? 2 : dataset.thin ? 0.5 : 0
           },
           label: {color: dataset.color}
         }} />
    )
  }

  renderFooter() {
    return (
      <footer className='footer'>
      An alternate yearly view of water temperature data provided by NOAA CO-OPs. More details at: <a href='https://github.com/gj262/noaa-coops-viewer#noaa-co-ops-water-temperature-viewer'>noaa-coops-viewer</a>
      </footer>
    )
  }
}

export default connect(mapStateToProps, coOpsActions)(CoOpsCompare)
