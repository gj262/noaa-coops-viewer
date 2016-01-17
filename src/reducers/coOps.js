import createReducer from 'utils/createReducer'
import fetch from 'isomorphic-fetch'
import Moment from 'moment'
import stations from './stations'
import { routeActions, UPDATE_LOCATION } from 'redux-simple-router'

// Dispatch Action Types

const FETCHING_DATA = 'FETCHING_DATA'
const DATA_FETCHED = 'DATA_FETCHED'
const FETCH_ERROR = 'FETCH_ERROR'

// Primitive Actions

const fetchingData = () => ({ type: FETCHING_DATA })
const dataFetched = (year, data) => ({ type: DATA_FETCHED, payload: [year, data] })
const fetchError = (year, message) => ({ type: FETCH_ERROR, payload: [year, message] })

// Exported Actions

const prefetchData = () => {
  var year = Moment()
  return (dispatch, getState) => {
    prefetchFromYear(year, dispatch, getState)
  }
}

const toggleYear = (year) => {
  return (dispatch, getState) => {
    var years = getState().coOps.years
    if (years.indexOf(year) === -1) {
      years = years.concat(year)
    }
    else {
      years = years.filter(keep => keep !== year)
    }
    dispatch(routeActions.push({ query: makeQuery(getState().coOps, { years: years.join(' ') }) }))
  }
}

const selectStationID = (stationID) => {
  return (dispatch, getState) => {
    dispatch(routeActions.push({ query: makeQuery(getState().coOps, { stn: stationID }) }))
  }
}

export const actions = {
  prefetchData,
  toggleYear,
  selectStationID
}

function prefetchFromYear(year, dispatch, getState) {
  if (getState().coOps.errors.length === 0) {
    dispatch(fetchingData())
    var fetchedStationID = getState().coOps.selectedStationID
    fetchOne(year.year(), fetchedStationID, (data, error) => {
      if (getState().coOps.selectedStationID === fetchedStationID) {
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
    done(dropAnomalousValues(dropEmptyValues(json.data)), null)
  })
}

function dropEmptyValues(data) {
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

const VARIANCE = 5.0

function dropAnomalousValues(data) {
  // Compare each datum to two neighbors and drop if the value is too
  // different.
  if (data.length < 3) {
    return data
  }
  return data.filter((datum, idx) => {
    var n1 = idx - 1;
    var n2 = idx + 1;
    if (n1 < 0) {
      n1 = n2 + 1
    }
    if (n2 >= data.length) {
      n2 = n1 - 1
    }
    if (Math.abs(datum.v - data[n1].v) > VARIANCE &&
        Math.abs(datum.v - data[n2].v) > VARIANCE) {
      console.warn(`Dropping variant datum ${datum.t} ${datum.v}`)
      return false
    }
    return true
  })
}

function makeQuery(state, change) {
  return Object.assign(
    {},
    {
      stn: state.selectedStationID,
      years: state.years.join(' ')
    },
    change
  )
}

// Bounds

export const MIN = 'Minimum'
export const MAX = 'Maximum'

// Reducer

export default createReducer(
  // initial state
  {
    isFetching: false,
    years: [Moment().year(), Moment().subtract(1, 'y').year()],
    selectedStationID: '9414290',
    data: [],
    errors: [],
    errorInstance: 0,
    stations: compileWaterTempStations(stations)
  },
  // reducers
  {
    [FETCHING_DATA]: (state) => {
      return Object.assign({}, state, { isFetching: true, errors: [] })
    },
    [DATA_FETCHED]: (state, [year, data]) => {
      var [min, max] = createDailyMinMaxGraphs(data)
      return Object.assign({}, state, {
        isFetching: false,
        data: state.data.concat(
          { year: year, bound: MIN, data: min, min: getOverallMin(min) },
          { year: year, bound: MAX, data: max, max: getOverallMax(max) }
        )
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
    [UPDATE_LOCATION]: (state, location) => {
      if (!location || !location.query) {
        return state
      }
      if (location.query.years && location.query.years !== state.years.join(' ')) {
        var years = location.query.years.split(/ /).map(year => parseInt(year, 10))
        state = Object.assign({}, state, { years: years })
      }
      if (location.query.stn && location.query.stn !== state.selectedStationID) {
        state = Object.assign({}, state, { data: [], selectedStationID: location.query.stn })
      }
      return state
    }
  }
)

function createDailyMinMaxGraphs(data) {
  var minGraph = []
  var maxGraph = []
  data.forEach(datum => {
    var referenceDate = 2012 + datum.t.substr(4, 6)
    if (minGraph.length === 0 || minGraph[minGraph.length - 1].date !== referenceDate) {
      minGraph.push({date: referenceDate, x: Moment(referenceDate, 'YYYY-MM-DD').toDate(), y: parseFloat(datum.v)})
    }
    else if (minGraph[minGraph.length - 1].y > parseFloat(datum.v)) {
      minGraph[minGraph.length - 1].y = parseFloat(datum.v)
    }
    if (maxGraph.length === 0 || maxGraph[maxGraph.length - 1].date !== referenceDate) {
      maxGraph.push({date: referenceDate, x: Moment(referenceDate, 'YYYY-MM-DD').toDate(), y: parseFloat(datum.v)})
    }
    else if (maxGraph[maxGraph.length - 1].y < parseFloat(datum.v)) {
      maxGraph[maxGraph.length - 1].y = parseFloat(datum.v)
    }
  })
  return [minGraph, maxGraph]
}

function getOverallMin(data) {
  var min = null

  data.forEach(datum => {
    if (min === null || datum.y < min) {
      min = datum.y
    }
  })

  return min
}

function getOverallMax(data) {
  var max = null

  data.forEach(datum => {
    if (max === null || datum.y > max) {
      max = datum.y
    }
  })

  return max
}

function compileWaterTempStations(stations) {
  // Convert the raw data to relevant stations with temperature data.
  // original source: http://opendap.co-ops.nos.noaa.gov/stations/stationsXML.jsp
  // passed through: http://json.online-toolz.com/tools/xml-json-convertor.php
  // saved to 'stations.js'
  var hasWaterTemp = parameter => {
    return parameter['@attributes'].name === 'Water Temp' &&
      parameter['@attributes'].status === '1'
  }
  return stations.station
    .filter(stationXML => {
      if (stationXML.parameter) {
        if (stationXML.parameter.find) {
          return !!stationXML.parameter.find(hasWaterTemp)
        }
        else {
          return hasWaterTemp(stationXML.parameter)
        }
      }
      return false
    })
    .map(stationXML => {
      return {
        ID: stationXML['@attributes'].ID,
        name: stationXML['@attributes'].name,
        state: stationXML.metadata.location.state,
        latitude: stationXML.metadata.location.lat,
        longtitude: stationXML.metadata.location['long']
      }
    })
}
