import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { actions as coOpsActions } from 'actions/coOps'
import LeftPane from 'components/LeftPane'
import RightPane from 'components/RightPane'

import './HomeView.scss'

class HomeView extends React.Component {
  static propTypes = {
    prefetchData: PropTypes.func.isRequired,
    selectedStationID: PropTypes.string,
    pageWidth: PropTypes.number.isRequired,
    pageHeight: PropTypes.number.isRequired
  }

  componentDidMount () {
    const { selectedStationID } = this.props

    if (selectedStationID) {
      this.props.prefetchData()
    }
  }

  componentDidUpdate (prevProps) {
    const { selectedStationID } = this.props

    if (
      selectedStationID &&
      selectedStationID !== prevProps.selectedStationID
    ) {
      this.props.prefetchData()
    }
  }

  render () {
    const rightPaneWidth = 208
    const leftPaneWidth = this.props.pageWidth - rightPaneWidth

    return (
      <div className='container-fluid'>
        <div className='split-pane'>
          <LeftPane
            {...this.props}
            width={leftPaneWidth}
            right={rightPaneWidth}
            height={this.props.pageHeight}
          />
          <RightPane
            {...this.props}
            width={rightPaneWidth}
            height={this.props.pageHeight}
          />
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  ...state.coOps
})

export default connect(
  mapStateToProps,
  coOpsActions
)(HomeView)
