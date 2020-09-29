import imageManager from 'Comms/firmware/ImageManager';
import toaster from 'Comms/util/materialize';

const alt = require('../alt');

class ImageActions {
    updateTemplateInfo(data) {
        return data;
    }

    fetchTemplateInfo(params = null, cb) {
        return (dispatch) => {
            imageManager.getTemplateInfo(params)
                .then((result) => {
                    this.updateTemplateInfo(result);
                    if (cb) {
                        cb(result);
                    }
                })
                .catch((error) => {
                    this.templatesFailed(error);
                });

            dispatch();
        };
    }

    updateBinaries(binaryList) {
        return binaryList;
    }

    updateImages(images) {
        return images;
    }

    updateImageData(id, label, value) {
        return { id, label, value };
    }

    updateImageAllowed(value) {
        return value;
    }

    fetchImages(templateId) {
        return (dispatch) => {
            dispatch();

            imageManager.getImages(templateId).then((imageList) => {
                   this.updateImages(imageList);
                })
                .catch((error) => {
                    this.imagesFailed(error);
                });
        };
    }

    removeBinaryInfo(id) {
        return id;
    }

    triggerUpdate(image, cb) {
        return (dispatch) => {
            dispatch();
            imageManager.setBinary(image)
                .then((response) => {
                    this.updateSingle(response.image);
                    if (cb) {
                        cb(response.image);
                    }
                })
                .catch((error) => {
                    this.imagesFailed(error);
                    this.removeBinaryInfo(image.id);
                });
        };
    }

    updateSingle(imageId) {
        return imageId;
    }

    fetchSingle(label, callback) {
        return (dispatch) => {
            dispatch();

            imageManager.getImages(label)
                .then((images) => {
                    this.updateImages(images);
                    if (callback) {
                        callback(images);
                    }
                })
                .catch((error) => {
                    this.imagesFailed(error);
                });
        };
    }

    insertEmptyImage(image) {
        return image;
    }

    insertImage(image, oldimage) {
        return { image, oldimage };
    }

    triggerInsert(image, cb) {
        const newimage = { ...image };
        delete newimage.id;
        return (dispatch) => {
            dispatch();
            imageManager.addImage(newimage)
                .then((response) => {
                    this.insertImage(response, image);
                    if (cb) {
                        cb(response);
                    }
                })
                .catch((error) => {
                    this.imagesFailed(error);
                });
        };
    }

    triggerRemovalBinary(imageId, cb) {
        return (dispatch) => {
            dispatch();
            imageManager.deleteBinary(imageId)
                .then((response) => {
                    if (response.result === 'ok') {
                        this.removeSingleBinary(imageId);
                        if (cb) {
                            cb(response);
                        }
                    } else {
                        this.imagesFailed('Failed to remove given image');
                    }
                })
                .catch((error) => {
                    this.imagesFailed('Failed to remove given image');
                });
        };
    }

    removeSingleBinary(id) {
        return id;
    }

    triggerRemoval(image, cb) {
        return (dispatch) => {
            dispatch();
            imageManager.deleteImage(image.id)
                .then((response) => {
                    const respJson = (typeof response === 'string') ? JSON.parse(response) : response;
                    if (respJson.result === 'ok') {
                        this.removeSingle(respJson.removed_image.id);
                        if (cb) {
                            cb(response);
                        }
                    } else {
                        this.imagesFailed('Failed to remove given image');
                    }
                })
                .catch((error) => {
                    this.imagesFailed('Failed to remove given image');
                });
        };
    }

    removeSingle(id) {
        return id;
    }

    imagesFailed(error) {
        toaster.error((error.message) ? error.message : error);
        return error;
    }
}

alt.createActions(ImageActions, exports);
