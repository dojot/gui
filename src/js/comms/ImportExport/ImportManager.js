import { PROXY_URL } from 'Src/config';
import util from '../util/util';

class ImportManager {
    import(file) {
        return util.POST(`${PROXY_URL}import/`, file);
    }
}

const importManager = new ImportManager();
export default importManager;
