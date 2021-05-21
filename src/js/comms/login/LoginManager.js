/* eslint-disable */
import util from '../util';
import { BASE_URL } from 'Src/config'
import { USER_INFO_URL } from 'Src/config';

class LoginManager {

  getUserData() {
    return util.GET(USER_INFO_URL);
  }

}

const loginManager = new LoginManager();
export default loginManager;
