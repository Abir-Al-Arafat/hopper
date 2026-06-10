export type TCategory = {
  categoryName: string;
  parentage: number;
  serviceType: 'house' | 'rideshare' | 'road';
  _id?: string;
  __v?: number;
  updatedAt?: Date;
  createdAt?: Date;
};
