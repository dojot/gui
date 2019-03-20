import util from '../util';
import configDate from './config.json';

class ConfigManager {
    constructor() {
        this.baseUrl = "";
    }

    getConfigDate() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const didSucceed = true;
                didSucceed ? resolve(configDate) : reject('Error');
            }, 2000);
        });
    }
}

const configManager = new ConfigManager();
export default configManager;
