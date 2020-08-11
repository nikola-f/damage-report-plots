import Repository from './repository';

export default {

  signin(idToken: string) {
    return Repository.post('/api/signin', idToken);
  },
  
  signout() {
    return Repository.post('/api/signout');
  },
  
  getAgent() {
    return Repository.get('/api/me');
  },
  
  signup(idToken: Object) {
    return Repository.post('/api/signup', idToken);
  }
};