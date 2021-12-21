import axios from 'axios'

const instance = axios.create({
  // baseURL: 'https://localhost:44383/',
  baseURL: 'https://www.api.smartoteka.ru',
})

export default instance
