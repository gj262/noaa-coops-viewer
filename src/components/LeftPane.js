import React from 'react'
import StationSelector from 'components/StationSelector'
import Chart from 'components/Chart'

import './LeftPane.scss'

export default class LeftPane extends React.Component {
  static propTypes = {
    errors: React.PropTypes.array.isRequired,
    right: React.PropTypes.number.isRequired
  };

  render () {
    return (
      <div className='left-pane text-center' style={{right: `${this.props.right}px`}}>
        <h1>NOAA CO-OPs Water Temperatures</h1>
        <StationSelector {...this.props} />
        {this.renderErrors()}
        <Chart {...this.props} />
        {this.renderFooter()}
      </div>
    );
  }

  renderErrors() {
    return this.props.errors.map(
      error => (
        <div key={error.instance} className='alert alert-warning' role='alert'>
          Could not load data for {error.year}. {error.message}
        </div>
      )
    )
  }

  renderFooter() {
    return (
      <footer className='footer'>
      An alternate yearly view of water temperature data provided by NOAA CO-OPs. More details at: <a href='https://github.com/gj262/noaa-coops-viewer#noaa-co-ops-water-temperature-viewer'>noaa-coops-viewer</a>
      </footer>
    )
  }
}
