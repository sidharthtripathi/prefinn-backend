import {z} from 'zod'
export const querySchema = z.object({
    fullName : z.string(),
    email : z.string().email(),
    mobile : z.string()
})