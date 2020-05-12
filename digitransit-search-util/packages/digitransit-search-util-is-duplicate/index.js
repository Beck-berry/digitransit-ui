import truEq from '@digitransit-search-util/digitransit-search-util-tru-eq';
/**
 * Checks that is items duplicate
 *
 * @name isDuplicate
 * @param {Object} item1 Object containing following attributes:
 * {
 *  properties {
 *      gtfsId: String
 *      gid: String from geocoder
 *      name: String
 *      label: String
 *       address: String
 *      geometry {
 *         coordinates [Number lat, Number lon]
 *      }
 *  }
 * }
 * @param {Object} item2 Object with same attributes as item1
 * @returns {Boolean} true/false
 * @example
 * digitransit-util.isDuplicate(param1, param2);
 * //=true
 */
export default function isDuplicate(item1, item2) {
  const props1 = item1.properties;
  const props2 = item2.properties;

  if (truEq(props1.gtfsId, props2.gtfsId)) {
    return true;
  }
  if (props1.gtfsId && props2.gid && props2.gid.includes(props1.gtfsId)) {
    return true;
  }
  if (props2.gtfsId && props1.gid && props1.gid.includes(props2.gtfsId)) {
    return true;
  }

  const p1 = item1.geometry.coordinates;
  const p2 = item2.geometry.coordinates;

  if (p1 && p2) {
    // both have geometry
    if (Math.abs(p1[0] - p2[0]) < 1e-6 && Math.abs(p1[1] - p2[1]) < 1e-6) {
      // location match is not enough. Require a common property
      if (
        truEq(props1.name, props2.name) ||
        truEq(props1.label, props2.label) ||
        truEq(props1.address, props2.address) ||
        truEq(props1.address, props2.label) ||
        truEq(props1.label, props2.address)
      ) {
        return true;
      }
    }
  }
  return false;
}