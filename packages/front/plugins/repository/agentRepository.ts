import Repository from './repository';

export default {

  signin(idToken: string) {
    return Repository.post('/api/signin', idToken);
  },
  
  signout() {
    return Repository.post('/api/signout');
  },
  
  signup(idToken: Object) {
    return Repository.post('/api/signup', idToken);
  }
};