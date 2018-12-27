import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { createStore } from 'redux'
import { LOCATION_CHANGE } from 'connected-react-router'
import coOpsReducer from 'reducers/coOps'

let store

describe('coOps reducer', () => {
  beforeEach(() => {
    store = createStore(coOpsReducer)
  })

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
