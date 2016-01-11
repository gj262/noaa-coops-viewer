import React from 'react'

import './StationSelector.scss'

export default class StationSelector extends React.Component {
  static propTypes = {
    stations: React.PropTypes.array.isRequired,
    selectedStationID: React.PropTypes.string.isRequired,
    selectStationID: React.PropTypes.func.isRequired
  };

  render () {
    return (
      <div>
        <select
          ref='selection'
          value={this.props.selectedStationID}
          onChange={this.selectStationID.bind(this)}
          className='form-control stations'>
            {this.props.stations.map(station => (
              <option
                value={station.ID}
                key={station.ID}>
                  {station.name} {station.state} ({station.ID})
              </option>
            ))}
        </select>
      </div>
    )
  }

  selectStationID() {
    this.props.selectStationID(this.refs.selection.value)
  }
}
