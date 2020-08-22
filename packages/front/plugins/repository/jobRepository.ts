import Repository from './repository';

export default {

  create(auth: any, rangeToTime: number) {
    return Repository.post('/api/job', {
      "accessToken": auth.access_token,
      "expiredAt": auth.expired_at,
      "rangeToTime": rangeToTime
    }, {
      "headers": {
        "Authorization": auth.id_token
      },
    });
  },

  getList(auth: Object) {
    return Repository.get('/api/jobs', auth);
  }
  
};