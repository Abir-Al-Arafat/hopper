import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLE } from "../../constant";
import { StripeCartController } from "../stripe/stripe.controller";

export const walletRoutes = Router();

walletRoutes.post('/create-wallet', auth(USER_ROLE.driver,USER_ROLE.hopperCompany), WalletController.walletCreate);
walletRoutes.get('/balance', auth(USER_ROLE.admin, USER_ROLE.hopperCompany, USER_ROLE.company, USER_ROLE.driver), WalletController.getWalletWithBalance);
walletRoutes.post('/onboarding-account', auth(USER_ROLE.driver, USER_ROLE.hopperCompany, USER_ROLE.company), StripeCartController.createOrGetOnboardingStripe);

walletRoutes.post('/payout', auth(USER_ROLE.driver, USER_ROLE.hopperCompany, USER_ROLE.company), WalletController.initiatePayout);
walletRoutes.get('/withdraw-history', auth(USER_ROLE.driver, USER_ROLE.hopperCompany, USER_ROLE.company), WalletController.getPayoutHistory);