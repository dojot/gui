import util from './util';

class ImageManager {
  constructor() {
    this.baseUrl = ""
  }

  getImages(label) {
    return util.GET(this.baseUrl + '/fw-image/image/?label='+label);
  }


  getImage(id) {
    return util.GET(this.baseUrl + "/image/" + id);
  }


  addImage(image) {
    return util.POST(this.baseUrl + "/fw-image/image/", image);
  }

  setBinary(image) {
    return util.POST_MULTIPART(this.baseUrl + "/fw-image/image/" + image.image_id + "/binary", image);
  }


  deleteImage(id) {
    return util.DELETE(this.baseUrl + "/fw-image/image/" + id);
  }
}

var imageManager = new ImageManager();
export default imageManager;
