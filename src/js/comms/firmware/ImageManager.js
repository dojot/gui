import { PROXY_URL } from 'Src/config';
import util from '../util';

class ImageManager {
    getImages(label) {
        return util.GET(`${PROXY_URL}fw-image/image?label=${label}`);
    }

    getImage(id) {
        return util.GET(`${PROXY_URL}image/${id}`);
    }

    getBinaries() {
        return util.GET(`${PROXY_URL}image/binary/`);
    }

    addImage(image) {
        return util.POST(`${PROXY_URL}fw-image/image/`, image);
    }

    setBinary(image) {
        return util.POST_MULTIPART(`${PROXY_URL}fw-image/image/${image.id}/binary`, image);
    }

    deleteBinary(id) {
        return util.DELETE(`${PROXY_URL}fw-image/image/${id}/binary`);
    }

    deleteImage(id) {
        return util.DELETE(`${PROXY_URL}fw-image/image/${id}`);
    }
}

const imageManager = new ImageManager();
export default imageManager;
