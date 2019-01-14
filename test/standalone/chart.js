import React from 'react'
import ReactDOM from 'react-dom'
import 'utils/logging'
import { createStore } from 'redux'
import Chart from 'components/Chart'
import coOpsReducer from 'reducers/coOps'
import { actions as coOpsActions } from 'actions/coOps'
/* eslint camelcase: 0 */
import data_2017_9414290 from '../data/2017-9414290'
import data_2016_9075015 from '../data/2016-9075014'

const store = createStore(coOpsReducer)
store.dispatch(coOpsActions.dataFetched(2017, data_2017_9414290.data))
const store2 = createStore(coOpsReducer)
store2.dispatch(coOpsActions.dataFetched(2016, data_2016_9075015.data))

ReactDOM.render(
  <div>
    <Chart
      pxPerPoint={1}
      {...store.getState()}
      width={800}
      height={400}
      setHoverYear={() => null}
      clearHoverYear={() => null}
      hoverYear={2017}
    />
    <Chart
      pxPerPoint={1}
      {...store2.getState()}
      width={800}
      height={400}
      setHoverYear={() => null}
      clearHoverYear={() => null}
      hoverYear={2016}
    />
  </div>,
  document.getElementById('root')
)
