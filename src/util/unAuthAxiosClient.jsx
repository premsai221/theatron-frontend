import axios from "axios";

const unAuthAxiosClient = axios.create({
    baseURL: 'http://127.0.0.1:8080/auth',
    withCredentials: false
})

export default unAuthAxiosClient;