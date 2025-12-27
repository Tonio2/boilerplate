import { NextFunction, Request, Response } from "express";

const debugLogger = (req: Request, res: Response, next: NextFunction) => {
    // Log the request
    console.log("Request:", {
        method: req.method,
        url: req.originalUrl,
        // headers: req.headers,
        body: req.body,
    });

    // Capture the original `res.send` method
    const originalSend = res.send;
    res.send = function (body: any): Response {
        // Log the response
        console.log("Response:", {
            status: res.statusCode,
            // headers: res.getHeaders(),
            body: body,
        });

        // Call the original `res.send` method
        return originalSend.call(this, body);
    };

    next();
};

export default debugLogger;
