/* eslint-disable @typescript-eslint/no-explicit-any */ 
import { paginationFields } from '../constant/pagination';
import pick from './pick';
 

const pickQuery = async (query: Record<string, any>) => {
  const paginationOptions = await pick(query, paginationFields);
  const filters = await Object.fromEntries(
    Object.entries(query).filter(
      ([key, value]) =>
        !paginationFields.includes(key) && value != null && value !== '',
    ),
  );

  return {
    pagination: paginationOptions,
    filters,
  };
};

export default pickQuery;
