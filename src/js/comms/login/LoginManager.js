/* eslint-disable */
import util from '../util';

const GQL_LOGIN = (username, passwd) => `
  mutation {
  login(username: "${username}", passwd: "${passwd}") {
    jwt
    user {
      username
      profile
      permissions {
        subject
        actions
      }
    }
  }
}
`;

class LoginManager {
  constructor() {
    this.baseUrl = '';
  }

  authenticate(login) {
    const req = {
      query: GQL_LOGIN(login.username, login.password),
    };
    return util.POST(this.baseUrl + 'graphql-auth/', req);
  }

  setNewPassword(token) {
    return util.POST(`${this.baseUrl}/auth/password/resetlink?link=${token.token}`, token);
  }

  resetPassword(username) {
    return util.POST(`${this.baseUrl}/auth/password/reset/${username}`);
  }

  updatePassword(data) {
    return util.POST(`${this.baseUrl}/auth/password/update/`, data);
  }
}

const loginManager = new LoginManager();
export default loginManager;
