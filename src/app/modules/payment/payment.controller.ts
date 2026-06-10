import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

const makePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.makePayment(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment created successfully',
    data: result,
  });
});

const confirmPayment = catchAsync(async (req, res) => {
  console.log('Payment confirmation endpoint hit with query:', req.query);
  const result = await PaymentService.confirmPayment(req.query);

  res.send(`
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Success</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: rgba(0, 0, 0, 1);
        }

        .container {
            text-align: center;
            background-color: rgba(160, 160, 160, 0.24);
            padding: 40px 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.233);
            max-width: 400px;
            width: 100%;
        }

        h1 {
            font-size: 30px;
            color: #4caf50;
            margin-bottom: 20px;
        }

        .icon {
            font-size: 60px;
            color: #4caf50;
            margin-bottom: 20px;
        }

        p {
            font-size: 18px;
            color: #fff;
            margin-bottom: 20px;
        }

        .button {
            margin-top: 20px;
            padding: 12px 30px;
            background-color: #4caf50;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }

        .button:hover {
            background-color: #45a049;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="icon">
            &#10004;
        </div>
        <h1>Payment Successful!</h1>
    </div>
</body>

</html>

    `);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment created successfully',
    data: result,
  });
});

const earningStatistic = catchAsync(async (req, res) => {
  const result = await PaymentService.earningStatistic(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'earning statistic fetched successfully',
  });
});

const paymentList = catchAsync(async (req, res) => {
  const result = await PaymentService.paymentList(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'payment list fetched successfully',
  });
});

const paymentAction = catchAsync(async (req, res) => {
  const result = await PaymentService.paymentAction(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'payment action dispatch successfully',
  });
});
const unpaidJobRequestList = catchAsync(async (req, res) => {
  const result = await PaymentService.unpaidJobRequestList(
    req.user as TAuthUser
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'unpaid job request list fetched successfully',
  });
});

export const PaymentController = {
  makePayment,
  paymentList,
  confirmPayment,
  earningStatistic,
  paymentAction,
  unpaidJobRequestList
};
