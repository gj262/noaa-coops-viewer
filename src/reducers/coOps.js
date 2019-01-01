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

// Bounds

export const MIN = 'Minimum'
export const MAX = 'Maximum'

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
      let splitData = splitContiguousData(dataForYear)
      splitData = splitData.map(data => dropAnomalousValues(data))
      const dataset = state.data.concat({
        year,
        data: splitData,
        min: getOverallMin(splitData),
        max: getOverallMax(splitData)
      })
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
  return data
    .filter(datum => {
      if ('t' in datum && 'v' in datum && datum.v) {
        if (!/[012]\d:00$/.test(datum.t)) {
          return false
        }
        if (datum.t.substr(0, 4) !== year) {
          return false
        }
        if (!global.moment(datum.t, 'YYYY-MM-DD HH:mm', true).isValid()) {
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
      return { v: datum.v, t: datum.t }
    })
}

function splitContiguousData (data) {
  // Data should be contiguous and separated in hourly intervals.
  const splits = []
  let i = 0

  do {
    const chunk = []
    if (i < data.length) {
      chunk.push(data[i])
    }
    i++
    while (
      i < data.length &&
      global
        .moment(data[i - 1].t)
        .add(1, 'hour')
        .isSame(data[i].t)
    ) {
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

// function detectPartial (data, year) {
//   if (!data || data.length === 0) {
//     return true
//   }
//   var start = data[0].dateObj.clone().startOf('year')
//   var end = start.clone().endOf('year')
//   if (data[0].dateObj.format('MM-DD') !== start.format('MM-DD')) {
//     debug(`the data for ${year} did not begin at the start of the year`)
//     return true
//   }
//   if (data[data.length - 1].dateObj.format('MM-DD') !== end.format('MM-DD')) {
//     debug(`the data for ${year} did not end at the end of the year`)
//     return true
//   }
//   if (data.length < 330) {
//     debug(`data is missing for ${year}`)
//     return true
//   }
//   return false
// }

// function generateHeatIndices (data) {
//   var minRange = []
//   var maxRange = []
//   var completeNonBogusYears = data.filter(
//     dataset => !dataset.partial && !dataset.bogus
//   )
//   completeNonBogusYears.forEach(dataset => {
//     if (minRange.length !== 2 || minRange[0] > dataset[MIN].min) {
//       minRange[0] = dataset[MIN].min
//     }
//     if (minRange.length !== 2 || minRange[1] < dataset[MIN].min) {
//       minRange[1] = dataset[MIN].min
//     }
//     if (maxRange.length !== 2 || maxRange[0] > dataset[MAX].max) {
//       maxRange[0] = dataset[MAX].max
//     }
//     if (maxRange.length !== 2 || maxRange[1] < dataset[MAX].max) {
//       maxRange[1] = dataset[MAX].max
//     }
//   })

//   data.forEach(dataset => {
//     delete dataset[MIN].heatIndex
//     delete dataset[MAX].heatIndex
//   })

//   completeNonBogusYears.forEach(dataset => {
//     if (minRange.length === 2 && minRange[0] !== minRange[1]) {
//       dataset[MIN].heatIndex =
//         (dataset[MIN].min - minRange[0]) / (minRange[1] - minRange[0])
//     }
//     if (maxRange.length === 2 && maxRange[0] !== maxRange[1]) {
//       dataset[MAX].heatIndex =
//         (dataset[MAX].max - maxRange[0]) / (maxRange[1] - maxRange[0])
//     }
//   })
// }

// const BOGUS_DEVIATION_FACTOR = 1.375

// function detectBogusYears (data) {
//   // There should be a standard deviation for min/max values for a
//   // year. However some stations are whacked e.g. Port Chicago. If a
//   // year is wildly outside of that range then mark it as bogus.
//   data.forEach(dataset => {
//     var completeNonBogusYears = data.filter(
//       dataset => !dataset.partial && !dataset.bogus
//     )
//     var deviations = completeNonBogusYears.map(
//       dataset => dataset[MAX].max - dataset[MIN].min
//     )
//     if (deviations.length >= 2) {
//       var avgDeviation =
//         deviations.reduce((previous, current) => previous + current) /
//         deviations.length
//       dataset.bogus =
//         dataset[MAX].max - dataset[MIN].min >
//         avgDeviation * BOGUS_DEVIATION_FACTOR
//     }
//   })
// }

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
