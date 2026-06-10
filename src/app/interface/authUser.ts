export type TAuthUser = {
  email: string;
  userId: string;
  uid: string;
  profileId: string;
  assignedCompany?: string;
  dispatcherCompany?: string;
  hopperCompany: string;
  myCompany?: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
};
