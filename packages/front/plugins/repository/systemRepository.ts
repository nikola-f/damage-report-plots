import Repository from './repository';

export default {

  getStatus(auth: Object) {
    return Repository.get('/api/system', auth);
  }
  
};