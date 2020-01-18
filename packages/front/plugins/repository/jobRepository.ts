import Repository from './repository';

export default {

  create(auth: Object) {
    return Repository.post('/api/job', auth);
  }
  
};