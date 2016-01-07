import React from 'react'
import { VictoryAxis, VictoryChart } from 'victory'
import { StaticVictoryLine } from 'components/StaticVictory'
import d3_time_format from 'd3-time-format'
import d3_scale from 'd3-scale'
import { connect } from 'react-redux'
import { actions as coOpsActions, MIN, AVG, MAX } from 'redux/modules/coOps'
import Moment from 'moment'
import YearSelector from 'components/YearSelector'
import SampleFunctionSelector from 'components/SampleFunctionSelector'

const mapStateToProps = (state) => ({
  isFetching: state.coOps.isFetching,
  data: state.coOps.data,
  years: state.coOps.years,
  sampleFunctions: state.coOps.sampleFunctions,
  errors: state.coOps.errors
})

class CoOpsCompare extends React.Component {
  static propTypes = {
    store: React.PropTypes.object,
    linePalette: React.PropTypes.array,
    prefetchData: React.PropTypes.func,
    toggleYear: React.PropTypes.func,
    toggleSampleFunction: React.PropTypes.func,
    isFetching: React.PropTypes.bool,
    data: React.PropTypes.array,
    years: React.PropTypes.array,
    sampleFunctions: React.PropTypes.array,
    errors: React.PropTypes.array
  }

  static defaultProps = {
    linePalette: [ '#984447', '#add9f4', '#476c9b', '#468c98', '#101419' ]
  }

  constructor() {
    super()
    this.state = {
      chartData: [],
      availableYears: []
    }
  }

  componentWillMount() {
    this.props.prefetchData()
  }

  componentWillReceiveProps(nextProps) {
    // Map to display data as new data is received.
    var chartData = nextProps.data.map(dataset => {
      var chartDataset = !this.state.chartData
          ? null
          : this.state.chartData.find(
            chartDataset =>
              chartDataset.year === dataset.year &&
              chartDataset.sampleFunction === dataset.sampleFunction
          );
      if (!chartDataset) {
        chartDataset = Object.assign({}, dataset);
        chartDataset.color = this.props.linePalette[dataset.year % this.props.linePalette.length];
        chartDataset.visible = nextProps.years.indexOf(dataset.year) !== -1 &&
          nextProps.sampleFunctions.indexOf(dataset.sampleFunction) !== -1;
      }
      else {
        chartDataset.visible = nextProps.years.indexOf(dataset.year) !== -1 &&
          nextProps.sampleFunctions.indexOf(dataset.sampleFunction) !== -1;
      }
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

    this.setState({
      chartData: chartData,
      availableYears: availableYears
    })
  }

  render () {
    return (
      <div>
        {this.props.errors.map(
          error =>
            (
              <div key={error.instance} className='alert alert-warning' role='alert'>
                Could not load data for {error.year}. {error.message}
              </div>
            )
        )}
        {this.state.chartData ? (
        <VictoryChart
          width={1024}
          height={500}
          padding={{ top: 50, bottom: 50, left: 50, right: 150 }}
          scale={{
            x: d3_scale.time(),
            y: d3_scale.linear()
          }}>
          <VictoryAxis
            dependentAxis
            tickValues={[47.5, 50, 55, 60, 65, 70]}
            style={{
              grid: {strokeWidth: 1}
            }} />
          <VictoryAxis
            style={{
              grid: {strokeWidth: 1}
            }}
            tickValues={this.makeTicks()}
            tickFormat={d3_time_format.format('%B')}/>
          {this.state.chartData.map(dataset => (
            <StaticVictoryLine
              key={dataset.year + dataset.sampleFunction}
              visible={dataset.visible}
              interpolation='cardinal'
              animate={{velocity: 0.02}}
              label={dataset.visible ? `${dataset.year} ${dataset.sampleFunction}` : ''}
              data={dataset.data}
              style={{data: {stroke: dataset.color, 'strokeWidth': dataset.visible ? 2 : 0}, label: {color: dataset.color}}} />
            ))}
        </VictoryChart>
        ) : null}
        <SampleFunctionSelector
           selection={this.props.sampleFunctions}
           sampleFunctions={[MIN, AVG, MAX]}
           toggleSampleFunction={this.props.toggleSampleFunction} />
        <YearSelector
           selection={this.props.years}
           years={this.state.availableYears}
           toggleYear={this.props.toggleYear} />
      </div>
    );
  }

  makeTicks() {
    var months = [];
    var start = Moment([2012])
    for (var i = 0; i < 12; i++) {
      months.push(start.clone().toDate())
      start.add(1, 'month')
    }
    return months;
  }
}

export default connect(mapStateToProps, coOpsActions)(CoOpsCompare)
