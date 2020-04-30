/* eslint-disable import/no-extraneous-dependencies */
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import i18next from 'i18next';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import withBreakpoint from '@digitransit-component/digitransit-component-with-breakpoint';
import Select from './helpers/Select';
import Icon from './helpers/Icon';
import translations from './helpers/translations';

i18next.init({ lng: 'fi', resources: {} });

i18next.addResourceBundle('en', 'translation', translations.en);
i18next.addResourceBundle('fi', 'translation', translations.fi);
i18next.addResourceBundle('sv', 'translation', translations.sv);

export const getEmptyViaPointPlaceHolder = () => ({});

const isViaPointEmpty = viaPoint => {
  if (viaPoint === undefined) {
    return true;
  }
  const keys = Object.keys(viaPoint);
  return (
    keys.length === 0 || (keys.length === 1 && keys[0] === 'locationSlack')
  );
};

const ItinerarySearchControl = ({
  children,
  className,
  enabled,
  onClick,
  onKeyPress,
  ...rest
}) =>
  enabled &&
  onClick && (
    <div className="itinerary-search-control">
      <div
        {...rest}
        className={cx(className, 'cursor-pointer')}
        onClick={onClick}
        onKeyPress={onKeyPress}
        role="button"
        tabIndex="0"
      >
        {children}
      </div>
    </div>
  );

ItinerarySearchControl.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string.isRequired,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
};

/**
 * Panel that renders two DTAutosuggest search fields, including viapoint handling
 *
 * @example
 * const searchContext = {
 *   getFavouriteLocations: () => ({}),    // Function that returns array of favourite locations.
 *   getFavouriteStops: () => ({}),        // Function that returns array of favourite stops.
 *   getLanguage: () => ({}),              // Function that returns current language.
 *   getStoredFavouriteRoutes: () => ({}), // Function that returns array of favourite routes.
 *   getPositions: () => ({}),             // Function that returns user's geolocation.
 *   getRoutes: () => ({}),                // Function that fetches routes from graphql API.
 *   getStopAndStations: () => ({}),       // Function that fetches favourite stops and stations from graphql API.
 *   getFavouriteRoutes: () => ({}),       // Function that fetches favourite routes from graphql API.
 *   startLocationWatch: () => ({}),       // Function that locates users geolocation.
 *   saveSearch: () => ({}),               // Function that saves search to old searches store.
 * };
 * const config = {
 *  search: {
 *   identify searches for route numbers/labels: bus | train | metro
 *    lineRegexp: new RegExp(
 *     '(^[0-9]+[a-z]?$|^[yuleapinkrtdz]$|(^m[12]?b?$))',
 *     'i',
 *       ),
 *   suggestions: {
 *     useTransportIcons: false,
 *   },
 *   usePeliasStops: false,
 *   mapPeliasModality: false,
 *   peliasMapping: {},
 *   peliasLayer: null,
 *   peliasLocalization: null,
 *   minimalRegexp: new RegExp('.{2,}'),
 * },
 *   autoSuggest: {
 *   // Let Pelias suggest based on current user location
 *   locationAware: true,
 * },
 *  searchParams: {},
 *   URL: {
 *     PELIAS: 'https://dev-api.digitransit.fi/geocoding/v1'
 *   },
 *   feedIds: [],
 *  }
 * const origin = {
 *  lat: 60.169196,
 *  lon: 24.957674,
 *  address: 'Aleksanterinkatu, Helsinki',
 *  set: true,
 *  ready: true,
 * }
 * const destination = {
 *   lat: 60.199093,
 *   lon: 24.940536,
 *   address: 'Opastinsilta 6, Helsinki',
 *   set: true,
 *   ready: true,
 * }
 * onSelect() {
 *  return null;
 *  }
 * <DTAutosuggestPanel
 *    config={config}
 *    origin={origin}
 *    destination={destination}
 *    isItinerary={false}
 *    searchType="endpoint"
 *    searchContext={searchContext}
 *    onSelect={this.onSelect}
 *    lang="fi"
 *    addAnalyticsEvent={null}
 * />
 */
class DTAutosuggestPanel extends React.Component {
  static propTypes = {
    config: PropTypes.object.isRequired,
    origin: PropTypes.object.isRequired,
    destination: PropTypes.object.isRequired,
    isItinerary: PropTypes.bool,
    originPlaceHolder: PropTypes.string,
    destinationPlaceHolder: PropTypes.string,
    searchType: PropTypes.string,
    initialViaPoints: PropTypes.arrayOf(PropTypes.object),
    updateViaPoints: PropTypes.func,
    breakpoint: PropTypes.string.isRequired,
    swapOrder: PropTypes.func,
    getViaPointsFromMap: PropTypes.bool,
    searchPanelText: PropTypes.string,
    searchContext: PropTypes.any.isRequired,
    onSelect: PropTypes.func,
    addAnalyticsEvent: PropTypes.func,
    lang: PropTypes.string,
  };

  static defaultProps = {
    initialViaPoints: [],
    isItinerary: false,
    originPlaceHolder: 'give-origin',
    destinationPlaceHolder: 'give-destination',
    searchType: 'endpoint',
    swapOrder: undefined,
    updateViaPoints: () => {},
    getViaPointsFromMap: false,
    lang: 'fi',
  };

  constructor(props) {
    super(props);
    this.draggableViaPoints = [];
    this.state = {
      activeSlackInputs: [],
      showDarkOverlay: false,
      viaPoints: this.props.initialViaPoints.map(vp => ({ ...vp })),
      refs: [],
    };
  }

  componentDidMount = () => {
    i18next.changeLanguage(this.props.lang);
  };

  componentDidUpdate = prevProps => {
    if (prevProps.lang !== this.props.lang) {
      i18next.changeLanguage(this.props.lang);
    }
  };

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps = () => {
    if (this.props.getViaPointsFromMap) {
      this.setState({
        viaPoints: [], // getIntermediatePlaces(this.context.match.location.query),
      });
    }
  };

  getSlackTimeOptions = () => {
    const timeOptions = [];
    for (let i = 0; i <= 9; i++) {
      const valueInMinutes = i * 10;
      timeOptions.push({
        displayName: `${i}`,
        displayNameObject: `${valueInMinutes} ${i18next.t('minute-short')}`,
        value: valueInMinutes * 60,
      });
    }
    return timeOptions;
  };

  setDraggableViaPointRef = (element, index) => {
    this.draggableViaPoints[index] = element;
  };

  storeReference = ref => {
    this.setState(prevState => ({ refs: [...prevState.refs, ref] }));
  };

  handleFocusChange = () => {
    const { destination } = this.props;
    if (!destination || !destination.set) {
      this.state.refs[1].focus();
    }
  };

  isKeyboardSelectionEvent = event => {
    const space = [13, ' ', 'Spacebar'];
    const enter = [32, 'Enter'];
    const key = (event && (event.key || event.which || event.keyCode)) || '';
    if (!key || !space.concat(enter).includes(key)) {
      return false;
    }
    event.preventDefault();
    return true;
  };

  value = location =>
    (location && location.address) ||
    (location && location.gps && location.ready && 'Nykyinen sijainti') ||
    '';

  class = location =>
    location && location.gps === true ? 'position' : 'location';

  isFocused = val => {
    this.setState({ showDarkOverlay: val });
  };

  updateViaPoints = viaPoints => {
    if (viaPoints.length === 0) {
      this.props.updateViaPoints([]);
      return;
    }
    this.props.updateViaPoints(viaPoints.filter(vp => !isViaPointEmpty(vp)));
  };

  updateViaPointSlack = (
    activeViaPointSlacks,
    updatedViaPointIndex,
    viaPointRemoved = false,
  ) => {
    const foundAtIndex = activeViaPointSlacks.indexOf(updatedViaPointIndex);
    if (foundAtIndex > -1) {
      activeViaPointSlacks.splice(foundAtIndex, 1);
    }
    return viaPointRemoved
      ? activeViaPointSlacks.map(
          value => (value > updatedViaPointIndex ? value - 1 : value),
        )
      : activeViaPointSlacks;
  };

  handleToggleViaPointSlackClick = viaPointIndex => {
    const { activeSlackInputs } = this.state;
    this.setState({
      activeSlackInputs: activeSlackInputs.includes(viaPointIndex)
        ? this.updateViaPointSlack(activeSlackInputs, viaPointIndex)
        : activeSlackInputs.concat([viaPointIndex]),
    });
  };

  handleViaPointSlackTimeSelected = (slackTimeInSeconds, i) => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'EditViaPointStopDuration',
        category: 'ItinerarySettings',
        name: slackTimeInSeconds / 60,
      });
    }
    const { viaPoints } = this.state;
    viaPoints[i].locationSlack = Number.parseInt(slackTimeInSeconds, 10);
    this.setState({ viaPoints }, () => this.updateViaPoints(viaPoints));
  };

  handleViaPointLocationSelected = (viaPointLocation, i) => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'EditJourneyViaPoint',
        category: 'ItinerarySettings',
        name: viaPointLocation.type,
      });
    }
    const { viaPoints } = this.state;
    viaPoints[i] = {
      ...viaPointLocation,
    };
    this.setState({ viaPoints }, () => this.updateViaPoints(viaPoints));
  };

  handleRemoveViaPointClick = viaPointIndex => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'RemoveJourneyViaPoint',
        category: 'ItinerarySettings',
        name: null,
      });
    }
    const { activeSlackInputs, viaPoints } = this.state;
    viaPoints.splice(viaPointIndex, 1);
    this.setState(
      {
        activeSlackInputs: this.updateViaPointSlack(
          activeSlackInputs,
          viaPointIndex,
          true,
        ),
        viaPoints,
      },
      () => this.updateViaPoints(viaPoints),
    );
  };

  handleAddViaPointClick = () => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'AddJourneyViaPoint',
        category: 'ItinerarySettings',
        name: 'Qu}ickSettingsButton',
      });
    }
    const { viaPoints } = this.state;
    viaPoints.push(getEmptyViaPointPlaceHolder());
    this.setState({ viaPoints });
  };

  handleSwapOrderClick = () => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'SwitchJourneyStartAndEndPointOrder',
        category: 'ItinerarySettings',
        name: null,
      });
    }
    const { viaPoints } = this.state;
    viaPoints.reverse();
    this.setState({ viaPoints }, () => this.props.swapOrder());
  };

  handleOnViaPointDragOver = (event, index) => {
    event.preventDefault();
    this.setState({ isDraggingOverIndex: index });
  };

  handleOnViaPointDragEnd = () => {
    this.setState({
      isDraggingOverIndex: undefined,
    });
  };

  handleOnViaPointDrop = (event, targetIndex) => {
    event.preventDefault();
    const draggedIndex = Number.parseInt(
      event.dataTransfer.getData('text'),
      10,
    );
    if (
      Number.isNaN(draggedIndex) ||
      draggedIndex === targetIndex ||
      targetIndex - draggedIndex === 1
    ) {
      return;
    }
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'SwitchJourneyViaPointOrder',
        category: 'ItinerarySettings',
        name: null,
      });
    }
    const { viaPoints } = this.state;
    const draggedViaPoint = viaPoints.splice(draggedIndex, 1)[0];
    viaPoints.splice(
      targetIndex > draggedIndex ? targetIndex - 1 : targetIndex,
      0,
      draggedViaPoint,
    );
    this.setState({ viaPoints, isDraggingOverIndex: undefined }, () =>
      this.updateViaPoints(viaPoints),
    );
  };

  handleStartViaPointDragging = (event, isDraggingIndex) => {
    // IE and Edge < 18 do not support setDragImage
    if (
      event.dataTransfer.setDragImage &&
      this.draggableViaPoints[isDraggingIndex]
    ) {
      event.dataTransfer.setDragImage(
        this.draggableViaPoints[isDraggingIndex],
        0,
        0,
      );
    }

    // IE throws an error if trying to set the dropEffect
    event.dataTransfer.dropEffect = 'move'; // eslint-disable-line no-param-reassign
    event.dataTransfer.effectAllowed = 'move'; // eslint-disable-line no-param-reassign

    // IE and Edge only support the type 'text'
    event.dataTransfer.setData('text', `${isDraggingIndex}`);
  };

  render = () => {
    const {
      breakpoint,
      isItinerary,
      origin,
      searchPanelText,
      searchContext,
    } = this.props;
    const { activeSlackInputs, isDraggingOverIndex, viaPoints } = this.state;
    const slackTime = this.getSlackTimeOptions();
    const defaultSlackTimeValue = 0;
    const getViaPointSlackTimeOrDefault = (
      viaPoint,
      defaultValue = defaultSlackTimeValue,
    ) => (viaPoint && viaPoint.locationSlack) || defaultValue;
    const isViaPointSlackTimeInputActive = index =>
      activeSlackInputs.includes(index);
    return (
      <div
        className={cx([
          'autosuggest-panel',
          {
            small: breakpoint !== 'large',
            isItinerary,
          },
        ])}
      >
        {' '}
        {searchPanelText ? (
          <div className="autosuggest-searchpanel-text">
            <span> {searchPanelText}</span>
          </div>
        ) : null}
        <div
          className={cx([
            'dark-overlay',
            {
              hidden: !this.state.showDarkOverlay,
              isItinerary,
            },
          ])}
        />
        <div className="origin-input-container">
          <DTAutoSuggest
            config={this.props.config}
            icon="mapMarker-from"
            id="origin"
            autoFocus={
              // Disable autofocus if using IE11
              breakpoint === 'large' && !origin.ready
            }
            storeRef={this.storeReference}
            refPoint={origin}
            className={this.class(origin)}
            searchType={this.props.searchType}
            placeholder={this.props.originPlaceHolder}
            value={this.value(origin)}
            isFocused={this.isFocused}
            searchContext={searchContext}
            onSelect={this.props.onSelect}
            focusChange={this.handleFocusChange}
            lang={this.props.lang}
          />
          <ItinerarySearchControl
            className="switch"
            enabled={isItinerary}
            onClick={() => this.handleSwapOrderClick()}
            onKeyPress={e =>
              this.isKeyboardSelectionEvent(e) && this.handleSwapOrderClick()
            }
            aria-label={i18next.t('swap-order-button-label')}
          >
            <Icon img="direction-b" />
          </ItinerarySearchControl>
        </div>
        <div className="viapoints-container">
          {viaPoints.map((o, i) => (
            <div
              className={cx('viapoint-container', {
                'drop-target-before': i === isDraggingOverIndex,
              })}
              key={`viapoint-${i}`} // eslint-disable-line
              onDragOver={e => this.handleOnViaPointDragOver(e, i)}
              onDrop={e => this.handleOnViaPointDrop(e, i)}
              ref={el => this.setDraggableViaPointRef(el, i)}
            >
              <div className={`viapoint-input-container viapoint-${i + 1}`}>
                <div
                  className="viapoint-before"
                  draggable
                  onDragEnd={this.handleOnViaPointDragEnd}
                  onDragStart={e => this.handleStartViaPointDragging(e, i)}
                  style={{ cursor: 'move' }}
                >
                  <Icon img="ellipsis" />
                </div>
                <DTAutoSuggest
                  config={this.props.config}
                  icon="mapMarker-via"
                  id="viapoint"
                  ariaLabel={i18next.t('via-point-index', { index: i + 1 })}
                  autoFocus={breakpoint === 'large'}
                  refPoint={this.props.origin}
                  searchType="endpoint"
                  placeholder="via-point"
                  className="viapoint"
                  isFocused={this.isFocused}
                  searchContext={searchContext}
                  value={(o && o.address) || ''}
                  onSelect={this.props.onSelect}
                  handelViaPoints={item =>
                    this.handleViaPointLocationSelected(item, i)
                  }
                  lang={this.props.lang}
                />
                <div className="via-point-button-container">
                  <ItinerarySearchControl
                    className="add-via-point-slack"
                    enabled={isItinerary}
                    onClick={() => this.handleToggleViaPointSlackClick(i)}
                    onKeyPress={e =>
                      this.isKeyboardSelectionEvent(e) &&
                      this.handleToggleViaPointSlackClick(i)
                    }
                    aria-label={i18next.t(
                      isViaPointSlackTimeInputActive(i)
                        ? 'add-via-duration-button-label-open'
                        : 'add-via-duration-button-label-close',
                      { index: i + 1 },
                    )}
                  >
                    <Icon img="time" />
                    <Icon
                      img="attention"
                      className={cx('super-icon', {
                        collapsed:
                          isViaPointSlackTimeInputActive(i) ||
                          getViaPointSlackTimeOrDefault(viaPoints[i]) ===
                            defaultSlackTimeValue,
                      })}
                    />
                  </ItinerarySearchControl>
                  <ItinerarySearchControl
                    className="remove-via-point"
                    enabled={isItinerary}
                    onClick={() => this.handleRemoveViaPointClick(i)}
                    onKeyPress={e =>
                      this.isKeyboardSelectionEvent(e) &&
                      this.handleRemoveViaPointClick(i)
                    }
                    aria-label={i18next.t('remove-via-button-label', {
                      index: i + 1,
                    })}
                  >
                    <Icon img="close" />
                  </ItinerarySearchControl>
                </div>
              </div>
              <div
                className={cx('input-viapoint-slack-container', {
                  collapsed: !isViaPointSlackTimeInputActive(i),
                })}
              >
                <span>{i18next.t('viapoint-slack-amount')}</span>
                <div className="select-wrapper">
                  <Select
                    name="viapoint-slack-amount"
                    selected={`${getViaPointSlackTimeOrDefault(viaPoints[i])}`}
                    options={slackTime}
                    onSelectChange={e =>
                      this.handleViaPointSlackTimeSelected(e.target.value, i)
                    }
                    ariaLabel={i18next.t('add-via-duration-button-label', {
                      index: i + 1,
                    })}
                  />
                  <Icon className="fake-select-arrow" img="arrow-dropdown" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="destination-input-container">
          <DTAutoSuggest
            config={this.props.config}
            icon="mapMarker-to"
            id="destination"
            autoFocus={
              // Disable autofocus if using IE11
              breakpoint === 'large' && origin.ready
            }
            storeRef={this.storeReference}
            refPoint={origin}
            searchType={this.props.searchType}
            placeholder={this.props.destinationPlaceHolder}
            className={this.class(this.props.destination)}
            isFocused={this.isFocused}
            searchContext={searchContext}
            onSelect={this.props.onSelect}
            value={this.value(this.props.destination)}
            lang={this.props.lang}
          />
          <ItinerarySearchControl
            className={cx('add-via-point', 'more', {
              collapsed: viaPoints.length > 4,
            })}
            enabled={isItinerary}
            onClick={() => this.handleAddViaPointClick()}
            onKeyPress={e =>
              this.isKeyboardSelectionEvent(e) && this.handleAddViaPointClick()
            }
            aria-label={i18next.t('add-via-button-label')}
          >
            <Icon img="plus" />
          </ItinerarySearchControl>
        </div>
      </div>
    );
  };
}

const DTAutosuggestPanelWithBreakpoint = withBreakpoint(DTAutosuggestPanel);

export {
  DTAutosuggestPanel as component,
  DTAutosuggestPanelWithBreakpoint as default,
};