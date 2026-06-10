const userProfile = (name: string) => {
  const data = [
    {
      $lookup: {
        from: 'profiles',
        localField: `${name}.profile`,
        foreignField: '_id',
        as: 'profile',
      },
    },
    {
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
  return data;
};

export const aggregationPipelineHelper = {
  userProfile,
};
