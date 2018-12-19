import React from 'react'
import { Route } from 'react-router-dom'
import CoreLayout from 'layouts/CoreLayout'
import HomeView from 'views/HomeView'

export default (
  <Route
    path='/'
    render={props => (
      <CoreLayout {...props}>
        <HomeView {...props} />
      </CoreLayout>
    )}
  />
)
