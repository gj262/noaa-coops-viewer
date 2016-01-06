import createReducer from 'utils/createReducer'
import fetch from 'isomorphic-fetch'
import Moment from 'moment'

// const debug = window.debug('redux:reducer:co_ops')

const FETCHING_DATA = 'FETCHING_DATA'
const DATA_FETCHED = 'DATA_FETCHED'
const FETCH_ERROR = 'FETCH_ERROR'
const TOGGLE_YEAR_SELECTION = 'TOGGLE_YEAR_SELECTION'

// Actions Creators

const fetchingData = () => ({ type: FETCHING_DATA })
const dataFetched = (year, data) => ({ type: DATA_FETCHED, payload: [year, data] })
const fetchError = (year, message) => ({ type: FETCH_ERROR, payload: [year, message] })
const toggleYearSelection = (year) => ({ type: TOGGLE_YEAR_SELECTION, payload: year })
export const toggleYear = (year) => {
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

export const actions = {
  prefetchData,
  toggleYear
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
      return Object.assign({}, state, { isFetching: false, data: state.data.concat({ year: year, data: data }) })
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
