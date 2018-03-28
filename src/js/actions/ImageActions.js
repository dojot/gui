import imageManager from '../comms/ImageManager';
import Materialize from 'materialize-css';

var alt = require('../alt');

console.log("ImageActions");

class ImageActions {

  // updateImages(raw_data) {
  //   let templates = {};
  //   let list = [];
  //   for (let index in raw_data)
  //   {
  //     let img = raw_data[index];
  //     if (templates[img.label] == undefined)
  //       templates[img.label] = { 'template_id': img.label, 'images':[]};
  
  //     if (img.sha1)
  //       img.has_image = true;
  //     else
  //       img.has_image = false;
  //     templates[img.label].images.push(img);
  //   }
  //   console.log("updateImages",raw_data);
  //   return templates;
  // }

    updateImages(raw_data) {
      console.log("updateImages",raw_data);
      return raw_data;
  }

  // fetchImages() {
  //   return (dispatch) => {
  //     dispatch();

  //     imageManager.getImages().then((imageList) => {
  //       console.log("imageManager.getImages()",imageList);
  //       this.updateImages(imageList);
  //     })
  //     .catch((error) => {
  //       this.imagesFailed(error);
  //     });
  //   }
  // }


  triggerUpdate(image, cb) {
    return (dispatch) => {
      dispatch();
      imageManager.setBinary(image)
        .then((response) => {
          console.log("imageManager.setBinary",response);
          this.updateSingle(response.image);
          if (cb) {
            cb(response.image);
          }
        })
        .catch((error) => {
          this.imagesFailed(error);
        })
    }
  }

  updateSingle(image) {
    return image;
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
          console.error("Failed to fetch images", error);
          this.imagesFailed(error);
        })
    }
  }



  insertImage(image) {
    return image;
  }

  triggerInsert(image, cb) {
    const newimage = image;
    return (dispatch) => {
      dispatch();
        imageManager.addImage(newimage)
        .then((response) => {
          this.insertImage(response);
          if (cb) {
            cb(response);
          }
        })
        .catch((error) => {
          this.imagesFailed(error);
        })
    }
  }


  triggerRemoval(image, cb) {
    return (dispatch) => {
      dispatch();
      imageManager.deleteImage(image.id)
        .then((response) => {
          let resp_json = JSON.parse(response);
          if (resp_json.result == "ok")
          {
            this.removeSingle(resp_json.removed_image.id);
            if (cb) {
              cb(response);
            }
          }
          else
          {
            this.imagesFailed("Failed to remove given image");
          }
        })
        .catch((error) => {
          this.imagesFailed("Failed to remove given image");
        })
    }
  }

  removeSingle(id) {
    return id;
  }

  imagesFailed(error) {
    Materialize.toast(error.message, 4000);
    return error;
  }
}

alt.createActions(ImageActions, exports);
