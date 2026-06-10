import { Request, Response, NextFunction } from 'express';

const parseFormData = (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body, 'req.body in parsedData middleware');
  try {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid request body format' });
  }
};

export default parseFormData;
