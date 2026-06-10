export type TRegister = {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'driver' | 'company';
};
