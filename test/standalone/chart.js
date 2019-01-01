import React from 'react'
import ReactDOM from 'react-dom'
import 'utils/logging'
import { createStore } from 'redux'
import Chart from 'components/Chart'
import coOpsReducer from 'reducers/coOps'
import { actions as coOpsActions } from 'actions/coOps'
import data from '../data/2016-9075014'

const store = createStore(coOpsReducer)
store.dispatch(coOpsActions.dataFetched('2016', data.data))

ReactDOM.render(
  <Chart
    {...store.getState()}
    width={800}
    height={400}
    setHoverYear={() => null}
    clearHoverYear={() => null}
    hoverYear={2016}
  />,
  document.getElementById('root')
)
