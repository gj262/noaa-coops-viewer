import createReducer from 'utils/createReducer'
import queryString from 'query-string'
import stations from '../data/stations'
import { LOCATION_CHANGE } from 'connected-react-router'

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

// Bounds

export const MIN = 'Minimum'
export const MAX = 'Maximum'

// Reducer

export default createReducer(
  // initial state
  {
    isFetching: false,
    years: [
      global.moment().year(),
      global
        .moment()
        .subtract(1, 'y')
        .year()
    ],
    selectedStationID: '9414290',
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
    [DATA_FETCHED]: (state, [year, data]) => {
      var [min, max] = createDailyMinMaxGraphs(data)
      var partial = detectPartial(min, year)
      data = state.data.concat({
        year: year,
        partial: partial,
        [MIN]: { data: min, min: getOverallMin(min) },
        [MAX]: { data: max, max: getOverallMax(max) }
      })
      detectBogusYears(data)
      generateHeatIndices(data)
      return Object.assign({}, state, {
        isFetching: false,
        data: data
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
      if (!location || !location.search) {
        return state
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

function createDailyMinMaxGraphs (data) {
  var minGraph = []
  var maxGraph = []
  data.forEach(datum => {
    var referenceDate = 2012 + datum.t.substr(4, 6)
    if (
      minGraph.length === 0 ||
      minGraph[minGraph.length - 1].dateStr !== referenceDate
    ) {
      let date = global.moment(referenceDate, 'YYYY-MM-DD')
      minGraph.push({
        dateObj: date,
        dateStr: referenceDate,
        x: date.toDate(),
        y: datum.v
      })
    } else if (minGraph[minGraph.length - 1].y > datum.v) {
      minGraph[minGraph.length - 1].y = datum.v
    }
    if (
      maxGraph.length === 0 ||
      maxGraph[maxGraph.length - 1].dateStr !== referenceDate
    ) {
      let date = global.moment(referenceDate, 'YYYY-MM-DD')
      maxGraph.push({
        dateObj: date,
        dateStr: referenceDate,
        x: date.toDate(),
        y: datum.v
      })
    } else if (maxGraph[maxGraph.length - 1].y < datum.v) {
      maxGraph[maxGraph.length - 1].y = datum.v
    }
  })
  return [minGraph, maxGraph]
}

function getOverallMin (data) {
  var min = null

  data.forEach(datum => {
    if (min === null || datum.y < min) {
      min = datum.y
    }
  })

  return min
}

function getOverallMax (data) {
  var max = null

  data.forEach(datum => {
    if (max === null || datum.y > max) {
      max = datum.y
    }
  })

  return max
}

function detectPartial (data, year) {
  var start = data[0].dateObj.clone().startOf('year')
  var end = start.clone().endOf('year')
  if (data[0].dateObj.format('MM-DD') !== start.format('MM-DD')) {
    console.warn(`the data for ${year} did not begin at the start of the year`)
    return true
  }
  if (data[data.length - 1].dateObj.format('MM-DD') !== end.format('MM-DD')) {
    console.warn(`the data for ${year} did not end at the end of the year`)
    return true
  }
  if (data.length < 330) {
    console.warn(`data is missing for ${year}`)
    return true
  }
  return false
}

function generateHeatIndices (data) {
  var minRange = []
  var maxRange = []
  var completeNonBogusYears = data.filter(
    dataset => !dataset.partial && !dataset.bogus
  )
  completeNonBogusYears.forEach(dataset => {
    if (minRange.length !== 2 || minRange[0] > dataset[MIN].min) {
      minRange[0] = dataset[MIN].min
    }
    if (minRange.length !== 2 || minRange[1] < dataset[MIN].min) {
      minRange[1] = dataset[MIN].min
    }
    if (maxRange.length !== 2 || maxRange[0] > dataset[MAX].max) {
      maxRange[0] = dataset[MAX].max
    }
    if (maxRange.length !== 2 || maxRange[1] < dataset[MAX].max) {
      maxRange[1] = dataset[MAX].max
    }
  })

  data.forEach(dataset => {
    delete dataset[MIN].heatIndex
    delete dataset[MAX].heatIndex
  })

  completeNonBogusYears.forEach(dataset => {
    if (minRange.length === 2 && minRange[0] !== minRange[1]) {
      dataset[MIN].heatIndex =
        (dataset[MIN].min - minRange[0]) / (minRange[1] - minRange[0])
    }
    if (maxRange.length === 2 && maxRange[0] !== maxRange[1]) {
      dataset[MAX].heatIndex =
        (dataset[MAX].max - maxRange[0]) / (maxRange[1] - maxRange[0])
    }
  })
}

const BOGUS_DEVIATION_FACTOR = 1.375

function detectBogusYears (data) {
  // There should be a standard deviation for min/max values for a
  // year. However some stations are whacked e.g. Port Chicago. If a
  // year is wildly outside of that range then mark it as bogus.
  data.forEach(dataset => {
    var completeNonBogusYears = data.filter(
      dataset => !dataset.partial && !dataset.bogus
    )
    var deviations = completeNonBogusYears.map(
      dataset => dataset[MAX].max - dataset[MIN].min
    )
    if (deviations.length >= 2) {
      var avgDeviation =
        deviations.reduce((previous, current) => previous + current) /
        deviations.length
      dataset.bogus =
        dataset[MAX].max - dataset[MIN].min >
        avgDeviation * BOGUS_DEVIATION_FACTOR
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
