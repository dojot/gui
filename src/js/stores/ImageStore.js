/* eslint-disable */
const alt = require('../alt');
const ImageActions = require('../actions/ImageActions');

class ImageStore {
    constructor() {
        this.images = {};
        this.error = null;
        this.loading = false;
        this.imageAllowed = false;
        
        this.bindListeners({
            handleUpdateImageList: ImageActions.UPDATE_IMAGES,
            handleFetchImageList: ImageActions.FETCH_IMAGES,
        
            handleTriggerInsertion: ImageActions.TRIGGER_INSERT,
            handleInsertImage: ImageActions.INSERT_IMAGE,
            handleInsertEmptyImage: ImageActions.INSERT_EMPTY_IMAGE,

            handleFetchTemplateInfo: ImageActions.FETCH_TEMPLATE_INFO,
            handleSetTemplateInfo: ImageActions.UPDATE_TEMPLATE_INFO,
            
            handleTriggerUpdate: ImageActions.TRIGGER_UPDATE,
            handleUpdateSingle: ImageActions.UPDATE_SINGLE,

            handleTriggerRemovalBinary: ImageActions.TRIGGER_REMOVAL_BINARY,
            handleRemoveSingleBinary: ImageActions.REMOVE_SINGLE_BINARY,

            handleTriggerRemoval: ImageActions.TRIGGER_REMOVAL,
            handleRemoveSingle: ImageActions.REMOVE_SINGLE,

            handleUpdateImageData: ImageActions.UPDATE_IMAGE_DATA,
            handleUpdateImageAllowed: ImageActions.UPDATE_IMAGE_ALLOWED,

            fetchSingle: ImageActions.FETCH_SINGLE,

            handleFailure: ImageActions.IMAGES_FAILED,

        });
    }

    handleFetchTemplateInfo() {
        this.imageAllowed = false;
    }

    handleSetTemplateInfo(data) {
        this.imageAllowed = data.allowReceiveImages;
    }

    handleUpdateImageAllowed(value)
    {
        this.imageAllowed = value;
    }

    handleUpdateImageData(fields)
    {
        this.images[fields.id].saved = false;
        this.images[fields.id][fields.label] = fields.value;
    }



    handleInsertEmptyImage(image)
    {
        this.images[image.id] = JSON.parse(JSON.stringify(image));
    }
    
    enhanceImage(image)
    {
        let newImage = {};
        newImage = JSON.parse(JSON.stringify(image));
        newImage.has_image = newImage.confirmed;
        if (!newImage.has_image)
        newImage.image_hash = null;
        newImage.image_version = newImage.fw_version;
        newImage.saved = true;
        return newImage;
    }

    handleUpdateImageList(images) {
        this.images = {};
        for (let idx = 0; idx < images.length; idx++) {
            const img = this.enhanceImage(images[idx]);
            this.images[img.id] = img;
        }
        this.error = null;
        this.loading = false;
    }

    handleFetchImageList() {
        this.images = {};
        this.loading = true;
    }



    handleTriggerInsertion(newImage) {
        // this is actually just a intermediary while addition happens asynchonously
        this.error = null;
        this.loading = true;
    }

    handleInsertImage(imgs) {
        // todo: get image_id correctly
        // const idToBeUsed = imgs.image.id;
        // adds new image
        const idToBeUsed = imgs.image.url.split('/')[2];
        this.images[idToBeUsed] = JSON.parse(JSON.stringify(imgs.oldimage)); 
        this.images[idToBeUsed].id = idToBeUsed;
        this.images[idToBeUsed].saved = true;
        this.images[idToBeUsed].created = imgs.image.published_at;
        this.images[idToBeUsed].image_version = this.images[idToBeUsed].fw_version;
        
        // removes old image 
        delete this.images[imgs.oldimage.id];
     
        this.error = null;
        this.loading = false;
    }


    handleUpdateSingle(image_id) {
        this.images[image_id].has_image = true;
        this.loading = false;
    }

    handleTriggerUpdate(image) {
        this.error = null;
        this.loading = true;
    }




    handleTriggerRemovalBinary(id) { 
        this.error = null;
        this.loading = true;
    }

    handleRemoveSingleBinary(id) {
        if (this.images.hasOwnProperty(id)) {
            this.images[id].has_image = false;
            this.images[id].image_hash = null;
        }
        this.loading = false;
    }




    handleTriggerRemoval(image) {
        this.error = null;
        this.loading = true;
    }

    handleRemoveSingle(id) {
        if (this.images.hasOwnProperty(id)) {
            delete this.images[id];
        }
        this.loading = false;
    }


    fetchSingle(id) {
        this.images = { loading: true };
    }

    handleFailure(error) {
        this.error = error;
        this.loading = false;
    }
}

const _store = alt.createStore(ImageStore, 'ImageStore');
export default _store;
