React = require 'react'
Relay = require 'react-relay'
queries = require '../../queries'
Icon  = require '../icon/icon'
RouteList = require '../stop-cards/route-list'

class DisruptionRow extends React.Component
  render: ->
    <div className='row'>
      <section className='grid-content'>
        <div className='disruption-header disruption'>
          <RouteList className="left" routes={@props.routes}/>
          <span className='time bold'>{@props.startTime.format("HH:mm")} - {@props.endTime.format("HH:mm")}</span>
        </div>
        <div className='disruption-content'>
          <p>
            {@props.description}
          </p>
        </div>
        <div className='disruption-details hide'>
          <span><b className='uppercase'>syy:</b> {@props.cause}</span>
        </div>
      </section>
    </div>

module.exports = Relay.createContainer DisruptionRow,
  fragments: queries.DisruptionRowFragments
