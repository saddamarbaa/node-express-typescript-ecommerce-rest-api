import { NextFunction, Request, Response } from 'express';
import { InternalServerError } from 'http-errors';
import { customResponse } from '@src/utils';

import { AuthenticatedRequestBody, PostT, TPaginationResponse } from '@src/interfaces';
import Post from '@src/models/Post.model';

export const getPostsService = async (_req: Request, res: TPaginationResponse) => {
  if (res?.paginatedResults) {
    const { results, next, previous, currentPage, totalDocs, totalPages, lastPage } = res.paginatedResults;
    const responseObject: any = {
      totalDocs: totalDocs || 0,
      totalPages: totalPages || 0,
      lastPage: lastPage || 0,
      count: results?.length || 0,
      currentPage: currentPage || 0,
    };

    if (next) {
      responseObject.nextPage = next;
    }
    if (previous) {
      responseObject.prevPage = previous;
    }

    responseObject.posts = results?.map((postDoc: any) => {
      const { author, ...otherPostInfo } = postDoc._doc;
      return {
        ...otherPostInfo,
        creator: {
          _id: author._id,
          name: author.name,
          surname: author.surname,
          profileImage: author.profileImage,
        },
        request: {
          type: 'Get',
          description: 'Get one post with the id',
          url: `${process.env.API_URL}/api/${process.env.API_VERSION}/feed/posts/${postDoc._doc._id}`,
        },
      };
    });

    return res.status(200).send(
      customResponse<typeof responseObject>({
        success: true,
        error: false,
        message: responseObject.posts.length ? 'Successful Found posts' : 'No post found',
        status: 200,
        data: responseObject,
      })
    );
  }
};

export const createPostService = async (req: AuthenticatedRequestBody<PostT>, res: Response, next: NextFunction) => {
  const { title, content, category } = req.body;

  const userId = req?.user?._id || '';

  const postData = new Post({
    title,
    content,
    category: category?.toLocaleLowerCase(),
    postImage: `/static/uploads/posts/${req?.file?.filename}`,
    author: userId,
  });

  try {
    const createdPost = await Post.create(postData);

    const data = {
      post: createdPost,
    };

    return res.status(201).json(
      customResponse<any>({
        data,
        success: true,
        error: false,
        message: `Successfully added new post`,
        status: 201,
      })
    );
  } catch (error) {
    return next(InternalServerError);
  }
};
