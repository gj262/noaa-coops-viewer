import createReducer from 'utils/createReducer'
import queryString from 'query-string'
import deepEqual from 'deep-equal'
import stations from '../data/stations'
import { LOCATION_CHANGE } from 'connected-react-router'
const debug = window.debug('reducers/coOps')

// Dispatch Action Types

const FETCHING_DATA = 'FETCHING_DATA'
const DATA_FETCHED = 'DATA_FETCHED'
const FETCH_ERROR = 'FETCH_ERROR'
const FETCH_COMPLETE = 'FETCH_COMPLETE'
const SET_HOVER_YEAR = 'SET_HOVER_YEAR'
const CLEAR_HOVER_YEAR = 'CLEAR_HOVER_YEAR'

export const ActionTypes = {
  FETCHING_DATA,
  DATA_FETCHED,
  FETCH_ERROR,
  FETCH_COMPLETE,
  SET_HOVER_YEAR,
  CLEAR_HOVER_YEAR
}

// Defaults

const defaultStationID = '9414290'
const defaultYears = [
  global.moment().year(),
  global
    .moment()
    .subtract(1, 'y')
    .year()
]
function isDefaultSelection (state) {
  return (
    state.selectedStationID === defaultStationID &&
    deepEqual(state.years, defaultYears)
  )
}

// Reducer

export default createReducer(
  // initial state
  {
    isFetching: false,
    years: defaultYears,
    selectedStationID: null,
    data: [],
    errors: [],
    errorInstance: 0,
    stations: compileWaterTempStations(stations),
    hoverYear: null
  },
  // action handlers
  {
    [FETCHING_DATA]: state => {
      return Object.assign({}, state, { isFetching: true, errors: [] })
    },
    [DATA_FETCHED]: (state, [year, dataForYear]) => {
      dataForYear = parseValues(dataForYear, year)
      let splitData = splitTheData(dataForYear)
      splitData = splitData.map(data => dropAnomalousValues(data))
      splitData.forEach(data => {
        data.forEach(datum => delete datum.tAsDate)
      })
      const dataset = state.data.concat({
        year,
        data: splitData,
        min: getOverallMin(splitData),
        max: getOverallMax(splitData),
        partial: detectPartial(splitData, year)
      })
      generateHeatIndices(dataset)
      return Object.assign({}, state, {
        isFetching: false,
        data: dataset
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
    [FETCH_COMPLETE]: state => {
      return Object.assign({}, state, { isFetching: false })
    },
    [LOCATION_CHANGE]: (state, { location }) => {
      if (!location) {
        return state
      }
      if (!location.search) {
        if (isDefaultSelection(state)) {
          return state
        }
        return {
          ...state,
          selectedStationID: defaultStationID,
          data: state.selectedStationID === defaultStationID ? state.data : [],
          years: defaultYears
        }
      }
      const query = queryString.parse(location.search)
      if (query.years && query.years !== state.years.join(' ')) {
        var years = query.years.split(/ /).map(year => parseInt(year, 10))
        state = Object.assign({}, state, { years: years })
      }
      if (query.stn && query.stn !== state.selectedStationID) {
        state = Object.assign({}, state, {
          data: [],
          selectedStationID: query.stn
        })
      }
      return state
    },
    [SET_HOVER_YEAR]: (state, [year]) => {
      return Object.assign({}, state, {
        hoverYear: year
      })
    },
    [CLEAR_HOVER_YEAR]: state => {
      return Object.assign({}, state, {
        hoverYear: null
      })
    }
  }
)

function parseValues (data, year) {
  data = data || []

  const hourRe = /[012]\d:00$/
  const dateRe = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d$/

  return data
    .filter(datum => {
      if ('t' in datum && 'v' in datum && datum.v) {
        if (!hourRe.test(datum.t)) {
          return false
        }
        if (datum.t.substr(0, 4) !== year + '') {
          return false
        }
        if (!dateRe.test(datum.t)) {
          return false
        }
        try {
          datum.v = parseFloat(datum.v)
        } catch (e) {
          return false
        }
        if (datum.v && datum.v !== 0.0) {
          return true
        }
      }
      return false
    })
    .map(datum => {
      return { v: datum.v, t: datum.t, tAsDate: new Date(datum.t) }
    })
}

function splitTheData (data) {
  // Split data if samples are > 24 hours apart. Data should be contiguous and
  // separated in hourly intervals. However stations often drop a few samples
  // and DST also causes a gap that we do not want to split on.
  const splits = []
  let i = 0

  const isCloseToPreviousSample = idx => {
    const prevPlus24 = data[idx - 1].tAsDate.getTime() + 24 * 60 * 60 * 1000
    const isCloseToPreviousSample = prevPlus24 >= data[idx].tAsDate.getTime()
    if (!isCloseToPreviousSample) {
      const diff = global.moment.duration(
        global.moment(data[idx].t).diff(global.moment(data[idx - 1].t))
      )
      debug(
        `Gap detected: ${data[idx - 1].t} -> ${data[idx].t} - ${diff.as(
          'hours'
        )}`
      )
    }
    return isCloseToPreviousSample
  }

  do {
    const chunk = []
    if (i < data.length) {
      chunk.push(data[i])
    }
    i++
    while (i < data.length && isCloseToPreviousSample(i)) {
      chunk.push(data[i])
      i++
    }
    if (chunk.length > 0) {
      splits.push(chunk)
    }
  } while (i < data.length)

  return splits
}

const VARIANCE = 5.0

function dropAnomalousValues (data) {
  // Compare each datum to two neighbors and drop if the value is too
  // different.
  if (data.length < 3) {
    return data
  }
  return data.filter((datum, idx) => {
    var n1 = idx - 1
    var n2 = idx + 1
    if (n1 < 0) {
      n1 = n2 + 1
    }
    if (n2 >= data.length) {
      n2 = n1 - 1
    }
    if (
      Math.abs(datum.v - data[n1].v) > VARIANCE &&
      Math.abs(datum.v - data[n2].v) > VARIANCE
    ) {
      debug(`Dropping variant datum ${datum.t} ${datum.v}`)
      return false
    }
    return true
  })
}

function getOverallMin (data) {
  var min = null

  data.forEach(chunk => {
    chunk.forEach(datum => {
      if (min === null || datum.v < min) {
        min = datum.v
      }
    })
  })

  return min
}

function getOverallMax (data) {
  var max = null

  data.forEach(chunk => {
    chunk.forEach(datum => {
      if (max === null || datum.v > max) {
        max = datum.v
      }
    })
  })

  return max
}

function detectPartial (data, year) {
  if (!data || data.length !== 1 || data[0].length === 0) {
    debug(
      `Partial data detected for ${year}: ${
        !data
          ? 'no data'
          : data.length !== 1
            ? 'split data'
            : data[0].length === 0
              ? 'no data'
              : '?'
      }`
    )
    return true
  }
  const first = global.moment(data[0][0].t)
  var start = first.clone().startOf('year')
  var end = first
    .clone()
    .endOf('year')
    .subtract(1, 'hour')
  const last = global.moment(data[0][data[0].length - 1].t)
  if (!start.isSame(first)) {
    debug(`the data for ${year} did not begin at the start of the year`)
    return true
  }
  if (!end.isBefore(last)) {
    debug(`the data for ${year} did not end at the end of the year`)
    return true
  }
  return false
}

function generateHeatIndices (data) {
  var minRange = []
  var maxRange = []
  var completeYears = data.filter(yearData => !yearData.partial)
  completeYears.forEach(yearData => {
    if (minRange.length !== 2 || minRange[0] > yearData.min) {
      minRange[0] = yearData.min
    }
    if (minRange.length !== 2 || minRange[1] < yearData.min) {
      minRange[1] = yearData.min
    }
    if (maxRange.length !== 2 || maxRange[0] > yearData.max) {
      maxRange[0] = yearData.max
    }
    if (maxRange.length !== 2 || maxRange[1] < yearData.max) {
      maxRange[1] = yearData.max
    }
  })

  data.forEach(yearData => {
    delete yearData.minHeatIndex
    delete yearData.maxHeatIndex
  })

  completeYears.forEach(yearData => {
    if (minRange.length === 2 && minRange[0] !== minRange[1]) {
      yearData.minHeatIndex =
        (yearData.min - minRange[0]) / (minRange[1] - minRange[0])
    }
    if (maxRange.length === 2 && maxRange[0] !== maxRange[1]) {
      yearData.maxHeatIndex =
        (yearData.max - maxRange[0]) / (maxRange[1] - maxRange[0])
    }
  })
}

function compileWaterTempStations (stations) {
  // Convert the raw data to relevant stations with temperature data.
  // original source: http://opendap.co-ops.nos.noaa.gov/stations/stationsXML.jsp
  // passed through: http://json.online-toolz.com/tools/xml-json-convertor.php
  // saved to 'stations.js'
  var hasWaterTemp = parameter => {
    return (
      parameter['@attributes'].name === 'Water Temp' &&
      parameter['@attributes'].status === '1'
    )
  }
  return stations.station
    .filter(stationXML => {
      if (stationXML.parameter) {
        if (stationXML.parameter.find) {
          return !!stationXML.parameter.find(hasWaterTemp)
        } else {
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

export const fromCoOps = {
  getData: (state, year) => {
    return state.data.find(yearData => yearData.year === year)
  }
}
