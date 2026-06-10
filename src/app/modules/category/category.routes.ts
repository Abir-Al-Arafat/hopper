import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { CategoryValidation } from './category.validation';
import { CategoryController } from './category.controller';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    validateRequest(CategoryValidation.createCategoryValidationSchema),
    CategoryController.createCategory,
  )
  .get(
    '/',
    auth(
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.customer,
    ),
    CategoryController.getCategories,
  )
  .patch(
    '/edit/:categoryId',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    // validateRequest(CategoryValidation.updateCategoryValidationSchema),
    CategoryController.updateCategory,
  )
  .delete(
    '/delete/:categoryId',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    CategoryController.deleteCategory,
  );

export const CategoryRoutes = router;
