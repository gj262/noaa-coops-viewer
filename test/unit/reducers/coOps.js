import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createStore } from 'redux'
import coOpsReducer from 'reducers/coOps'

describe('coOps reducer', () => {
  it('has initial state', () => {
    const store = createStore(coOpsReducer)
    expect(store.getState().selectedStationID).to.equal('9414290')
  })
})
