import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ConversationService } from './conversation.service';
import { TAuthUser } from '../../interface/authUser';
import User from '../user/user.model';
import AppError from '../../utils/AppError';

const createConversation = catchAsync(async (req, res) => {
  const result = await ConversationService.createConversation(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Conversation created successfully',
    data: result,
  });
});
const createSupportConversation = catchAsync(async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data:any={}
  const adminData= await User.findOne({ role: 'admin' });
  if(!adminData){
    throw new AppError(httpStatus.NOT_FOUND, 'Admin user not found. Please create an admin user first.');
  }
  data.receiverId=adminData._id;

  const result = await ConversationService.createConversation(
    data as { receiverId: string },
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Conversation created successfully',
    data: result,
  });
});

const getConversations = catchAsync(async (req, res) => {
  const result = await ConversationService.getConversations(
    req.user as TAuthUser,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Conversations fetched successfully',
    data: result,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const result = await ConversationService.getMessages(
    req.params.conversationId,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Messages fetched successfully',
    data: result,
  });
});

export const ConversationController = {
  createConversation,
  createSupportConversation,
  getConversations,
  getMessages,
};
