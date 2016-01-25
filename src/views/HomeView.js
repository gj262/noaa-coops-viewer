import React from 'react'
import CoOpsCompare from 'containers/CoOpsCompare'

export default class HomeView extends React.Component {
  render () {
    return (
      <CoOpsCompare {...this.props} />
    )
  }
}
