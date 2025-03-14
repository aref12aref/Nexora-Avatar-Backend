import * as httpResponse from "../utils/httpRespone.js";
import HunterSDK from "hunterio";

// export const verifyEmail = async (req, res, next) => {
//     const hunterApiKey = process.env.hunterKey;

//     try {
//         const response = await axios.post(
//             // `https://api.hunter.io/v2/email-verifier?email=${req.body.email}&api_key=${hunterApiKey}`
//             "https://api.hunter.io/v2/email-verifier",
//             {
//                 api_key: hunterApiKey,
//                 email: req.body.email,
//             },
//             {
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         const result = response.data.data;
//         if (result.status === "valid") {
//             next();
//         } else {
//             res.status(400).json(
//                 httpResponse.badResponse(400, "Invalid email address")
//             );
//         }
//     } catch (error) {
//         res.status(500).json(
//             httpResponse.badResponse(500, `Internal Server Error ${error}`)
//         );
//     }
// };

export const verifyEmail = async (req, res, next) => {
    const KEY = process.env.hunterKey;

    const hunter = new HunterSDK(KEY);

    hunter.emailVerifier(
        {
            email: req.body.email,
        },
        (err, body) => {
            if (err !== null) {
                res.status(400).json(
                    httpResponse.badResponse(400, "Invalid email address")
                );
            } else {
                if (
                    body.data.status === "valid" ||
                    (body.data.status === "accept_all" && body.data.score > 65)
                ) {
                    next();
                }
            }
        }
    );
};
