const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const requestModel = require("./../models/requestModel");
const UserModel = require("../models/UserModel");

exports.getAllRequestForAdmin = catchAsync(async (req, res, next) => {
  const requests = await requestModel
    .find({ status: "pending" })
    .populate("bookedby")
    .exec();
  if (!requests) {
    return next(new AppError("No doc found with that id", 404));
  }
  res.status(200).json(requests);
});

exports.updateRequestStatus = catchAsync(async (req, res, next) => {
  const requestId = req.params.requestId;
  const status = req.params.status;

  const request = await requestModel
    .findById(requestId)
    .populate("bookedby")
    .exec();

  if (!request) {
    return next(new AppError("No doc found with that id", 404));
  }

  let date =
    request.Date.getDate() +
    "/" +
    (request.Date.getMonth() + 1) +
    "/" +
    request.Date.getFullYear();

  let data =
    "Date of leaving :" +
    date +
    "\n Email: " +
    request.bookedby.mailId +
    "\n Student Name :" +
    request.bookedby.name +
    "\nRoom No:" +
    request.bookedby.roomNo +
    " " +
    request.bookedby.hostel +
    "\nGate pass request Confirmed";
  QRCode.toFile("./public/myqr.png", data, {}, function (err) {
    if (err) throw err;
    console.log("done");
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_ID,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  if (status == "rejected") {
    var mailOptions = {
      from: process.env.NODEMAILER_ID,
      to: request.bookedby.mailId,
      subject: "GATE-PASS Request",
      text: `${request.bookedby.name} your Gate Pass request is rejected`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else console.log("Mail send successfully");
    });
    await requestModel.findByIdAndDelete(requestId);
    res.status(200).send("Request is rejected");
  } else {
    const requsetUser = await UserModel.findByIdAndUpdate(
      request.bookedby._id,
      {
        $inc: { requestsPerMonth: 1 },
      }
    ).populate("requests");

    if (requsetUser.requestsPerMonth >= parseInt(process.env.requestsPerMonth))
      return next(
        new AppError(
          `You have already made ${parseInt(
            process.env.requestsPerMonth
          )} requests in this month`,
          404
        )
      );
    else {
      request.status = "confirmed";
      //send a mail to user that request is confirmed
      var mailOptions = {
        from: process.env.NODEMAILER_ID,
        to: request.bookedby.mailId,
        subject: "GATE-PASS Request",
        text: `${request.bookedby.name} your Gate Pass request is ${request.status}`,
        attachments: [
          {
            filename: "qr.png",
            path: "./public/myqr.png",
            cid: "unique@cid",
          },
        ],
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else console.log("Mail send successfully");
      });

      await request.save();

      //Delete the other request is requestsPerMonth of ceertain user===2
      if (
        requsetUser.requestsPerMonth ===
        parseInt(process.env.requestsPerMonth) - 1
      ) {
        const remainingPendingRequest = requsetUser.requests.filter((req) => {
          const monthDiff = req.Date.getMonth() - request.Date.getMonth();
          return (
            req.status === "pending" &&
            req._id.toString() !== request._id.toString() &&
            monthDiff === 0
          );
        });
        remainingPendingRequest.map(
          async (req) => await requestModel.findByIdAndDelete(req._id)
        );
      }

      res.status(200).send("Request is Confirmed");
    }
  }
});
