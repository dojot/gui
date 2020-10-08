import { baseURL } from 'Src/config';
import util from '../util/util';

class ExportManager {
    export() {
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'Content-Disposition': 'attachment; filename="download"',
        };

        return util.GET(`${baseURL}export`, headers);
    }
}

const exportManager = new ExportManager();
export default exportManager;
