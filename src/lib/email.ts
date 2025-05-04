import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_KEY);
export const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };