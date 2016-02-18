Store              = require 'fluxible/addons/BaseStore'
localStorage       = require './local-storage'
config             = require '../config'
XhrPromise         = require '../util/xhr-promise'
{orderBy, sortBy}  = require 'lodash/collection'
{assign}           = require 'lodash/object'
{takeRight}        = require 'lodash/array'
{FormattedMessage} = require 'react-intl'

q                  = require 'q'

class SearchStore extends Store
  @storeName: 'SearchStore'

  @actionTarget = undefined
  @position = undefined
  @placeholder = undefined

  currentLocation = () ->
    return type: "CurrentLocation", properties:
      labelId: "own-position"
      layer: "currentPosition"

  constructor: (dispatcher) ->
    super(dispatcher)
    @modalOpen = false

  isModalOpen: () =>
    @modalOpen

  getActionTarget: () =>
    @actionTarget

  getPlaceholder: () =>
    @placeholder

  getPosition: () =>
    @position

  sort = (features) ->
    sortBy(features,
      (feature) ->
        config.autoSuggest.sortOrder[feature.properties.layer] || config.autoSuggest.sortOthers
    )

  addCurrentPositionIfEmpty = (features) ->
    if features.length == 0
      features.push currentLocation()
    features

  addOldSearchesIfEmpty = (features) ->
    if (features.filter (feature) -> feature.type != 'CurrentLocation').length == 0
      features = features.concat (takeRight(getSearches(), 10).map (item) ->
        type: "OldSearch"
        properties:
          label: item.address
        geometry: item.geometry)

    features

  getSearches = () ->
    saved = localStorage.getItem "saved-searches"
    if saved == null
      saved = []
    else
      saved = JSON.parse(saved)
    saved

  getPeliasDataOrEmptyArray = (input, geolocation) ->
    deferred = q.defer()
    if input == undefined or input == null or input.trim() == ""
      deferred.resolve []
      return deferred.promise

    if config.autoSuggest.locationAware && geolocation.hasLocation
      opts = assign text: input, config.searchParams, "focus.point.lat": geolocation.lat, "focus.point.lon": geolocation.lon
    else
      opts = assign text: input, config.searchParams

    XhrPromise.getJson(config.URL.PELIAS, opts).then (res) ->
      deferred.resolve res.features

    deferred.promise

  # Usually we don't do async stuff in stores nor do we make XHR request.
  # However, in this case it better to keep all this logic in one place
  # And make all data fetching here
  getSuggestions: (input, geoLocation, cb) =>
    getPeliasDataOrEmptyArray(input, geoLocation)
    .then sort
    .then addCurrentPositionIfEmpty
    .then addOldSearchesIfEmpty
    .then (suggestions) ->
      cb(suggestions)
    .catch (e) ->
      console.error("error occurred", e)

  openSearch: (props) ->
    @modalOpen = true
    @actionTarget = props.actionTarget
    @position = props.position
    @placeholder = props.placeholder
    @emitChange(props)

  closeSearch: () ->
    @modalOpen = false
    @actionTarget = undefined
    @position = undefined
    @placeholder = undefined
    @emitChange()

  # storage (sorted by count desc):
  # [
  #  {
  #   "address": "Espoo, Espoo",
  #   "coordinates" :[]
  #   "count": 1
  #  }
  # ]
  #
  # destination
  # {
  #  "address": "Espoo, Espoo",
  #  coordinates :[]
  # }
  saveSearch: (destination) ->
    searches = getSearches()

    found = searches.filter (storedDestination) ->
      storedDestination.address == destination.address

    switch found.length
      when 0 then searches.push assign count: 1, destination
      when 1 then found[0].count = found[0].count + 1
      else console.error "too many matches", found

    localStorage.setItem "saved-searches", orderBy searches, "count", "desc"

  @handlers:
    "OpenSearch": 'openSearch'
    "CloseSearch": 'closeSearch'
    "SaveSearch": 'saveSearch'

module.exports = SearchStore
