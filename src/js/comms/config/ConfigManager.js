import configDate from './config.json';

class ConfigManager {
    getConfigDate() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(configDate);
            }, 2000);
        });
    }
}

const configManager = new ConfigManager();
export default configManager;
