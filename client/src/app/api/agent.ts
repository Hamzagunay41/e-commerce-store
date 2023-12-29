
import axios, {AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { router } from "../router/Routes";
import { PaginatedResponse } from "../models/pagination";
import { store } from "../store/configureStore";

const sleep = () => new Promise(resolve => setTimeout(resolve,400));

axios.defaults.baseURL = 'http://localhost:5000/api/';
axios.defaults.withCredentials = true;
const responseBody = (response: AxiosResponse) => response.data;

axios.interceptors.request.use(config => {
    const token = store.getState().account.user?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

axios.interceptors.response.use(async response => {
    await sleep();
    const pagination = response.headers ['pagination'];
    if (pagination) {
        response.data = new PaginatedResponse(response.data, JSON.parse(pagination));
        return response;
    }
    return response

}, (error: AxiosError) => {
    const {data, status} = error.response as AxiosResponse;
    switch (status) {
        case 400:
            if (data.errors){
                const modelStatesErrors: string[] = [];
                for (const key in data.errors) {
                    if (data.errors[key]) {
                        modelStatesErrors.push(data.errors[key])
                    }  
            }
            throw modelStatesErrors.flat();
        }
            toast.error(data.title);
            break;
        case 401:
            toast.error(data.title);
            break;
        case 500:
            router.navigate('/server-error', {state: {error: data}});
            break;       
        default:
            break;         
    }
    return Promise.reject(error.response);
})

const requests = {
    get: (url: string, params?: URLSearchParams) => axios.get(url, {params}).then(responseBody),
    post: (url: string, body: object) => axios.post(url, body).then(responseBody),
    put: (url: string, body: object) => axios.put(url, body).then(responseBody),
    del: (url: string) => axios.delete(url).then(responseBody)
}

const Catalog = {
    list: (params: URLSearchParams) => requests.get('products', params),
    details: (id: number) => requests.get(`products/${id}`),
    fetchFilters: () => requests.get('products/filters')
}

const TestErrors = {
    get400Error: () => requests.get('buggy/Geçersizİstek'),
    get401Error: () => requests.get('buggy/Yetkisiz'),
    get404Error: () => requests.get('buggy/Bulunamadi'),
    get500Error: () => requests.get('buggy/SunucuHatasi'),
    getValidationError: () => requests.get('buggy/DogrulamaHatasi')
}

const Basket = {
    get: () => requests.get('basket'),
    addItem: (productId: number, quantity = 1) => requests.post(`basket?productId=${productId}&quantity=${quantity}`, {}),
    removeItem: (productId: number, quantity = 1) => requests.del(`basket?productId=${productId}&quantity=${quantity}`)
}


const Account = {
    login: (values: any) => requests.post('account/login', values),
    register: (values: any) => requests.post('account/register', values),
    currentUser: () => requests.get('account/currentUser')
}

const agent = {
    Catalog,
    TestErrors,
    Basket,
    Account
}

export default agent;