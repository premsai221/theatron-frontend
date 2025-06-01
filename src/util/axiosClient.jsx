import axios from "axios";

const axiosClient = axios.create({
    baseURL: 'http://127.0.0.1:8080',
    withCredentials: true
})

export default axiosClient;