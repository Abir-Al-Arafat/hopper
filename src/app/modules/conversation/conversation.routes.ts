import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { ConversationController } from './conversation.controller';

const router = Router();

router
  .post(
    '/create',
    auth(
      USER_ROLE.admin,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    ConversationController.createConversation,
  )
  .post(
    '/support-create',
    auth(
      USER_ROLE.admin,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    ConversationController.createSupportConversation,
  )
  .get(
    '/',
    auth(
      USER_ROLE.admin,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    ConversationController.getConversations,
  )
  .get(
    '/messages/:conversationId',
    auth(
      USER_ROLE.admin,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    ConversationController.getMessages,
  );

export const ConversationRoutes = router;
