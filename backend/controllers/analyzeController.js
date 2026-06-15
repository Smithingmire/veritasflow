const analyzeVideoService =
require("../services/openRouterService");

exports.analyzeVideo =
async (req, res) => {

    try {

        console.log(
            "BODY:",
            req.body
        );

        const result =
        await analyzeVideoService(
            req.body
        );

        console.log(
            "AI RESPONSE:"
        );

        console.log(
            result.choices[0]
            .message.content
        );

        res.json({
            success: true,
            result:
            result.choices[0]
            .message.content
        });

    } catch (err) {

        console.error(
            "ERROR:"
        );

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};