import React from 'react'
import Select from 'react-select';

import 'react-select/scss/default.scss'
import './StationSelector.scss'

export default class StationSelector extends React.Component {
  static propTypes = {
    stations: React.PropTypes.array.isRequired,
    selectedStationID: React.PropTypes.string.isRequired,
    selectStationID: React.PropTypes.func.isRequired
  };

  render () {
    var options = this.makeStationOptions();
    return (
      <div className='text-left col-xs-offset-3 col-xs-6 col-lg-offset-4 col-lg-4 '>
        <Select
          value={this.props.selectedStationID}
          clearable={false}
          options={options}
          onChange={this.selectStationID.bind(this)} />
      </div>
    )
  }

  makeStationOptions() {
    return this.props.stations.map(station => { return {value: station.ID, label: `${station.name} ${station.state} (${station.ID})`} })
  }

  selectStationID(stationID) {
    this.props.selectStationID(stationID)
  }
}
