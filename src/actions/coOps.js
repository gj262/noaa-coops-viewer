import fetch from 'isomorphic-fetch'
import queryString from 'query-string'
import { push as routerActionPush } from 'connected-react-router'

import { ActionTypes as coOpsActionTypes } from 'reducers/coOps'

const fetchingData = () => ({ type: coOpsActionTypes.FETCHING_DATA })
const dataFetched = (year, data) => ({
  type: coOpsActionTypes.DATA_FETCHED,
  payload: [year, data]
})
const fetchError = (year, message) => ({
  type: coOpsActionTypes.FETCH_ERROR,
  payload: [year, message]
})
const fetchComplete = () => ({ type: coOpsActionTypes.FETCH_COMPLETE })
const setHoverYear = year => ({
  type: coOpsActionTypes.SET_HOVER_YEAR,
  payload: [year]
})
const clearHoverYear = () => ({ type: coOpsActionTypes.CLEAR_HOVER_YEAR })

const prefetchData = () => {
  var year = global.moment()
  return (dispatch, getState) => {
    prefetchFromYear(year, dispatch, getState)
  }
}

const toggleYearSelection = year => {
  return (dispatch, getState) => {
    var years = getState().coOps.years
    if (years.indexOf(year) === -1) {
      years = years.concat(year)
    } else {
      years = years.filter(keep => keep !== year)
    }
    dispatch(
      routerActionPush(
        makeLocation(getState().coOps, { years: years.join(' ') })
      )
    )
  }
}

const selectStationID = stationID => {
  return (dispatch, getState) => {
    dispatch(
      routerActionPush(makeLocation(getState().coOps, { stn: stationID }))
    )
  }
}

export const actions = {
  prefetchData,
  toggleYearSelection,
  selectStationID,
  setHoverYear,
  clearHoverYear,
  dataFetched
}

function prefetchFromYear (year, dispatch, getState) {
  if (getState().coOps.errors.length === 0) {
    dispatch(fetchingData())
    var fetchedStationID = getState().coOps.selectedStationID
    return fetchOne(year.year(), fetchedStationID, (data, error) => {
      if (getState().coOps.selectedStationID === fetchedStationID) {
        if (data) {
          dispatch(dataFetched(year.year(), data))
          prefetchFromYear(year.subtract(1, 'y'), dispatch, getState)
        } else if (error) {
          var [, message] = error.payload
          if (message.indexOf('No data was found') !== -1) {
            // year.year() + ' is the earliest'
            dispatch(fetchComplete())
          } else {
            // other kind of error
            dispatch(error)
            prefetchFromYear(year.subtract(1, 'y'), dispatch, getState)
          }
        }
      }
    })
  }
}

function fetchOne (year, station, done) {
  var begin = global.moment(year + '-01-01 00:00', 'YYYY-MM-DD HH:mm')
  var end = begin.clone().endOf('year')
  return fetch(
    `/api/datagetter?begin_date=${begin.format(
      'YYYYMMDD HH:mm'
    )}&end_date=${end.format(
      'YYYYMMDD HH:mm'
    )}&station=${station}&product=water_temperature&units=english&time_zone=lst&application=gj262@github&format=json&interval=h`
  )
    .then(response => {
      if (!response.ok || response.status >= 400) {
        return done(null, fetchError(year, 'Bad response from server.'))
      }
      return response.json()
    })
    .then(json => {
      if ('error' in json) {
        return done(null, fetchError(year, json.error.message))
      }
      done(json.data, null)
    })
    .catch(error => {
      console.log('request failed', error)
      return done(null, fetchError(year, 'Failed to fetch data'))
    })
}
function makeLocation (state, change) {
  const query = {
    stn: state.selectedStationID,
    years: state.years.join(' '),
    ...change
  }
  return { search: queryString.stringify(query) }
}
