import { Request, Response } from "express";

import httpStatus from "http-status";
import { walletService } from "./wallet.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const walletCreate = catchAsync(async (req: Request, res: Response) => {
    const result = await walletService.walletCreate(req.user.userId)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Wallet created successfully',
        data: result,
    });
});
const getWalletWithBalance = catchAsync(async (req: Request, res: Response) => {
    const result = await walletService.getWalletWithBalance(req.user.userId)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get wallet with balance successfully',
        data: result,
    });
});
const getPayoutHistory = catchAsync(async (req: Request, res: Response) => {
    const result = await walletService.getPayoutHistory(req.user.userId, req.query)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get payout history successfully',
        data: result,
    });
});
const initiatePayout = catchAsync(async (req: Request, res: Response) => {
    const userId=req.user.userId
    const amount=req.body.amount

    const result = await walletService.initiatePayout(userId,amount)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payout initiated successfully',
        data: result,
    });
});

export const WalletController = {
    walletCreate,
    getWalletWithBalance,
    getPayoutHistory,
    initiatePayout
}