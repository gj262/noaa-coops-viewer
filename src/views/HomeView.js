import React from 'react'
import CoOpsCompare from 'containers/CoOpsCompare'

export default class HomeView extends React.Component {
  render () {
    return (
      <div className='container'>
        <CoOpsCompare {...this.props} />
      </div>
    )
  }
}
