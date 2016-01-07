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
    linePalette: [ '#FFFF00', '#1CE6FF', '#FF34FF', '#FF4A46', '#008941', '#006FA6', '#A30059',
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
              label={dataset.visible ? `${dataset.year} ${dataset.sampleFunction}` : ''}
              data={dataset.data}
              style={{
                data: {
                  stroke: dataset.visible ? dataset.color : 'lightGrey',
                  'strokeWidth': dataset.visible ? 2 : 0.5
                },
                label: {color: dataset.color}
              }} />
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
