import configManager from '../comms/config/ConfigManager';
import toaster from "../comms/util/materialize";
import alt from "../alt";


class ConfigActions {
    fetchCurrentConfig() {
        return (dispatch) => {
            dispatch();
            configManager.getConfigDate()
                .then((configList) => {
                    this.insertCurrentAlarms(configList);
                })
                .catch((error) => {
                    this.alarmsFailed(error);
                });
        };
    }

    insertCurrentAlarms(configList) {
        return configList;
    }

    alarmsFailed(error) {
        toaster.error(error.message);
        return error;
    }
}

const _config = alt.createActions(ConfigActions, exports);
export default _config;
