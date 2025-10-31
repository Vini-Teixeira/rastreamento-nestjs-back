"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toGeoJSON = toGeoJSON;
exports.toLatLng = toLatLng;
function toGeoJSON(lat, lng) {
    return {
        type: 'Point',
        coordinates: [lng, lat],
    };
}
function toLatLng(point) {
    return {
        lat: point.coordinates[1],
        lng: point.coordinates[0],
    };
}
//# sourceMappingURL=coordinates.utils.js.map