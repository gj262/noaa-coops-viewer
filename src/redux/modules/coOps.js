import createReducer from 'utils/createReducer'
import fetch from 'isomorphic-fetch'
import Moment from 'moment'

// Dispatch Action Types

const FETCHING_DATA = 'FETCHING_DATA'
const DATA_FETCHED = 'DATA_FETCHED'
const FETCH_ERROR = 'FETCH_ERROR'
const TOGGLE_YEAR_SELECTION = 'TOGGLE_YEAR_SELECTION'

// Primitive Actions

const fetchingData = () => ({ type: FETCHING_DATA })
const dataFetched = (year, data) => ({ type: DATA_FETCHED, payload: [year, data] })
const fetchError = (year, message) => ({ type: FETCH_ERROR, payload: [year, message] })
const toggleYearSelection = (year) => ({ type: TOGGLE_YEAR_SELECTION, payload: year })

// Exported Actions

const toggleYear = (year) => {
  return (dispatch, getState) => {
    dispatch(toggleYearSelection(year))
    if (!getState().coOps.data.find(data => data.year === year)) {
      dispatch(fetchingData())
      fetchOne(year, getState().coOps.station, (data, error) => {
        if (data) {
          dispatch(dataFetched(year, data))
        }
        else if (error) {
          dispatch(error)
        }
      })
    }
  }
}

const prefetchData = () => {
  var year = Moment()
  return (dispatch, getState) => {
    prefetchFromYear(year, dispatch, getState)
  }
}

export const actions = {
  prefetchData,
  toggleYear
}

function prefetchFromYear(year, dispatch, getState) {
  if (getState().coOps.errors.length === 0) {
    dispatch(fetchingData())
    fetchOne(year.year(), getState().coOps.station, (data, error) => {
      if (data) {
        dispatch(dataFetched(year.year(), data))
        prefetchFromYear(year.subtract(1, 'y'), dispatch, getState)
      }
      else if (error) {
        var [, message] = error.payload
        if (message.indexOf('No data was found') !== -1) {
          // year.year() + ' is the earliest'
        }
        else {
          // other kind of error
          dispatch(error)
          prefetchFromYear(year.subtract(1, 'y'), dispatch, getState)
        }
      }
    })
  }
}

function fetchOne(year, station, done) {
  var begin = Moment(year + '-01-01 00:00', 'YYYY-MM-DD HH:mm');
  var end = begin.clone().endOf('year')
  fetch(
    `/api/datagetter?begin_date=${begin.format('YYYYMMDD HH:mm')}&end_date=${end.format('YYYYMMDD HH:mm')}&station=${station}&product=water_temperature&units=english&time_zone=lst&application=gj262@github&format=json&interval=h`
  ).then(response => {
    if (!response.ok || response.status >= 400) {
      return done(null, fetchError(year, 'Bad response from server.'))
    }
    return response.json()
  }).then(json => {
    if ('error' in json) {
      return done(null, fetchError(year, json.error.message))
    }
    done(cleanseData(json.data), null)
  })
}

function cleanseData(data) {
  data = data || []
  return data.filter(datum => {
    if ('t' in datum && 'v' in datum && datum.v) {
      // // TEST
      // if (datum.t > '2015-07-11') {
      //   return false;
      // }
      // // END TEST
      try {
        datum.v = parseFloat(datum.v)
      }
      catch (e) {
        return false
      }
      return true
    }
    return false
  })
}

// Reducer

export default createReducer(
  // initial state
  {
    isFetching: false,
    years: [Moment().year(), Moment().subtract(1, 'y').year()],
    station: '9414290',
    data: [],
    errors: [],
    errorInstance: 0
  },
  // reducers
  {
    [FETCHING_DATA]: (state) => {
      return Object.assign({}, state, { isFetching: true, errors: [] })
    },
    [DATA_FETCHED]: (state, [year, data]) => {
      var [, , avg] = createFunctionalGraphs(resample(data))
      return Object.assign({}, state, {
        isFetching: false,
        data: state.data.concat({ year: year, data: avg, ...addMinMaxAvg(avg) })
      })
    },
    [FETCH_ERROR]: (state, [year, message]) => {
      return Object.assign({}, state, {
        isFetching: false,
        errorInstance: state.errorInstance + 1,
        errors: state.errors.concat({
          instance: state.errorInstance,
          year: year,
          message: message
        }),
        years: state.years.filter(keep => keep !== year)
      })
    },
    [TOGGLE_YEAR_SELECTION]: (state, year) => {
      var years
      if (state.years.indexOf(year) === -1) {
        years = state.years.concat(year)
      }
      else {
        years = state.years.filter(keep => keep !== year)
      }
      return Object.assign({}, state, { years: years })
    }
  }
)

const bucket_reference_year = 2012  // (use a leap year to bucket to handle samples from those years)
const sample_count = 200

function resample(data) {
  var sample_date = Moment([bucket_reference_year])
  var begin_date = sample_date.clone().startOf('year')
  var end_date = sample_date.clone().endOf('year')
  var ms_in_year = end_date - begin_date;
  var ms_per_bucket = ms_in_year / sample_count;
  var resampled = [];
  var current_bucket_end_date = begin_date.add(ms_per_bucket).format('YYYY-MM-DD HH:mm')
  var bucket_idx = 0;
  data.forEach(datum => {
    var referenceDate = 2012 + datum.t.substr(4)
    while (referenceDate > current_bucket_end_date) {
      current_bucket_end_date = begin_date.add(ms_per_bucket).format('YYYY-MM-DD HH:mm')
      if (resampled.length > 0 && resampled.length > bucket_idx) {
        bucket_idx++;
      }
    }
    if (resampled.length <= bucket_idx) {
      resampled.push({
        date: Moment(referenceDate, 'YYYY-MM-DD HH:mm').toDate(),
        data: []
      })
    }
    resampled[bucket_idx].data.push(parseFloat(datum.v))
  })
  return resampled
}

function createFunctionalGraphs(resampled) {
  return [
    null,
    null,
    resampled.map(bucket => ({
      x: bucket.date,
      y: bucket.data.reduce((total, value) => total + value, 0) / bucket.data.length
    }))
  ]
}

function addMinMaxAvg(data) {
  var min = null
  var max = null
  var avg = 0

  data.forEach(datum => {
    if (min === null || datum.y < min) {
      min = datum.y
    }
    if (max === null || datum.y > max) {
      max = datum.y
    }
    avg += datum.y
  })

  avg = avg / data.length

  return {min: min, max: max, avg: avg}
}
