import { TAuthUser } from '../../interface/authUser';
import { minuteToSecond } from '../../utils/minitToSecond';
import Service from '../service/service.model';
import { TCategory } from './category.interface';
import Category from './category.model';

const createCategory = async (payload: TCategory, user: TAuthUser) => {
  const created = await Category.create(payload);
};

const getCategories = async (user: TAuthUser) => {
  const result = await Category.find().lean();
  return result;
};

const updateCategory = async (
  categoryId: string,
  payload: TCategory,
  user: TAuthUser,
) => {
  const updated = await Category.findOneAndUpdate(
    { _id: categoryId },
    payload,
    {
      new: true,
    },
  );

  return updated;
};

const deleteCategory = async (categoryId: string, user: TAuthUser) => {
  const deleted = await Category.findOneAndDelete({ _id: categoryId });
  await Service.deleteMany({ category: categoryId });
};

export const CategoryService = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
