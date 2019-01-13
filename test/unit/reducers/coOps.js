import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { createStore } from 'redux'
import Moment from 'moment'
import { LOCATION_CHANGE } from 'connected-react-router'
import coOpsReducer, { fromCoOps } from 'reducers/coOps'
import { actions as coOpsActions } from 'actions/coOps'

/* eslint-disable no-unused-expressions */

let store
let fullYear = aFullYearOfDataReceived('2016')

describe('coOps reducer', () => {
  beforeEach(() => {
    store = createStore(coOpsReducer)
  })

  describe('station selection', () => {
    it('has no selected station initially', () => {
      expect(store.getState().selectedStationID).to.equal(null)
    })

    it('initializes to something useful from the initial router action', () => {
      store.dispatch({ type: LOCATION_CHANGE, payload: { location: {} } })
      expect(store.getState().selectedStationID).to.equal('9414290')
    })

    it('can change the station via router action', () => {
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { location: { search: '?stn=blah' } }
      })
      expect(store.getState().selectedStationID).to.equal('blah')
    })

    it('does not lose state from search=default to no search', () => {
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { location: { search: '?stn=9414290' } }
      })
      const originalState = store.getState()
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { location: {} }
      })
      expect(store.getState()).to.equal(originalState)
    })
  })

  describe('station data', () => {
    it('stores data', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([
        [{ t: '2016-01-01 00:00', v: 51.5 }]
      ])
    })

    it('drops data - no value', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([])
    })

    it('drops data - no value II', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '0.0', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([])
    })

    it('drops data - bad value', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: 'bad float', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([])
    })

    it('drops data - anomalous I', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '51.5', f: '0,0,0' },
          { t: '2016-01-01 01:00', v: '51.5', f: '0,0,0' },
          { t: '2016-01-01 02:00', v: '88.0', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([
        [{ t: '2016-01-01 00:00', v: 51.5 }, { t: '2016-01-01 01:00', v: 51.5 }]
      ])
    })

    it('drops data - anomalous II', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '51.5', f: '0,0,0' },
          { t: '2016-01-01 01:00', v: '88.5', f: '0,0,0' },
          { t: '2016-01-01 02:00', v: '88.0', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([
        [{ t: '2016-01-01 01:00', v: 88.5 }, { t: '2016-01-01 02:00', v: 88.0 }]
      ])
    })

    it('drops data - anomalous III', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '88.5', f: '0,0,0' },
          { t: '2016-01-01 01:00', v: '51.5', f: '0,0,0' },
          { t: '2016-01-01 02:00', v: '88.0', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([
        [{ t: '2016-01-01 00:00', v: 88.5 }, { t: '2016-01-01 02:00', v: 88.0 }]
      ])
    })

    it('drops data - not hourly', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:30', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([])
    })

    it('drops data - other year', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2015-01-01 00:00', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([])
    })

    it('drops data - bad date', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016 bad date 00:00', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([])
    })

    it('stores multiple data sets for non contiguous graphs - gap > 24 hours', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '51.5', f: '0,0,0' },
          { t: '2016-01-02 01:00', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').data).to.deep.equal([
        [{ t: '2016-01-01 00:00', v: 51.5 }],
        [{ t: '2016-01-02 01:00', v: 51.5 }]
      ])
    })

    it('calcs a min', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '52.5', f: '0,0,0' },
          { t: '2016-01-02 00:00', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').min).to.equal(51.5)
    })

    it('calcs a max', () => {
      store.dispatch(
        coOpsActions.dataFetched('2016', [
          { t: '2016-01-01 00:00', v: '52.5', f: '0,0,0' },
          { t: '2016-01-02 00:00', v: '51.5', f: '0,0,0' }
        ])
      )
      expect(fromCoOps.getData(store.getState(), '2016').max).to.equal(52.5)
    })

    it('spots complete data', () => {
      let thisFullYear = [...fullYear]
      store.dispatch(coOpsActions.dataFetched('2016', thisFullYear))
      expect(fromCoOps.getData(store.getState(), '2016').partial).to.be.false
    })

    it('spots partial data - gap at beginning', () => {
      let thisFullYear = [...fullYear]
      thisFullYear.shift()
      store.dispatch(coOpsActions.dataFetched('2016', thisFullYear))
      expect(fromCoOps.getData(store.getState(), '2016').partial).to.be.true
    })

    it('spots partial data - gap at end', () => {
      let thisFullYear = [...fullYear]
      thisFullYear.pop()
      store.dispatch(coOpsActions.dataFetched('2016', thisFullYear))
      expect(fromCoOps.getData(store.getState(), '2016').partial).to.be.true
    })

    it('does not split for a single drop', () => {
      let thisFullYear = [...fullYear]
      thisFullYear.splice(100, 1)
      store.dispatch(coOpsActions.dataFetched('2016', thisFullYear))
      expect(fromCoOps.getData(store.getState(), '2016').partial).to.be.false
    })

    it('does not split for <= 24 hour drop', () => {
      let thisFullYear = [...fullYear]
      thisFullYear.splice(100, 23)
      store.dispatch(coOpsActions.dataFetched('2016', thisFullYear))
      expect(fromCoOps.getData(store.getState(), '2016').partial).to.be.false
    })

    it('spots partial data - splits when > 24 hour drop', () => {
      let thisFullYear = [...fullYear]
      thisFullYear.splice(100, 24)
      store.dispatch(coOpsActions.dataFetched('2016', thisFullYear))
      expect(fromCoOps.getData(store.getState(), '2016').partial).to.be.true
    })
  })
})

function aFullYearOfDataReceived (year) {
  var begin = Moment(year + '-01-01 00:00', 'YYYY-MM-DD HH:mm')
  var end = begin.clone().endOf('year')
  const data = []
  for (var date = begin; date.isSameOrBefore(end); date = date.add(1, 'hour')) {
    data.push({ v: '51.0', t: date.format('YYYY-MM-DD HH:mm'), f: '0,0,0' })
  }
  return data
}
