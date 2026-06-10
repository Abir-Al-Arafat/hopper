import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import Conversation from './conversation.model';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Message from '../message/message.mode';
import { getCommonPipline } from './conversation.utils';

const createConversation = async (
  data: { receiverId: string },
  user: TAuthUser,
) => {
  let result;
  result = await Conversation.findOne({
    users: { $all: [user.userId, data.receiverId], $size: 2 },
  });

  if (!result) {
    await Conversation.create({
      users: [user.userId, data.receiverId],
    });

    const commonPipline = getCommonPipline(user);

    result = await Conversation.aggregate([
      // Step 1: Match conversations where users are the given pair
      {
        $match: {
          users: {
            $all: [
              new mongoose.Types.ObjectId(String(user.userId)),
              new mongoose.Types.ObjectId(String(data.receiverId)),
            ],
            $size: 2,
          },
        },
      },

      ...commonPipline,
    ]);

  } else {
    const commonPipline = getCommonPipline(user);

    result = await Conversation.aggregate([
      // Step 1: Match conversations where users are the given pair
      {
        $match: {
          users: {
            $all: [
              new mongoose.Types.ObjectId(String(user.userId)),
              new mongoose.Types.ObjectId(String(data.receiverId)),
            ],
            $size: 2,
          },
        },
      },

      ...commonPipline,
    ]);
  }

  return result;
};

const getConversations = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const conversationAggregation = new AggregationQueryBuilder(query);
  const commonPipline = getCommonPipline(user);

  const result = await conversationAggregation
    .customPipeline([
      {
        $match: {
          users: {
            $in: [new mongoose.Types.ObjectId(String(user.userId))],
          },
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$conversationId', '$$convId'] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage',
        },
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },

      ...commonPipline,
    ])
    .sort()
    .paginate()
    .search(['self.name', 'otherUser.name'])
    .execute(Conversation);

  const meta = await conversationAggregation.countTotal(Conversation);

  return { meta, result };
};

const getMessages = async (
  conversationId: string,
  query: Record<string, unknown>,
) => {
  const messageAggregation = new AggregationQueryBuilder(query);

  const result = await messageAggregation
    .customPipeline([
      {
        $match: {
          conversationId: new mongoose.Types.ObjectId(String(conversationId)),
        },
      },
    ])
    .sort()
    .paginate()
    .search(['text_message'])
    .execute(Message);

  const meta = await messageAggregation.countTotal(Message);

  return { meta, result };
};

export const ConversationService = {
  createConversation,
  getConversations,
  getMessages,
};
