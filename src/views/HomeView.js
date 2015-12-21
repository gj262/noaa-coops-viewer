import React from 'react'
import CoOpsCompare from 'containers/CoOpsCompare'

export default class HomeView extends React.Component {
  render () {
    return (
      <div className='container text-center'>
        <h1>Compare US Coastal Water Temperatures</h1>
        <CoOpsCompare {...this.props} />
      </div>
    )
  }
}
