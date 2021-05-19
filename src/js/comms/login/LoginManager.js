/* eslint-disable */
import util from '../util';
import { BASE_URL } from 'Src/config'
import { USER_INFO_URL } from 'Src/config';

class LoginManager {

  getUserData() {
    return util.GET(USER_INFO_URL);
  }

  setNewPassword(token) {
    return util.POST(`${BASE_URL}auth/password/resetlink?link=${token.token}`, token);
  }

  resetPassword(username) {
    return util.POST(`${BASE_URL}auth/password/reset/${username}`);
  }

  updatePassword(data) {
    return util.POST(`${BASE_URL}auth/password/update/`, data);
  }
}

const loginManager = new LoginManager();
export default loginManager;
