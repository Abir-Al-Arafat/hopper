import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';

export const getCommonPipline = (user: TAuthUser) => {
  const commonPipline = [
    // Step 2: Add self and other user fields
    {
      $lookup: {
        from: 'users',
        let: { userIds: '$users' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$userIds'],
              },
            },
          },
        ],
        as: 'allUsers',
      },
    },
    {
      $addFields: {
        self: {
          $first: {
            $filter: {
              input: '$allUsers',
              as: 'u',
              cond: {
                $eq: [
                  '$$u._id',
                  new mongoose.Types.ObjectId(String(user.userId)),
                ],
              },
            },
          },
        },
        otherUser: {
          $first: {
            $filter: {
              input: '$allUsers',
              as: 'u',
              cond: {
                $ne: [
                  '$$u._id',
                  new mongoose.Types.ObjectId(String(user.userId)),
                ],
              },
            },
          },
        },
      },
    },

    // Lookup self profile
    {
      $lookup: {
        from: 'profiles',
        localField: 'self.profile',
        foreignField: '_id',
        as: 'self.profile',
      },
    },
    {
      $unwind: {
        path: '$self.profile',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup otherUser profile
    {
      $lookup: {
        from: 'profiles',
        localField: 'otherUser.profile',
        foreignField: '_id',
        as: 'otherUser.profile',
      },
    },
    {
      $unwind: {
        path: '$otherUser.profile',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        users: 0,
        allUsers: 0,
      },
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        updatedAt: 1,
        lastMessage: 1,
        self: {
          _id: '$self._id',
          name: '$self.name',
          image: '$self.profile.image',
        },
        otherUser: {
          _id: '$otherUser._id',
          name: '$otherUser.name',
          image: '$otherUser.profile.image',
        },
      },
    },
  ];

  return commonPipline;
};
