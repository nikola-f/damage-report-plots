import axios from 'axios';



const instance = axios.create({
  "baseURL": process.env.REPOSITORY_BASE_URL,
  "headers": {
    "Content-Type": 'application/json',
    "Authorization": "0"
  },
  "withCredentials": true,
  "validateStatus": (status) => {
    return status < 500;
  }
});

export default instance;