import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { CategoryRoutes } from '../modules/category/category.routes';
import { CompanyRoutes } from '../modules/company/company.routes';
import { ConversationRoutes } from '../modules/conversation/conversation.routes';
import { JobRoutes } from '../modules/job/job.routes';
import { JobRequestRoutes } from '../modules/jobRequest/jobRequest.routes';
import { JoinRequestRoutes } from '../modules/joinRequest/joinRequest.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { PendingPayoutRoutes } from '../modules/pendingPayout/pendingPayout.routes';
import { ProfileRoutes } from '../modules/profile/profile.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { ServiceRoutes } from '../modules/service/service.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { StaticContentRoutes } from '../modules/staticContent/staticContent.routes';
import { walletRoutes } from '../modules/Wallet/wallet.route';
const router = Router();

type TRoutes = {
  path: string;
  route: Router;
};

const routes: TRoutes[] = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/profile',
    route: ProfileRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/category',
    route: CategoryRoutes,
  },
  {
    path: '/service',
    route: ServiceRoutes,
  },
  {
    path: '/company',
    route: CompanyRoutes,
  },
  {
    path: '/job_request',
    route: JobRequestRoutes,
  },
  {
    path: '/join_request',
    route: JoinRequestRoutes,
  },
  {
    path: '/job',
    route: JobRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
  {
    path: '/review',
    route: ReviewRoutes,
  },
  {
    path: '/conversation',
    route: ConversationRoutes,
  },
  {
    path: '/notification',
    route: NotificationRoutes,
  },
  {
    path: '/pending_payout',
    route: PendingPayoutRoutes,
  },
  {
    path: '/static_content',
    route: StaticContentRoutes,
  },
  {
    path: '/wallet',
    route: walletRoutes,
  },
];

routes.forEach((item) => {
  router.use(item.path, item.route);
});

export default router;
