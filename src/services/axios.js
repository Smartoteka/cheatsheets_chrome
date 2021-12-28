import axios from 'axios'

const instance = axios.create({
  // baseURL: 'https://localhost:44383/',
  baseURL: process.env.BASE_URL,
})

export default instance
