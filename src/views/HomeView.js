import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { actions as coOpsActions } from 'reducers/coOps'
import LeftPane from 'components/LeftPane'
import RightPane from 'components/RightPane'

import './HomeView.scss'

const mapStateToProps = state => ({
  ...state.coOps
})

class HomeView extends React.Component {
  static propTypes = {
    prefetchData: PropTypes.func.isRequired,
    selectedStationID: PropTypes.string.isRequired,
    pageWidth: PropTypes.number.isRequired,
    pageHeight: PropTypes.number.isRequired
  }

  componentWillMount () {
    this.props.prefetchData()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.selectedStationID !== this.props.selectedStationID) {
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

export default connect(
  mapStateToProps,
  coOpsActions
)(HomeView)
