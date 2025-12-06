import { toast } from 'react-toastify'

export const Toast = (type, message = "Something went wrong") => {
    return void toast[type](message, {
        autoClose: 5000 // 5000 milliseconds
    })
}
