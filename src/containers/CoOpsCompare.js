import React from 'react'
import { VictoryAxis, VictoryChart, VictoryLine } from 'victory'
import d3 from 'd3'
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
      referenceYear: 2012
    }
  }

  componentWillMount() {
    this.props.prefetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data === nextProps.data && this.props.years === nextProps.years) {
      return
    }
    var datasets = nextProps.data
        .map((dataset, idx) => {
          dataset = this.resampleAndMapToSameScale(dataset);
          dataset.color = this.props.linePalette[idx % this.props.linePalette.length];
          dataset.visible = nextProps.years.indexOf(dataset.year) !== -1;
          return dataset;
        })
    this.setState({
      chartData: datasets
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
          scale={{
            x: d3.time.scale(),
            y: d3.scale.linear()
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
            tickFormat={d3.time.format('%B')}/>
          {this.state.chartData.map(dataset => (
            <VictoryLine
              key={dataset.year}
              interpolation='cardinal'
              animate={{velocity: 0.02}}
              label={dataset.visible ? dataset.year : ''}
              data={dataset.data}
              style={{data: {stroke: dataset.color, 'stroke-width': dataset.visible ? 2 : 0}, label: {color: dataset.color}}} />
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
