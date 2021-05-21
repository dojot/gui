const alt = require('../alt');
const ConfigActions = require('../actions/ConfigActions');

class ConfigStore {
    constructor() {
        this.error = null;
        this.itemsPerPage = [];
        this.mapImage = [];
        this.measureAttribute = '';
        this.range = '';
        this.mapOverlayActive = false;
        this.mapZoom = 0;
        this.mapCenter = {};
        this.mapColorActive = false;
        this.tileSelect = '';
        this.mapObj = [];
        this.bindListeners({
            handleFetchConfigList: ConfigActions.FETCH_CURRENT_CONFIG,
            handleUpdateConfigList: ConfigActions.INSERT_CURRENT_ALARMS,
        });
    }

    handleFetchConfigList() {
        this.error = '';
    }

    handleUpdateConfigList(configList) {
        // console.log(configList);
        this.mapImage = configList.mapImage;
        this.measureAttribute = configList.measureAttribute;
        this.mapOpacity = configList.mapOpacity;
        this.range = configList.range;
        this.mapOverlayActive = configList.mapOverlayActive;
        this.mapZoom = configList.mapZoom;
        this.mapCenter = configList.mapCenter;
        this.mapColorActive = configList.mapColorActive;
        for (const index in this.mapImage) {
            if (Object.prototype.hasOwnProperty.call(this.mapImage, index)) {
                this.mapObj.push({
                    'id': this.mapImage[index].id,
                    'MAP_HAS_OVERLAY_ENV': "false",
                    'description': this.mapImage[index].description,
                    'overlay_data': {
                        'path': this.mapImage[index].image_path,
                        'corner1': this.mapImage[index].mapCoordinates.initial,
                        'corner2': this.mapImage[index].mapCoordinates.final,
                    },
                });
            };
        }
    }
}
const _store = alt.createStore(ConfigStore, 'ConfigStore');
export default _store;
