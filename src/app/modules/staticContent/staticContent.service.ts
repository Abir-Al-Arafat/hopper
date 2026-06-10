import { TAuthUser } from '../../interface/authUser';
import { TStaticContent } from './staticContent.interface';
import StaticContent from './staticContent.model';

const createStaticContent = async (
  user: TAuthUser,
  payload: Partial<TStaticContent>,
) => {
  const faq = await StaticContent.findOne({ type: 'faq' });
  if (payload.type === 'faq' && faq) {
    const result = await StaticContent.findByIdAndUpdate(
      faq._id,
      {
        $push: {
          faq: payload.faq,
        },
        userId: user.userId,
      },
      { new: true },
    );

    return result;
  }

  const result = await StaticContent.findOneAndUpdate(
    { type: payload.type },
    {
      ...payload,
      userId: user.userId,
    },
    {
      new: true,
      upsert: true,
    },
  );

  return result;
};

const getStaticContent = async (query: Record<string, unknown>) => {
  const result = await StaticContent.findOne({ ...query });
  return result;
};

const updateStaticContent = async (
  id: string,
  user: TAuthUser,
  payload: Partial<TStaticContent>,
) => {
  // First, check if this ID is a FAQ item ID (within the faq array)
  const faqDocument = await StaticContent.findOne({
    type: 'faq',
    'faq._id': id,
  });

  // If ID matches a FAQ item, update only that specific FAQ item
  if (faqDocument) {
    const result = await StaticContent.findOneAndUpdate(
      {
        type: 'faq',
        'faq._id': id,
      },
      {
        $set: {
          ...(payload.faq?.[0]?.title && {
            'faq.$.title': payload.faq[0].title,
          }),
          ...(payload.faq?.[0]?.content && {
            'faq.$.content': payload.faq[0].content,
          }),
          userId: user.userId,
        },
      },
      { new: true },
    );
    return result;
  }

  // Otherwise, treat it as a full document ID and update the entire document
  const staticContent = await StaticContent.findById(id);
  if (!staticContent) {
    throw new Error('Static content not found');
  }

  const result = await StaticContent.findByIdAndUpdate(
    id,
    {
      ...payload,
      userId: user.userId,
    },
    { new: true },
  );

  return result;
};

const deleteStaticContent = async (id: string) => {
  // First, check if this ID is a FAQ item ID (within the faq array)
  const faqDocument = await StaticContent.findOne({
    type: 'faq',
    'faq._id': id,
  });

  // If ID matches a FAQ item, remove only that specific FAQ item from the array
  if (faqDocument) {
    const result = await StaticContent.findOneAndUpdate(
      {
        type: 'faq',
        'faq._id': id,
      },
      {
        $pull: {
          faq: { _id: id },
        },
      },
      { new: true },
    );
    return result;
  }

  // Otherwise, treat it as a full document ID and delete the entire document
  const result = await StaticContent.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Static content not found');
  }
  return result;
};

export const StaticContentService = {
  createStaticContent,
  getStaticContent,
  updateStaticContent,
  deleteStaticContent,
};
