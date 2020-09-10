import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { FormattedMessage } from 'react-intl';
import LocalTime from './LocalTime';

const DepartureRow = (
  { departure, departureTime, showPlatformCode, ...props },
  { config },
) => {
  const mode = departure.trip.route.mode.toLowerCase();
  const timeDiffInMinutes = Math.floor(
    (departureTime - props.currentTime) / 60,
  );
  let shownTime;
  if (timeDiffInMinutes <= 0) {
    shownTime = <FormattedMessage id="arriving-soon" defaultMessage="Now" />;
  } else if (timeDiffInMinutes > config.minutesToDepartureLimit) {
    shownTime = undefined;
  } else {
    shownTime = (
      <FormattedMessage
        id="departure-time-in-minutes"
        defaultMessage="{minutes} min"
        values={{ minutes: timeDiffInMinutes }}
      />
    );
  }
  return (
    <div role="listitem" className={cx('departure-row', mode)}>
      <div className="route-number-container">
        <div className="route-number">{departure.trip.route.shortName}</div>
      </div>
      <div className="route-headsign">{departure.headsign}</div>
      <div className={cx('route-arrival', { realtime: departure.realtime })}>
        {shownTime}
      </div>
      <div className={cx('route-time', { realtime: departure.realtime })}>
        <LocalTime time={departureTime} />
      </div>
      {showPlatformCode && (
        <div
          className={
            !departure.stop.platformCode
              ? 'platform-code empty'
              : 'platform-code'
          }
        >
          {departure.stop.platformCode}
        </div>
      )}
    </div>
  );
};
DepartureRow.propTypes = {
  departure: PropTypes.object.isRequired,
  departureTime: PropTypes.number.isRequired,
  currentTime: PropTypes.number.isRequired,
  showPlatformCode: PropTypes.bool,
};

DepartureRow.contextTypes = {
  config: PropTypes.object.isRequired,
};
export default DepartureRow;
