import axios from 'axios';


const baseDomain = 'g0ocwkh0h2.execute-api.us-west-2.amazonaws.com';
const baseUrl = `https://${baseDomain}/dev`;


const instance = axios.create({
  "baseURL": baseUrl,
  "headers": {
    "Content-Type": 'application/json'
  }
});

export default instance;