import React from 'react'
import { VictoryAxis, VictoryChart } from 'victory'
import { StaticVictoryLine } from 'components/StaticVictory'
import d3_time_format from 'd3-time-format'
import d3_scale from 'd3-scale'
import { connect } from 'react-redux'
import { actions as coOpsActions } from 'redux/modules/coOps'
import Moment from 'moment'
import YearSelector from 'components/YearSelector'

const mapStateToProps = (state) => ({
  isFetching: state.coOps.isFetching,
  data: state.coOps.data,
  years: state.coOps.years,
  errors: state.coOps.errors
})

class CoOpsCompare extends React.Component {
  static propTypes = {
    sampleCount: React.PropTypes.number,
    linePalette: React.PropTypes.array,
    prefetchData: React.PropTypes.func,
    toggleYear: React.PropTypes.func,
    isFetching: React.PropTypes.bool,
    data: React.PropTypes.array,
    years: React.PropTypes.array,
    errors: React.PropTypes.array
  }

  static defaultProps = {
    sampleCount: 200,
    linePalette: [ '#984447', '#add9f4', '#476c9b', '#468c98', '#101419' ]
  }

  constructor() {
    super()
    this.state = {
      chartData: [],
      referenceYear: 2012
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
        : this.state.chartData.find(chartDataset => chartDataset.year === dataset.year);
      if (!chartDataset) {
        chartDataset = this.resampleAndMapToSameScale(dataset);
        chartDataset.color = this.props.linePalette[dataset.year % this.props.linePalette.length];
        chartDataset.visible = nextProps.years.indexOf(dataset.year) !== -1;
      }
      else {
        chartDataset.visible = nextProps.years.indexOf(dataset.year) !== -1;
      }
      return chartDataset
    })
    this.setState({
      chartData: chartData
    })
  }

  resampleAndMapToSameScale(dataset) {
    dataset = Object.assign({}, dataset);
    var sample_date = Moment([this.state.referenceYear])
    var begin_date = sample_date.clone().startOf('year')
    var end_date = sample_date.clone().endOf('year')
    var ms_in_year = end_date - begin_date;
    var ms_per_bucket = ms_in_year / this.props.sampleCount;
    var resampled = [];
    var current_bucket_end_date = begin_date.add(ms_per_bucket).format('YYYY-MM-DD HH:mm')
    var bucket_idx = 0;
    dataset.data.forEach(datum => {
      var referenceDate = this.state.referenceYear + datum.t.substr(4)
      while (referenceDate > current_bucket_end_date) {
        current_bucket_end_date = begin_date.add(ms_per_bucket).format('YYYY-MM-DD HH:mm')
        if (resampled.length > 0 && resampled.length > bucket_idx) {
          bucket_idx++;
        }
      }
      if (resampled.length <= bucket_idx) {
        resampled.push({ t: datum.t, x: referenceDate, data: [] })
      }
      resampled[bucket_idx].data.push(parseFloat(datum.v))
    })
    dataset.data = resampled.map((bucket, idx) => {
      return {
        t: bucket.t,
        x: Moment(bucket.x, 'YYYY-MM-DD HH:mm').toDate(),
        y: bucket.data.reduce((total, value) => total + value, 0) / bucket.data.length
      }
    });

    return dataset
  }

  render () {
    var orderedYears = this.props.data.sort((a, b) => b.year - a.year).map(data => data.year);
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
            tickValues={[47.5, 50, 55, 60, 65, 67.5]}
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
              key={dataset.year}
              visible={dataset.visible}
              interpolation='cardinal'
              animate={{velocity: 0.02}}
              label={dataset.visible ? `${dataset.year} [${dataset.min}/${dataset.avg.toFixed(2)}/${dataset.max}]` : ''}
              data={dataset.data}
              style={{data: {stroke: dataset.color, 'strokeWidth': dataset.visible ? 2 : 0}, label: {color: dataset.color}}} />
            ))}
        </VictoryChart>
        ) : null}
        <YearSelector selection={this.props.years} years={orderedYears} toggleYear={this.props.toggleYear} />
      </div>
    );
  }

  makeTicks() {
    var months = [];
    var start = Moment([this.state.referenceYear])
    for (var i = 0; i < 12; i++) {
      months.push(start.clone().toDate())
      start.add(1, 'month')
    }
    return months;
  }
}

export default connect(mapStateToProps, coOpsActions)(CoOpsCompare)
